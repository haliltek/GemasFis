import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';
import { LogoStatus } from '../types';

interface StatusBadgeProps {
    status: LogoStatus;
    style?: ViewStyle;
    showDot?: boolean;
}

const statusConfig: Record<
    LogoStatus,
    { label: string; color: string; bgColor: string; dotColor: string }
> = {
    success: {
        label: 'Aktarıldı',
        color: Colors.success,
        bgColor: Colors.successBg,
        dotColor: Colors.success,
    },
    pending: {
        label: 'Beklemede',
        color: Colors.warning,
        bgColor: Colors.warningBg,
        dotColor: Colors.warning,
    },
    processing: {
        label: 'İşleniyor',
        color: Colors.info,
        bgColor: Colors.infoBg,
        dotColor: Colors.info,
    },
    failed: {
        label: 'Hata',
        color: Colors.error,
        bgColor: Colors.errorBg,
        dotColor: Colors.error,
    },
    draft: {
        label: 'Taslak',
        color: Colors.textSecondary,
        bgColor: Colors.pendingBg,
        dotColor: Colors.textSecondary,
    },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    style,
    showDot = true,
}) => {
    const config = statusConfig[status] || statusConfig.draft;

    return (
        <View
            style={[styles.badge, { backgroundColor: config.bgColor }, style]}
        >
            {showDot && (
                <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
            )}
            <Text style={[styles.text, { color: config.color }]}>
                {config.label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: Spacing.xs,
    },
    text: {
        fontSize: Typography.xs,
        fontWeight: Typography.weights.semibold,
        letterSpacing: 0.3,
    },
});
