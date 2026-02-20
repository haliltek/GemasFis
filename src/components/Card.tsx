import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'glass' | 'elevated' | 'bordered';
    padding?: number;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 16,
}) => {
    return (
        <View style={[styles.card, styles[variant], { padding }, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    default: {
        backgroundColor: Colors.surface,
        ...Shadows.md,
    },
    glass: {
        backgroundColor: Colors.glass,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.sm,
    },
    elevated: {
        backgroundColor: Colors.surfaceLight,
        ...Shadows.lg,
    },
    bordered: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});
