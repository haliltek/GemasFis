import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useReceiptStore } from '../../store/receiptStore';
import { receiptService } from '../../services';
import { ReceiptCard } from '../../components/ReceiptCard';
import { Receipt, LogoStatus } from '../../types/index';
import { formatCurrency } from '../../utils/formatters';

type FilterStatus = 'all' | LogoStatus;

const STATUS_FILTERS: { label: string; value: FilterStatus; icon: string }[] = [
    { label: 'Tümü', value: 'all', icon: '📋' },
    { label: 'Aktarıldı', value: 'success', icon: '✅' },
    { label: 'Bekleyen', value: 'pending', icon: '⏳' },
    { label: 'Hatalı', value: 'failed', icon: '❌' },
    { label: 'Taslak', value: 'draft', icon: '📝' },
];

export function HistoryScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { receipts, setReceipts } = useReceiptStore();
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadReceipts();
    }, []);

    const loadReceipts = async () => {
        if (!user) return;
        try {
            const recs = await receiptService.getReceipts(user.uid);
            setReceipts(recs);
        } catch (e) {
            console.error('Fişler yüklenemedi:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadReceipts();
        setRefreshing(false);
    };

    const filteredReceipts = receipts.filter((r: Receipt) => {
        const matchesFilter = activeFilter === 'all' || r.logoStatus === activeFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            r.merchantName?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.logoRefNo?.toLowerCase().includes(q) ||
            r.logoExpenseName?.toLowerCase().includes(q);
        return matchesFilter && matchesSearch;
    });

    // Total of filtered receipts
    const filteredTotal = filteredReceipts.reduce((s: number, r: Receipt) => s + r.amount, 0);

    const renderItem = useCallback(
        ({ item, index }: { item: Receipt; index: number }) => (
            <ReceiptCard
                receipt={item}
                delay={index < 5 ? index * 60 : 0}
                onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
            />
        ),
        [navigation]
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Fiş Geçmişi</Text>
                {filteredReceipts.length > 0 && (
                    <Text style={styles.totalText}>
                        {filteredReceipts.length} fiş · {formatCurrency(filteredTotal, 'TRY')}
                    </Text>
                )}
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Satıcı, açıklama veya ref no ara..."
                    placeholderTextColor={Colors.textMuted}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={styles.clearSearch}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Status Filter Chips */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={STATUS_FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.value}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => {
                        const count =
                            item.value === 'all'
                                ? receipts.length
                                : receipts.filter((r: Receipt) => r.logoStatus === item.value).length;
                        const isActive = activeFilter === item.value;
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveFilter(item.value)}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.filterChipIcon}>{item.icon}</Text>
                                <Text
                                    style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                                >
                                    {item.label}
                                </Text>
                                {count > 0 && (
                                    <View style={[styles.filterCount, isActive && styles.filterCountActive]}>
                                        <Text
                                            style={[styles.filterCountText, isActive && styles.filterCountTextActive]}
                                        >
                                            {count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Receipt List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Fişler yükleniyor...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredReceipts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>
                                {searchQuery ? '🔍' : activeFilter !== 'all' ? '📂' : '🧾'}
                            </Text>
                            <Text style={styles.emptyTitle}>
                                {searchQuery
                                    ? 'Sonuç bulunamadı'
                                    : activeFilter !== 'all'
                                        ? 'Bu kategoride fiş yok'
                                        : 'Henüz fiş eklenmemiş'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery
                                    ? `"${searchQuery}" için eşleşen kayıt yok`
                                    : 'Kamera sekmesinden fiş tarayarak başlayın'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing.base,
        paddingBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
    },
    totalText: { fontSize: Typography.sm, color: Colors.textTertiary },
    // Search
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        marginHorizontal: Spacing['2xl'],
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 46,
    },
    searchIcon: { fontSize: 16, marginRight: Spacing.sm },
    searchInput: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.textPrimary,
        paddingVertical: Spacing.sm,
    },
    clearSearch: { fontSize: 16, color: Colors.textTertiary, padding: Spacing.xs },
    // Filter
    filterContainer: { marginBottom: Spacing.sm },
    filterList: { paddingHorizontal: Spacing['2xl'], gap: Spacing.sm },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.xs,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipIcon: { fontSize: 13 },
    filterChipText: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.weights.medium,
    },
    filterChipTextActive: { color: Colors.textPrimary },
    filterCount: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 8,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
    filterCountText: { fontSize: 10, color: Colors.textTertiary, fontWeight: 'bold' },
    filterCountTextActive: { color: Colors.textPrimary },
    // List
    listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['4xl'] + 60 },
    // Loading
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
    loadingText: { fontSize: Typography.sm, color: Colors.textTertiary },
    // Empty
    emptyState: { alignItems: 'center', paddingTop: Spacing['4xl'] },
    emptyIcon: { fontSize: 52, marginBottom: Spacing.base },
    emptyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.weights.semibold,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    emptySubtitle: {
        fontSize: Typography.sm,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: Spacing['2xl'],
    },
});
