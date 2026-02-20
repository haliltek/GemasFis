import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { edgeFunctions, receiptService, storageService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useReceiptStore } from '../../store/receiptStore';
import { OcrData, LogoServiceCard, LogoCashAccount } from '../../types/index';
import { formatCurrency } from '../../utils/formatters';

interface Props {
    route: {
        params: {
            imageUri: string;
            receiptId?: string;
            ocrData?: OcrData;
        };
    };
    navigation: any;
}

export function ReceiptFormScreen({ route, navigation }: Props) {
    const { imageUri, ocrData } = route.params;
    const { user } = useAuthStore();
    const { addReceipt } = useReceiptStore();

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingLogoData, setIsLoadingLogoData] = useState(true);

    // Form state - pre-filled from OCR
    const [amount, setAmount] = useState(ocrData?.totalAmount?.toString() || '');
    const [currency, setCurrency] = useState(ocrData?.currency || 'TRY');
    const [date, setDate] = useState(ocrData?.date || new Date().toISOString().split('T')[0]);
    const [merchantName, setMerchantName] = useState(ocrData?.merchantName || '');
    const [description, setDescription] = useState('');
    const [taxNumber, setTaxNumber] = useState(ocrData?.taxNumber || '');
    const [kdvAmount, setKdvAmount] = useState(ocrData?.kdvAmount?.toString() || '');

    // Logo ERP fields
    const [serviceCards, setServiceCards] = useState<LogoServiceCard[]>([]);
    const [cashAccounts, setCashAccounts] = useState<LogoCashAccount[]>([]);
    const [selectedService, setSelectedService] = useState<LogoServiceCard | null>(null);
    const [selectedCash, setSelectedCash] = useState<LogoCashAccount | null>(null);

    // Sheet selectors
    const [showServicePicker, setShowServicePicker] = useState(false);
    const [showCashPicker, setShowCashPicker] = useState(false);

    useEffect(() => {
        loadLogoData();
    }, []);

    const loadLogoData = async () => {
        try {
            const [cards, accounts] = await Promise.all([
                edgeFunctions.getLogoServiceCards(),
                edgeFunctions.getLogoCashAccounts(),
            ]);
            setServiceCards(cards);
            setCashAccounts(accounts);

            // Auto-select top AI suggestion if available
            if (ocrData && route.params.ocrData === ocrData) {
                // This would use aiSuggestions from the scan step
            }
        } catch (e) {
            console.error('Logo verisi yüklenemedi:', e);
        } finally {
            setIsLoadingLogoData(false);
        }
    };

    const handleSave = async (transferToLogo: boolean = false) => {
        if (!amount || !merchantName || !date) {
            Alert.alert('Eksik Bilgi', 'Tutar, satıcı ve tarih alanları zorunludur.');
            return;
        }
        if (transferToLogo && (!selectedService || !selectedCash)) {
            Alert.alert('Logo Bilgileri Eksik', 'Logo\'ya aktarmak için masraf kalemi ve kasa/banka seçimi zorunludur.');
            return;
        }
        if (!user) return;

        setIsSaving(true);
        try {
            // Create receipt record (Supabase DB)
            const receipt = await receiptService.createReceipt({
                userId: user.uid,
                userName: user.displayName,
                imageUrl: imageUri,
                amount: parseFloat(amount),
                currency,
                date,
                merchantName,
                description,
                taxNumber,
                kdvAmount: kdvAmount ? parseFloat(kdvAmount) : undefined,
                kdvRate: 18,
                logoStatus: transferToLogo ? 'processing' : 'draft',
                logoExpenseCode: selectedService?.code,
                logoExpenseName: selectedService?.name,
                logoCashAccountCode: selectedCash?.code,
                logoCashAccountName: selectedCash?.name,
                rawOcrData: ocrData,
                aiConfidenceScore: 0,
            });

            addReceipt(receipt);

            if (transferToLogo && selectedService && selectedCash) {
                // Transfer to Logo ERP via Edge Function
                const result = await edgeFunctions.transferToLogo({
                    receiptId: receipt.id,
                    expenseCode: selectedService.code,
                    cashAccountCode: selectedCash.code,
                    description,
                });

                if (result.success && result.logoRefNo) {
                    await receiptService.updateReceipt(receipt.id, {
                        logoStatus: 'success',
                        logoRefNo: result.logoRefNo,
                        logoTransferredAt: new Date(),
                    });
                    Alert.alert(
                        '✅ Logo\'ya Aktarıldı',
                        `Gider fişi başarıyla oluşturuldu.\nRef No: ${result.logoRefNo}`,
                        [{ text: 'Tamam', onPress: () => navigation.navigate('MainTabs') }]
                    );
                } else {
                    await receiptService.updateReceipt(receipt.id, {
                        logoStatus: 'failed',
                        logoErrorMessage: result.errorMessage,
                    });
                    Alert.alert(
                        '⚠️ Aktarım Başarısız',
                        `Fiş kaydedildi ancak Logo'ya aktarılamadı.\nHata: ${result.errorMessage}\n\nGeçmiş ekranından yeniden deneyebilirsiniz.`,
                        [{ text: 'Tamam', onPress: () => navigation.navigate('MainTabs') }]
                    );
                }
            } else {
                Alert.alert('💾 Kaydedildi', 'Fiş taslak olarak kaydedildi.', [
                    { text: 'Tamam', onPress: () => navigation.navigate('MainTabs') },
                ]);
            }
        } catch (err: any) {
            Alert.alert('Hata', err.message || 'Kaydetme sırasında hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    const getCashIcon = (type: string) => {
        if (type === 'bank') return '🏦';
        if (type === 'credit_card') return '💳';
        return '💵';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Fiş Bilgileri</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Receipt Preview */}
                <View style={styles.previewRow}>
                    <Image source={{ uri: imageUri }} style={styles.previewThumb} resizeMode="cover" />
                    <View style={styles.previewInfo}>
                        <View style={styles.ocrBadge}>
                            <Text style={styles.ocrBadgeText}>🤖 OCR ile dolduruldu</Text>
                        </View>
                        <Text style={styles.previewNote}>
                            Aşağıdaki bilgileri kontrol edin ve gerekirse düzenleyin.
                        </Text>
                    </View>
                </View>

                {/* ── Section: Fiş Bilgileri ── */}
                <Text style={styles.sectionTitle}>📋 Fiş Bilgileri</Text>
                <View style={styles.card}>
                    {/* Amount */}
                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGrow}>
                            <Text style={styles.fieldLabel}>Tutar *</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>
                        <View style={styles.currencyField}>
                            <Text style={styles.fieldLabel}>Para Birimi</Text>
                            <View style={styles.currencyBtns}>
                                {['TRY', 'USD', 'EUR'].map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => setCurrency(c)}
                                        style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                                    >
                                        <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>
                                            {c}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Merchant */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Satıcı / Firma *</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={merchantName}
                                onChangeText={setMerchantName}
                                placeholder="örn. Migros Ticaret A.Ş."
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* Date */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Tarih *</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={Colors.textMuted}
                            />
                        </View>
                    </View>

                    {/* KDV & Tax No */}
                    <View style={styles.fieldRow}>
                        <View style={styles.fieldGrow}>
                            <Text style={styles.fieldLabel}>KDV Tutarı</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={kdvAmount}
                                    onChangeText={setKdvAmount}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>
                        <View style={styles.fieldGrow}>
                            <Text style={styles.fieldLabel}>Vergi No</Text>
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.input}
                                    value={taxNumber}
                                    onChangeText={setTaxNumber}
                                    keyboardType="number-pad"
                                    placeholder="1234567890"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Açıklama</Text>
                        <View style={[styles.inputWrapper, { minHeight: 70 }]}>
                            <TextInput
                                style={[styles.input, { textAlignVertical: 'top' }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="örn. Müşteri öğle yemeği"
                                placeholderTextColor={Colors.textMuted}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>
                </View>

                {/* ── Section: Logo ERP ── */}
                <Text style={styles.sectionTitle}>🔗 Logo Tiger ERP</Text>
                <View style={styles.card}>
                    {isLoadingLogoData ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.loadingText}>Logo verileri yükleniyor...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Service Card Picker */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Masraf Kalemi *</Text>
                                <TouchableOpacity
                                    style={[styles.pickerBtn, selectedService && styles.pickerBtnSelected]}
                                    onPress={() => setShowServicePicker(!showServicePicker)}
                                >
                                    <Text style={selectedService ? styles.pickerValueText : styles.pickerPlaceholder}>
                                        {selectedService ? selectedService.name : '— Masraf kalemi seçin —'}
                                    </Text>
                                    <Text style={styles.pickerArrow}>{showServicePicker ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                                {showServicePicker && (
                                    <View style={styles.pickerList}>
                                        {serviceCards.map((card) => (
                                            <TouchableOpacity
                                                key={card.code}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedService?.code === card.code && styles.pickerItemActive,
                                                ]}
                                                onPress={() => {
                                                    setSelectedService(card);
                                                    setShowServicePicker(false);
                                                }}
                                            >
                                                <View>
                                                    <Text style={[styles.pickerItemName, selectedService?.code === card.code && styles.pickerItemNameActive]}>
                                                        {card.name}
                                                    </Text>
                                                    <Text style={styles.pickerItemCode}>{card.code}</Text>
                                                </View>
                                                {selectedService?.code === card.code && (
                                                    <Text style={styles.pickerCheck}>✓</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Cash Account Picker */}
                            <View style={styles.field}>
                                <Text style={styles.fieldLabel}>Kasa / Banka *</Text>
                                <TouchableOpacity
                                    style={[styles.pickerBtn, selectedCash && styles.pickerBtnSelected]}
                                    onPress={() => setShowCashPicker(!showCashPicker)}
                                >
                                    <Text style={selectedCash ? styles.pickerValueText : styles.pickerPlaceholder}>
                                        {selectedCash
                                            ? `${getCashIcon(selectedCash.type)} ${selectedCash.name}`
                                            : '— Kasa veya banka seçin —'}
                                    </Text>
                                    <Text style={styles.pickerArrow}>{showCashPicker ? '▲' : '▼'}</Text>
                                </TouchableOpacity>
                                {showCashPicker && (
                                    <View style={styles.pickerList}>
                                        {cashAccounts.map((acc) => (
                                            <TouchableOpacity
                                                key={acc.code}
                                                style={[
                                                    styles.pickerItem,
                                                    selectedCash?.code === acc.code && styles.pickerItemActive,
                                                ]}
                                                onPress={() => {
                                                    setSelectedCash(acc);
                                                    setShowCashPicker(false);
                                                }}
                                            >
                                                <View style={styles.cashItemLeft}>
                                                    <Text style={styles.cashItemIcon}>{getCashIcon(acc.type)}</Text>
                                                    <View>
                                                        <Text style={[styles.pickerItemName, selectedCash?.code === acc.code && styles.pickerItemNameActive]}>
                                                            {acc.name}
                                                        </Text>
                                                        <Text style={styles.pickerItemCode}>{acc.code} · {acc.currency}</Text>
                                                    </View>
                                                </View>
                                                {selectedCash?.code === acc.code && (
                                                    <Text style={styles.pickerCheck}>✓</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </>
                    )}
                </View>

                {/* Summary */}
                {amount && merchantName && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>💬 Özet</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tutar</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(parseFloat(amount) || 0, currency)}</Text>
                        </View>
                        {selectedService && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Masraf Kalemi</Text>
                                <Text style={styles.summaryValue}>{selectedService.name}</Text>
                            </View>
                        )}
                        {selectedCash && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Ödeme Şekli</Text>
                                <Text style={styles.summaryValue}>{selectedCash.name}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.draftBtn, isSaving && { opacity: 0.6 }]}
                        onPress={() => handleSave(false)}
                        disabled={isSaving}
                    >
                        <Text style={styles.draftBtnText}>💾 Taslak Kaydet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.transferBtn, isSaving && { opacity: 0.6 }]}
                        onPress={() => handleSave(true)}
                        disabled={isSaving}
                        activeOpacity={0.85}
                    >
                        {isSaving ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={[styles.transferBtnText, { marginLeft: Spacing.sm }]}>İşleniyor...</Text>
                            </View>
                        ) : (
                            <Text style={styles.transferBtnText}>🚀 Logo'ya Aktar</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing.base,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { padding: Spacing.xs },
    backBtnText: { fontSize: Typography.base, color: Colors.primaryLight, fontWeight: Typography.weights.medium },
    title: { fontSize: Typography.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
    scrollContent: { padding: Spacing['2xl'], paddingBottom: 100 },

    // Preview
    previewRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.md,
    },
    previewThumb: { width: 64, height: 80, borderRadius: BorderRadius.md, flexShrink: 0 },
    previewInfo: { flex: 1 },
    ocrBadge: {
        backgroundColor: Colors.successBg,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
        marginBottom: Spacing.xs,
    },
    ocrBadgeText: { fontSize: Typography.xs, color: Colors.success, fontWeight: Typography.weights.semibold },
    previewNote: { fontSize: Typography.xs, color: Colors.textTertiary, lineHeight: 16 },

    // Section
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.weights.semibold,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
    },

    // Fields
    field: { marginBottom: Spacing.md },
    fieldRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    fieldGrow: { flex: 1 },
    fieldLabel: { fontSize: Typography.xs, fontWeight: Typography.weights.medium, color: Colors.textSecondary, marginBottom: Spacing.xs },
    inputWrapper: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        minHeight: 44,
        justifyContent: 'center',
    },
    input: { fontSize: Typography.base, color: Colors.textPrimary, paddingVertical: Spacing.sm },

    // Currency
    currencyField: { width: 110 },
    currencyBtns: { flexDirection: 'row', gap: Spacing.xs, marginTop: 4 },
    currencyBtn: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.backgroundSecondary,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    currencyBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    currencyBtnText: { fontSize: Typography.xs, color: Colors.textTertiary, fontWeight: Typography.weights.semibold },
    currencyBtnTextActive: { color: Colors.textPrimary },

    // Pickers
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        minHeight: 44,
    },
    pickerBtnSelected: { borderColor: Colors.primary + '60' },
    pickerPlaceholder: { fontSize: Typography.sm, color: Colors.textMuted },
    pickerValueText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weights.medium, flex: 1 },
    pickerArrow: { fontSize: Typography.xs, color: Colors.textTertiary, marginLeft: Spacing.sm },
    pickerList: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: Spacing.xs,
        overflow: 'hidden',
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    pickerItemActive: { backgroundColor: Colors.infoBg },
    pickerItemName: { fontSize: Typography.sm, color: Colors.textPrimary },
    pickerItemNameActive: { color: Colors.primaryLight, fontWeight: Typography.weights.semibold },
    pickerItemCode: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
    pickerCheck: { fontSize: 16, color: Colors.primary },
    cashItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm },
    cashItemIcon: { fontSize: 20 },

    // Summary
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
        marginBottom: Spacing.xl,
    },
    summaryTitle: { fontSize: Typography.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.md },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    summaryLabel: { fontSize: Typography.sm, color: Colors.textTertiary },
    summaryAmount: { fontSize: Typography.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
    summaryValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weights.medium, maxWidth: '60%', textAlign: 'right' },

    // Actions
    actionButtons: { gap: Spacing.sm },
    draftBtn: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 52,
        justifyContent: 'center',
    },
    draftBtnText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
    transferBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
        ...Shadows.primary,
    },
    transferBtnText: { fontSize: Typography.lg, color: Colors.textPrimary, fontWeight: Typography.weights.bold },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    loadingText: { fontSize: Typography.sm, color: Colors.textTertiary },
});
