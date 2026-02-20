import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useReceiptStore } from '../../store/receiptStore';
import { receiptService } from '../../services';
import { ReceiptCard } from '../../components/ReceiptCard';
import { formatCurrency } from '../../utils/formatters';
import { LogoStatus, Receipt } from '../../types/index';

const FILTERS: { label: string; value: LogoStatus | 'all' }[] = [
    { label: 'Tümü', value: 'all' },
    { label: '✅ Aktarıldı', value: 'success' },
    { label: '⏳ Bekliyor', value: 'pending' },
    { label: '❌ Hatalı', value: 'failed' },
    { label: '📝 Taslak', value: 'draft' },
];

export function HistoryScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { receipts, setReceipts } = useReceiptStore();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<LogoStatus | 'all'>('all');
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const load = async () => {
        if (!user) return;
        const data = await receiptService.getReceipts(user.uid);
        setReceipts(data);
    };

    useEffect(() => {
        load();
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const filtered = receipts.filter((r) => {
        const matchSearch = !search ||
            r.merchantName.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = activeFilter === 'all' || r.logoStatus === activeFilter;
        return matchSearch && matchFilter;
    });

    const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);

    const getCount = (f: LogoStatus | 'all') =>
        f === 'all' ? receipts.length : receipts.filter(r => r.logoStatus === f).length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Geçmiş Fişler</Text>
                    <Text style={styles.subtitle}>{filtered.length} fiş · {formatCurrency(totalAmount, 'TRY')}</Text>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Satıcı adı, açıklama ara..."
                        placeholderTextColor={Colors.textTertiary}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Text style={{ color: Colors.textTertiary, fontSize: 18 }}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Chips */}
                <FlatList
                    horizontal
                    data={FILTERS}
                    keyExtractor={(f) => f.value}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContainer}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            style={[styles.chip, activeFilter === f.value && styles.chipActive]}
                            onPress={() => setActiveFilter(f.value)}
                        >
                            <Text style={[styles.chipText, activeFilter === f.value && styles.chipTextActive]}>
                                {f.label} ({getCount(f.value)})
                            </Text>
                        </TouchableOpacity>
                    )}
                />

                {/* List */}
                <FlatList
                    data={filtered}
                    keyExtractor={(r) => r.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 48 }}>📭</Text>
                            <Text style={styles.emptyText}>
                                {search ? 'Aramanızla eşleşen fiş bulunamadı' : 'Bu kategoride fiş yok'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item, index }) => (
                        <ReceiptCard
                            receipt={item}
                            delay={index * 60}
                            onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
                        />
                    )}
                />
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: Spacing['2xl'], paddingTop: Spacing.base, paddingBottom: Spacing.sm },
    title: { fontSize: Typography['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary },
    subtitle: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 2 },

    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.surface, marginHorizontal: Spacing['2xl'],
        borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md,
        borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
    },
    searchIcon: { fontSize: 16, marginRight: Spacing.sm },
    searchInput: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base, paddingVertical: Spacing.md },

    filtersContainer: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing.md, gap: Spacing.sm },
    chip: {
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
        borderWidth: 1, borderColor: Colors.border,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
    chipTextActive: { color: '#fff' },

    listContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: 100 },
    emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
    emptyText: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' },
});
