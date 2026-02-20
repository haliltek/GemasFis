import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
} from 'react-native';
import {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
} from '../constants/theme';
import { Receipt } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

interface ReceiptCardProps {
    receipt: Receipt;
    onPress: () => void;
    delay?: number;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
    receipt,
    onPress,
    delay = 0,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 10,
        }).start();
    };

    return (
        <Animated.View
            style={[
                { opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={styles.card}
            >
                {/* Receipt Image Thumbnail */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: receipt.imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay} />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <Text style={styles.merchantName} numberOfLines={1}>
                            {receipt.merchantName}
                        </Text>
                        <StatusBadge status={receipt.logoStatus} />
                    </View>

                    {/* Description */}
                    {receipt.description && (
                        <Text style={styles.description} numberOfLines={1}>
                            {receipt.description}
                        </Text>
                    )}

                    {/* Footer Row */}
                    <View style={styles.footerRow}>
                        <View>
                            <Text style={styles.amount}>
                                {formatCurrency(receipt.amount, receipt.currency)}
                            </Text>
                            <Text style={styles.date}>{formatDate(receipt.date)}</Text>
                        </View>

                        {receipt.logoExpenseName && (
                            <View style={styles.categoryTag}>
                                <Text style={styles.categoryText} numberOfLines={1}>
                                    {receipt.logoExpenseName}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Logo Ref */}
                    {receipt.logoRefNo && (
                        <View style={styles.refRow}>
                            <Text style={styles.refLabel}>Logo Ref: </Text>
                            <Text style={styles.refNo}>{receipt.logoRefNo}</Text>
                        </View>
                    )}

                    {/* Error Message */}
                    {receipt.logoStatus === 'failed' && receipt.logoErrorMessage && (
                        <View style={styles.errorRow}>
                            <Text style={styles.errorText} numberOfLines={1}>
                                ⚠ {receipt.logoErrorMessage}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.md,
    },
    imageContainer: {
        width: 80,
        position: 'relative',
    },
    image: {
        width: 80,
        height: '100%',
        minHeight: 110,
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 12,
        backgroundColor: Colors.surface,
        // Fade edge effect
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    merchantName: {
        fontSize: Typography.base,
        fontWeight: Typography.weights.semibold,
        color: Colors.textPrimary,
        flex: 1,
        marginRight: Spacing.sm,
    },
    description: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    amount: {
        fontSize: Typography.lg,
        fontWeight: Typography.weights.bold,
        color: Colors.textPrimary,
    },
    date: {
        fontSize: Typography.xs,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    categoryTag: {
        backgroundColor: Colors.infoBg,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        maxWidth: 140,
    },
    categoryText: {
        fontSize: Typography.xs,
        color: Colors.primaryLight,
        fontWeight: Typography.weights.medium,
    },
    refRow: {
        flexDirection: 'row',
        marginTop: Spacing.xs,
    },
    refLabel: {
        fontSize: Typography.xs,
        color: Colors.textTertiary,
    },
    refNo: {
        fontSize: Typography.xs,
        color: Colors.success,
        fontWeight: Typography.weights.medium,
    },
    errorRow: {
        backgroundColor: Colors.errorBg,
        padding: Spacing.xs,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.xs,
    },
    errorText: {
        fontSize: Typography.xs,
        color: Colors.error,
    },
});
