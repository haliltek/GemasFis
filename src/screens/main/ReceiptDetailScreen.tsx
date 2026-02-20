import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Animated,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useReceiptStore } from '../../store/receiptStore';
import { receiptService, edgeFunctions } from '../../services';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDateTime, formatDate, getRelativeTime } from '../../utils/formatters';
import { Receipt } from '../../types/index';

interface Props {
    route: { params: { receiptId: string } };
    navigation: any;
}

export function ReceiptDetailScreen({ route, navigation }: Props) {
    const { receiptId } = route.params;
    const { receipts, updateReceipt } = useReceiptStore();
    const [receipt, setReceipt] = useState<Receipt | null>(
        receipts.find((r) => r.id === receiptId) || null
    );
    const [isTransferring, setIsTransferring] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();

        if (!receipt) {
            receiptService.getReceiptById(receiptId).then((r) => {
                if (r) setReceipt(r);
            });
        }
    }, []);

    const handleRetryTransfer = async () => {
        if (!receipt?.logoExpenseCode || !receipt?.logoCashAccountCode) {
            Alert.alert(
                'Eksik Bilgi',
                'Logo masraf kalemi veya kasa bilgisi eksik. Lütfen fişi düzenleyin.',
                [{ text: 'Tamam' }]
            );
            return;
        }

        Alert.alert('Logo\'ya Yeniden Aktar', 'Bu fişi Logo ERP\'ye yeniden aktarmak istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Evet, Aktar',
                onPress: async () => {
                    setIsTransferring(true);
                    try {
                        const result = await edgeFunctions.transferToLogo({
                            receiptId: receipt.id,
                            expenseCode: receipt.logoExpenseCode!,
                            cashAccountCode: receipt.logoCashAccountCode!,
                            description: receipt.description,
                        });

                        const updates: Partial<Receipt> = result.success
                            ? { logoStatus: 'success', logoRefNo: result.logoRefNo, logoTransferredAt: new Date(), logoErrorMessage: undefined }
                            : { logoStatus: 'failed', logoErrorMessage: result.errorMessage };

                        await receiptService.updateReceipt(receipt.id, updates);
                        updateReceipt(receipt.id, updates);
                        setReceipt((prev) => (prev ? { ...prev, ...updates } : prev));

                        Alert.alert(
                            result.success ? '✅ Başarılı' : '❌ Başarısız',
                            result.success
                                ? `Logo\'ya aktarıldı. Ref: ${result.logoRefNo}`
                                : `Hata: ${result.errorMessage}`
                        );
                    } catch (e: any) {
                        Alert.alert('Hata', e.message);
                    } finally {
                        setIsTransferring(false);
                    }
                },
            },
        ]);
    };

    const handleDelete = () => {
        Alert.alert('Fişi Sil', 'Bu fişi silmek istediğinizden emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: async () => {
                    await receiptService.deleteReceipt(receiptId);
                    navigation.goBack();
                },
            },
        ]);
    };

    if (!receipt) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Geri</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Fiş Detayı</Text>
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Receipt Image */}
                    <View style={styles.imageCard}>
                        <Image
                            source={{ uri: receipt.imageUrl }}
                            style={styles.receiptImage}
                            resizeMode="contain"
                        />
                        <View style={styles.imageOverlay}>
                            <StatusBadge status={receipt.logoStatus} />
                        </View>
                    </View>

                    {/* Merchant + Amount Hero */}
                    <View style={styles.heroSection}>
                        <Text style={styles.merchantName}>{receipt.merchantName}</Text>
                        <Text style={styles.amount}>
                            {formatCurrency(receipt.amount, receipt.currency)}
                        </Text>
                        {receipt.kdvAmount && (
                            <Text style={styles.kdvText}>
                                KDV dahil: {formatCurrency(receipt.kdvAmount, receipt.currency)}
                            </Text>
                        )}
                        <Text style={styles.date}>{formatDate(receipt.date)}</Text>
                    </View>

                    {/* AI Confidence */}
                    {receipt.aiConfidenceScore !== undefined && (
                        <View style={styles.aiCard}>
                            <Text style={styles.aiLabel}>🤖 Gemini AI Doğruluk</Text>
                            <View style={styles.aiBar}>
                                <View
                                    style={[
                                        styles.aiFill,
                                        {
                                            width: `${receipt.aiConfidenceScore * 100}%`,
                                            backgroundColor:
                                                receipt.aiConfidenceScore > 0.8
                                                    ? Colors.success
                                                    : receipt.aiConfidenceScore > 0.6
                                                        ? Colors.warning
                                                        : Colors.error,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.aiScore}>
                                {Math.round(receipt.aiConfidenceScore * 100)}%
                            </Text>
                        </View>
                    )}

                    {/* Details Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Fiş Bilgileri</Text>
                        <View style={styles.detailCard}>
                            {[
                                { label: 'Satıcı', value: receipt.merchantName },
                                { label: 'Tutar', value: formatCurrency(receipt.amount, receipt.currency) },
                                receipt.kdvAmount ? { label: 'KDV', value: formatCurrency(receipt.kdvAmount, receipt.currency) } : null,
                                { label: 'Tarih', value: formatDate(receipt.date) },
                                receipt.taxNumber ? { label: 'Vergi No', value: receipt.taxNumber } : null,
                                receipt.description ? { label: 'Açıklama', value: receipt.description } : null,
                                { label: 'Eklenme', value: getRelativeTime(receipt.createdAt) },
                            ]
                                .filter(Boolean)
                                .map((item) => (
                                    <View key={item!.label} style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>{item!.label}</Text>
                                        <Text style={styles.detailValue}>{item!.value}</Text>
                                    </View>
                                ))}
                        </View>
                    </View>

                    {/* Logo ERP Status */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🔗 Logo Tiger ERP</Text>
                        <View style={styles.detailCard}>
                            <View style={styles.logoStatusRow}>
                                <Text style={styles.detailLabel}>Durum</Text>
                                <StatusBadge status={receipt.logoStatus} />
                            </View>

                            {receipt.logoExpenseName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Masraf Kalemi</Text>
                                    <Text style={styles.detailValue}>{receipt.logoExpenseName}</Text>
                                </View>
                            )}
                            {receipt.logoCashAccountName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Kasa / Banka</Text>
                                    <Text style={styles.detailValue}>{receipt.logoCashAccountName}</Text>
                                </View>
                            )}
                            {receipt.logoRefNo && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Referans No</Text>
                                    <Text style={[styles.detailValue, { color: Colors.success }]}>
                                        {receipt.logoRefNo}
                                    </Text>
                                </View>
                            )}
                            {receipt.logoTransferredAt && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Aktarım Tarihi</Text>
                                    <Text style={styles.detailValue}>
                                        {formatDateTime(receipt.logoTransferredAt)}
                                    </Text>
                                </View>
                            )}
                            {receipt.logoStatus === 'failed' && receipt.logoErrorMessage && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorBoxTitle}>⚠️ Hata Detayı</Text>
                                    <Text style={styles.errorBoxText}>{receipt.logoErrorMessage}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsSection}>
                        {(receipt.logoStatus === 'failed' || receipt.logoStatus === 'pending' || receipt.logoStatus === 'draft') && (
                            <TouchableOpacity
                                style={[styles.transferBtn, isTransferring && { opacity: 0.7 }]}
                                onPress={handleRetryTransfer}
                                disabled={isTransferring}
                                activeOpacity={0.85}
                            >
                                {isTransferring ? (
                                    <View style={styles.transferBtnRow}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.transferBtnText}>Aktarılıyor...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.transferBtnText}>
                                        {receipt.logoStatus === 'failed' ? '🔄 Yeniden Aktar' : '🚀 Logo\'ya Aktar'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {receipt.logoStatus === 'success' && (
                            <View style={styles.successBanner}>
                                <Text style={styles.successBannerIcon}>✅</Text>
                                <View>
                                    <Text style={styles.successBannerTitle}>Logo ERP'ye Aktarıldı</Text>
                                    <Text style={styles.successBannerSub}>Ref: {receipt.logoRefNo}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: { padding: Spacing.xs },
    backBtnText: { fontSize: Typography.base, color: Colors.primaryLight, fontWeight: Typography.weights.medium },
    title: { fontSize: Typography.lg, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
    deleteBtn: { padding: Spacing.xs },
    deleteBtnText: { fontSize: 22 },
    scrollContent: { paddingBottom: 100 },

    // Image
    imageCard: {
        margin: Spacing['2xl'],
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 260,
        ...Shadows.md,
    },
    receiptImage: { width: '100%', height: '100%' },
    imageOverlay: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
    },

    // Hero
    heroSection: {
        paddingHorizontal: Spacing['2xl'],
        marginBottom: Spacing.xl,
    },
    merchantName: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    amount: {
        fontSize: Typography['4xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
        letterSpacing: -1,
    },
    kdvText: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 2 },
    date: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.xs },

    // AI Card
    aiCard: {
        marginHorizontal: Spacing['2xl'],
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.base,
        gap: Spacing.sm,
    },
    aiLabel: { fontSize: Typography.xs, color: Colors.textTertiary },
    aiBar: { flex: 1, height: 6, backgroundColor: Colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' },
    aiFill: { height: '100%', borderRadius: 3 },
    aiScore: { fontSize: Typography.sm, fontWeight: Typography.weights.bold, color: Colors.textPrimary, width: 36, textAlign: 'right' },

    // Sections
    section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
    sectionTitle: { fontSize: Typography.base, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
    detailCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    logoStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailLabel: { fontSize: Typography.sm, color: Colors.textTertiary, flex: 1 },
    detailValue: {
        fontSize: Typography.sm,
        color: Colors.textPrimary,
        fontWeight: Typography.weights.medium,
        flex: 2,
        textAlign: 'right',
    },
    errorBox: {
        backgroundColor: Colors.errorBg,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    errorBoxTitle: { fontSize: Typography.sm, fontWeight: Typography.weights.semibold, color: Colors.error, marginBottom: Spacing.xs },
    errorBoxText: { fontSize: Typography.xs, color: Colors.error + 'CC', lineHeight: 18 },

    // Actions
    actionsSection: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['2xl'] },
    transferBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
        minHeight: 56,
        justifyContent: 'center',
        ...Shadows.primary,
    },
    transferBtnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    transferBtnText: { fontSize: Typography.lg, fontWeight: Typography.weights.bold, color: '#fff' },
    successBanner: {
        backgroundColor: Colors.successBg,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${Colors.success}40`,
        gap: Spacing.md,
    },
    successBannerIcon: { fontSize: 32 },
    successBannerTitle: { fontSize: Typography.base, fontWeight: Typography.weights.bold, color: Colors.success },
    successBannerSub: { fontSize: Typography.sm, color: Colors.success + 'CC', marginTop: 2 },
});
