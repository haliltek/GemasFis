import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { Colors, BorderRadius, Typography, Spacing } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    disabled?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    style,
    textStyle,
    fullWidth = false,
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.75}
            style={[
                styles.base,
                styles[variant],
                styles[`size_${size}`],
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={
                        variant === 'outline' || variant === 'ghost'
                            ? Colors.primary
                            : Colors.textPrimary
                    }
                />
            ) : (
                <View style={styles.content}>
                    {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${variant}`],
                            styles[`textSize_${size}`],
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.45,
    },
    // Variants
    primary: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 6,
    },
    secondary: {
        backgroundColor: Colors.secondary,
        shadowColor: Colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    ghost: {
        backgroundColor: Colors.glass,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    danger: {
        backgroundColor: Colors.error,
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 5,
    },
    // Sizes
    size_sm: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        minHeight: 36,
    },
    size_md: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        minHeight: 48,
    },
    size_lg: {
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing.base,
        minHeight: 56,
    },
    // Text Styles
    text: {
        fontWeight: Typography.weights.bold,
        letterSpacing: 0.3,
    },
    text_primary: { color: Colors.textPrimary },
    text_secondary: { color: Colors.textPrimary },
    text_outline: { color: Colors.primary },
    text_ghost: { color: Colors.textSecondary },
    text_danger: { color: Colors.textPrimary },
    textSize_sm: { fontSize: Typography.sm },
    textSize_md: { fontSize: Typography.base },
    textSize_lg: { fontSize: Typography.md },
    // Icons
    iconLeft: { marginRight: Spacing.sm },
    iconRight: { marginLeft: Spacing.sm },
});
