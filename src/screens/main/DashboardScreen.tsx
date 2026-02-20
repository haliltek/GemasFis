import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Animated,
    Dimensions,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useReceiptStore } from '../../store/receiptStore';
import { receiptService } from '../../services';
import { ReceiptCard } from '../../components/ReceiptCard';
import { formatCurrency, getCurrentMonthKey, getMonthDisplayName } from '../../utils/formatters';

const { width } = Dimensions.get('window');

interface StatCardProps {
    label: string;
    value: string;
    subValue?: string;
    color: string;
    icon: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, color, icon, delay = 0 }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.statCard, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
            <View style={[styles.statIconBg, { backgroundColor: `${color}20` }]}>
                <Text style={styles.statIcon}>{icon}</Text>
            </View>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

export function DashboardScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const { receipts, monthlyStats, setReceipts, setMonthlyStats } = useReceiptStore();
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const headerAnim = useRef(new Animated.Value(-30)).current;
    const headerOpacity = useRef(new Animated.Value(0)).current;

    const monthKey = getCurrentMonthKey();
    const monthName = getMonthDisplayName(monthKey);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
        loadData();
    }, []);

    const loadData = async () => {
        if (!user) return;
        try {
            const [recs, stats] = await Promise.all([
                receiptService.getReceipts(user.uid),
                receiptService.getMonthlyStats(user.uid, monthKey),
            ]);
            setReceipts(recs);
            setMonthlyStats(stats);
        } catch (e) {
            console.error('Veri yüklenemedi:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const recentReceipts = receipts.slice(0, 3);
    const failedReceipts = receipts.filter((r) => r.logoStatus === 'failed');

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi günler';
        return 'İyi akşamlar';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* Header */}
                <Animated.View style={[styles.header, { transform: [{ translateY: headerAnim }], opacity: headerOpacity }]}>
                    <View>
                        <Text style={styles.greeting}>{greeting()},</Text>
                        <Text style={styles.userName}>{user?.displayName?.split(' ')[0]} 👋</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {user?.role === 'admin' ? '⚡ Admin' : user?.role === 'manager' ? '👔 Müdür' : '👤 Personel'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Text style={styles.notificationIcon}>🔔</Text>
                        {failedReceipts.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{failedReceipts.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                {/* Month Summary Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                        <View>
                            <Text style={styles.heroMonth}>{monthName}</Text>
                            <Text style={styles.heroLabel}>Toplam Harcama</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <Text style={styles.heroBadgeText}>Bu Ay</Text>
                        </View>
                    </View>
                    <Text style={styles.heroAmount}>
                        {monthlyStats
                            ? formatCurrency(monthlyStats.totalAmount, monthlyStats.currency)
                            : '—'}
                    </Text>
                    <Text style={styles.heroCount}>
                        {monthlyStats?.totalCount || 0} fiş kaydedildi
                    </Text>

                    {/* Progress bars */}
                    {monthlyStats && (
                        <View style={styles.progressSection}>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressLabel}>✅ Aktarıldı</Text>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${(monthlyStats.successCount / monthlyStats.totalCount) * 100}%`,
                                                backgroundColor: Colors.success,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressCount}>{monthlyStats.successCount}</Text>
                            </View>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressLabel}>⏳ Bekleyen</Text>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${(monthlyStats.pendingCount / monthlyStats.totalCount) * 100}%`,
                                                backgroundColor: Colors.warning,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressCount}>{monthlyStats.pendingCount}</Text>
                            </View>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressLabel}>❌ Hatalı</Text>
                                <View style={styles.progressBar}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${(monthlyStats.failedCount / monthlyStats.totalCount) * 100}%`,
                                                backgroundColor: Colors.error,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressCount}>{monthlyStats.failedCount}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Quick Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard
                        label="Toplam Fiş"
                        value={String(monthlyStats?.totalCount || 0)}
                        color={Colors.primary}
                        icon="🧾"
                        delay={100}
                    />
                    <StatCard
                        label="Aktarıldı"
                        value={String(monthlyStats?.successCount || 0)}
                        color={Colors.success}
                        icon="✅"
                        delay={200}
                    />
                    <StatCard
                        label="Bekleyen"
                        value={String(monthlyStats?.pendingCount || 0)}
                        color={Colors.warning}
                        icon="⏳"
                        delay={300}
                    />
                    <StatCard
                        label="Hatalı"
                        value={String(monthlyStats?.failedCount || 0)}
                        color={Colors.error}
                        icon="❌"
                        delay={400}
                    />
                </View>

                {/* Failed Receipts Alert */}
                {failedReceipts.length > 0 && (
                    <TouchableOpacity
                        style={styles.alertCard}
                        onPress={() => navigation.navigate('History')}
                    >
                        <Text style={styles.alertIcon}>⚠️</Text>
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>
                                {failedReceipts.length} fiş aktarılamadı
                            </Text>
                            <Text style={styles.alertSubtitle}>
                                Logo ERP'ye aktarım başarısız — Yeniden deneyin
                            </Text>
                        </View>
                        <Text style={styles.alertArrow}>›</Text>
                    </TouchableOpacity>
                )}

                {/* Category Breakdown */}
                {monthlyStats?.categoryBreakdown && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Harcama Kategorileri</Text>
                        <View style={styles.categoryCard}>
                            {monthlyStats.categoryBreakdown.map((cat: import('../../types/index').CategoryBreakdown, i: number) => (
                                <View key={cat.code} style={styles.categoryRow}>
                                    <View style={styles.categoryInfo}>
                                        <View
                                            style={[
                                                styles.categoryDot,
                                                {
                                                    backgroundColor: [
                                                        Colors.primary,
                                                        Colors.success,
                                                        Colors.warning,
                                                        Colors.error,
                                                    ][i % 4],
                                                },
                                            ]}
                                        />
                                        <Text style={styles.categoryName}>{cat.name}</Text>
                                    </View>
                                    <View style={styles.categoryAmounts}>
                                        <Text style={styles.categoryAmount}>
                                            {formatCurrency(cat.amount, 'TRY')}
                                        </Text>
                                        <Text style={styles.categoryPercent}>%{cat.percentage.toFixed(0)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Recent Receipts */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Son Fişler</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('History')}>
                            <Text style={styles.seeAllText}>Tümünü Gör →</Text>
                        </TouchableOpacity>
                    </View>
                    {recentReceipts.map((receipt, index) => (
                        <ReceiptCard
                            key={receipt.id}
                            receipt={receipt}
                            delay={index * 100}
                            onPress={() =>
                                navigation.navigate('ReceiptDetail', { receiptId: receipt.id })
                            }
                        />
                    ))}
                    {recentReceipts.length === 0 && !isLoading && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🧾</Text>
                            <Text style={styles.emptyTitle}>Henüz fiş yok</Text>
                            <Text style={styles.emptySubtitle}>
                                Kamera ile fiş tarayarak başlayın
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingBottom: Spacing['4xl'] + Spacing['3xl'] },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing.base,
        paddingBottom: Spacing.xl,
    },
    greeting: { fontSize: Typography.base, color: Colors.textSecondary },
    userName: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    roleBadge: {
        backgroundColor: Colors.infoBg,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    roleText: { fontSize: Typography.xs, color: Colors.primaryLight, fontWeight: Typography.weights.semibold },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        position: 'relative',
    },
    notificationIcon: { fontSize: 20 },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: Colors.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { fontSize: 9, color: '#fff', fontWeight: 'bold' },
    // Hero Card
    heroCard: {
        marginHorizontal: Spacing['2xl'],
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.base,
        ...Shadows.lg,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    heroMonth: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 2 },
    heroLabel: { fontSize: Typography.xs, color: Colors.textTertiary },
    heroBadge: {
        backgroundColor: Colors.infoBg,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    heroBadgeText: { fontSize: Typography.xs, color: Colors.primaryLight },
    heroAmount: {
        fontSize: Typography['4xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
        letterSpacing: -1,
        marginBottom: Spacing.xs,
    },
    heroCount: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base },
    progressSection: { gap: Spacing.sm },
    progressRow: { flexDirection: 'row', alignItems: 'center' },
    progressLabel: { fontSize: Typography.xs, color: Colors.textSecondary, width: 80 },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: 2,
        marginHorizontal: Spacing.sm,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 2 },
    progressCount: { fontSize: Typography.xs, color: Colors.textTertiary, width: 20, textAlign: 'right' },
    // Stats Row
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing['2xl'],
        gap: Spacing.sm,
        marginBottom: Spacing.base,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statIconBg: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    statIcon: { fontSize: 18 },
    statValue: { fontSize: Typography.lg, fontWeight: Typography.weights.bold },
    statSubValue: { fontSize: Typography.xs, color: Colors.textTertiary },
    statLabel: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center', marginTop: 2 },
    // Alert
    alertCard: {
        marginHorizontal: Spacing['2xl'],
        backgroundColor: Colors.errorBg,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: `${Colors.error}40`,
        marginBottom: Spacing.base,
    },
    alertIcon: { fontSize: 24, marginRight: Spacing.md },
    alertContent: { flex: 1 },
    alertTitle: { fontSize: Typography.base, fontWeight: Typography.weights.semibold, color: Colors.error },
    alertSubtitle: { fontSize: Typography.xs, color: `${Colors.error}CC`, marginTop: 2 },
    alertArrow: { fontSize: 24, color: Colors.error },
    // Section
    section: { paddingHorizontal: Spacing['2xl'], marginBottom: Spacing.base },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.weights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    seeAllText: { fontSize: Typography.sm, color: Colors.primaryLight, fontWeight: Typography.weights.medium },
    // Category Card
    categoryCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    categoryInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
    categoryName: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
    categoryAmounts: { alignItems: 'flex-end' },
    categoryAmount: { fontSize: Typography.sm, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
    categoryPercent: { fontSize: Typography.xs, color: Colors.textTertiary },
    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
    emptyIcon: { fontSize: 48, marginBottom: Spacing.base },
    emptyTitle: { fontSize: Typography.lg, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.xs },
    emptySubtitle: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center' },
});
