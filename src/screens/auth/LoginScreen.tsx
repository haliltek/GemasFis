import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';

export function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setUser, setError } = useAuthStore();

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            shake();
            Alert.alert('Eksik Bilgi', 'E-posta ve şifre gereklidir.');
            return;
        }
        setLoading(true);
        try {
            const user = await authService.signIn(email.trim(), password);
            setUser(user);
        } catch (e: any) {
            shake();
            setError(e.message);
            Alert.alert('Giriş Hatası', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.inner}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoIcon}>🧾</Text>
                    </View>
                    <Text style={styles.logoTitle}>GemasFiş</Text>
                    <Text style={styles.logoSubtitle}>Fiş Yönetim & Logo ERP Entegrasyonu</Text>
                </View>

                {/* Form */}
                <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>E-posta</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="ornek@gemas.com.tr"
                            placeholderTextColor={Colors.textTertiary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Şifre</Text>
                        <View style={styles.passwordRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textTertiary}
                                secureTextEntry={!showPass}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPass(!showPass)}
                                style={styles.eyeBtn}
                            >
                                <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.loginBtnText}>Giriş Yap</Text>
                        }
                    </TouchableOpacity>
                </Animated.View>

                <Text style={styles.footer}>Gemas Endüstri © 2026</Text>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing['2xl'] },

    logoContainer: { alignItems: 'center', marginBottom: Spacing['3xl'] },
    logoCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.base,
        ...Shadows.primary,
    },
    logoIcon: { fontSize: 40 },
    logoTitle: {
        fontSize: Typography['3xl'], fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary, letterSpacing: -0.5,
    },
    logoSubtitle: {
        fontSize: Typography.sm, color: Colors.textTertiary,
        marginTop: Spacing.xs, textAlign: 'center',
    },

    form: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        borderWidth: 1, borderColor: Colors.border,
        ...Shadows.md,
    },
    inputGroup: { marginBottom: Spacing.base },
    label: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: Typography.weights.medium },
    input: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        color: Colors.textPrimary,
        fontSize: Typography.base,
        borderWidth: 1, borderColor: Colors.border,
        marginBottom: Spacing.xs,
    },
    passwordRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    eyeBtn: { padding: Spacing.sm },

    loginBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.base,
        alignItems: 'center',
        marginTop: Spacing.sm,
        minHeight: 52,
        justifyContent: 'center',
        ...Shadows.primary,
    },
    loginBtnText: { fontSize: Typography.lg, fontWeight: Typography.weights.bold, color: '#fff' },

    footer: { textAlign: 'center', color: Colors.textTertiary, fontSize: Typography.xs, marginTop: Spacing['2xl'] },
});
