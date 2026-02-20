import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useReceiptStore } from '../../store/receiptStore';
import { receiptService, authService } from '../../services';
import { ReceiptCard } from '../../components/ReceiptCard';
import { formatCurrency, getCurrentMonthKey, getMonthDisplayName } from '../../utils/formatters';
import { CategoryBreakdown } from '../../types/index';

export function DashboardScreen({ navigation }: any) {
    const { user, logout } = useAuthStore();
    const { receipts, monthlyStats, setReceipts, setMonthlyStats, isLoading, setLoading } = useReceiptStore();
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [recs, stats] = await Promise.all([
                receiptService.getReceipts(user.uid),
                receiptService.getMonthlyStats(user.uid, getCurrentMonthKey()),
            ]);
            setReceipts(recs);
            setMonthlyStats(stats);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await authService.signOut();
        logout();
    };

    const recentReceipts = receipts.slice(0, 5);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Merhaba, {user?.displayName?.split(' ')[0]} 👋</Text>
                        <Text style={styles.subGreeting}>{getMonthDisplayName(getCurrentMonthKey())}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Text style={{ fontSize: 20 }}>🚪</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Hero Stats Card */}
                    <View style={styles.heroCard}>
                        <Text style={styles.heroLabel}>Bu Ay Toplam Harcama</Text>
                        <Text style={styles.heroAmount}>
                            {isLoading ? '---' : formatCurrency(monthlyStats?.totalAmount ?? 0, 'TRY')}
                        </Text>
                        <View style={styles.statRow}>
                            {[
                                { label: 'Toplam', value: monthlyStats?.totalCount ?? 0, color: Colors.primaryLight },
                                { label: 'Aktarıldı', value: monthlyStats?.successCount ?? 0, color: Colors.success },
                                { label: 'Bekliyor', value: monthlyStats?.pendingCount ?? 0, color: Colors.warning },
                                { label: 'Hatalı', value: monthlyStats?.failedCount ?? 0, color: Colors.error },
                            ].map((s) => (
                                <View key={s.label} style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Category Breakdown */}
                    {monthlyStats?.categoryBreakdown && monthlyStats.categoryBreakdown.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📊 Kategori Dağılımı</Text>
                            <View style={styles.categoryCard}>
                                {monthlyStats.categoryBreakdown.map((cat: CategoryBreakdown, i: number) => (
                                    <View key={cat.code} style={styles.categoryRow}>
                                        <View style={styles.categoryInfo}>
                                            <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                                            <View style={styles.categoryBar}>
                                                <View style={[styles.categoryBarFill, {
                                                    width: `${cat.percentage}%`,
                                                    backgroundColor: [Colors.primary, Colors.secondary, Colors.success, Colors.warning, Colors.info][i % 5],
                                                }]} />
                                            </View>
                                        </View>
                                        <Text style={styles.categoryAmount}>{formatCurrency(cat.amount, 'TRY')}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Recent Receipts */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>🧾 Son Fişler</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('History')}>
                                <Text style={styles.seeAll}>Tümünü Gör →</Text>
                            </TouchableOpacity>
                        </View>
                        {isLoading ? (
                            <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
                        ) : recentReceipts.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={{ fontSize: 40 }}>📭</Text>
                                <Text style={styles.emptyText}>Henüz fiş yok</Text>
                                <Text style={styles.emptySubText}>Tara butonuna basarak başlayın</Text>
                            </View>
                        ) : (
                            recentReceipts.map((r, i) => (
                                <ReceiptCard
                                    key={r.id}
                                    receipt={r}
                                    delay={i * 80}
                                    onPress={() => navigation.navigate('ReceiptDetail', { receiptId: r.id })}
                                />
                            ))
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.base,
    },
    greeting: { fontSize: Typography.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
    subGreeting: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 2 },
    logoutBtn: { padding: Spacing.sm },

    heroCard: {
        margin: Spacing['2xl'], marginTop: Spacing.base,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        ...Shadows.primary,
    },
    heroLabel: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing.xs },
    heroAmount: { fontSize: Typography['4xl'], fontWeight: Typography.weights.extrabold, color: '#fff', letterSpacing: -1 },
    statRow: { flexDirection: 'row', marginTop: Spacing.base, gap: Spacing.sm },
    statItem: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.md, padding: Spacing.sm },
    statValue: { fontSize: Typography.xl, fontWeight: Typography.weights.bold },
    statLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

    section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontSize: Typography.base, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.md },
    seeAll: { fontSize: Typography.sm, color: Colors.primaryLight },

    categoryCard: {
        backgroundColor: Colors.surface, borderRadius: BorderRadius.xl,
        padding: Spacing.base, borderWidth: 1, borderColor: Colors.border,
    },
    categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
    categoryInfo: { flex: 1 },
    categoryName: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 4 },
    categoryBar: { height: 6, backgroundColor: Colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' },
    categoryBarFill: { height: '100%', borderRadius: 3 },
    categoryAmount: { fontSize: Typography.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },

    emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
    emptyText: { fontSize: Typography.lg, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginTop: Spacing.md },
    emptySubText: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: Spacing.xs },
});
