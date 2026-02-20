import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { authService } from '../../services/firebase';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

export function LoginScreen() {
    const { setUser, setLoading, setError } = useAuthStore();
    const [email, setEmail] = useState('ahmet.yilmaz@gemas.com.tr');
    const [password, setPassword] = useState('demo123');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Animations
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const formTranslateY = useRef(new Animated.Value(30)).current;
    const orb1 = useRef(new Animated.Value(0)).current;
    const orb2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animations
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(formTranslateY, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Ambient orb animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(orb1, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(orb1, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(orb2, {
                    toValue: 1,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.timing(orb2, {
                    toValue: 0,
                    duration: 5000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Uyarı', 'Lütfen email ve şifrenizi girin');
            return;
        }
        setIsLoading(true);
        try {
            const user = await authService.signIn(email, password);
            setUser(user);
        } catch (error: any) {
            Alert.alert('Giriş Hatası', error.message || 'Bir hata oluştu');
            setIsLoading(false);
        }
    };

    const orb1TranslateY = orb1.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20],
    });
    const orb2TranslateY = orb2.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 15],
    });

    return (
        <SafeAreaView style={styles.container}>
            {/* Ambient Background Orbs */}
            <Animated.View
                style={[
                    styles.orb,
                    styles.orb1,
                    { transform: [{ translateY: orb1TranslateY }] },
                ]}
            />
            <Animated.View
                style={[
                    styles.orb,
                    styles.orb2,
                    { transform: [{ translateY: orb2TranslateY }] },
                ]}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Brand */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                        ]}
                    >
                        <View style={styles.logoIcon}>
                            <Text style={styles.logoEmoji}>🧾</Text>
                        </View>
                        <Text style={styles.brandName}>GemasFiş</Text>
                        <Text style={styles.tagline}>
                            Akıllı Fiş Yönetimi & Logo ERP Entegrasyonu
                        </Text>
                    </Animated.View>

                    {/* Login Form */}
                    <Animated.View
                        style={[
                            styles.formCard,
                            { opacity: formOpacity, transform: [{ translateY: formTranslateY }] },
                        ]}
                    >
                        <Text style={styles.formTitle}>Hoş Geldiniz</Text>
                        <Text style={styles.formSubtitle}>
                            Kurumsal hesabınızla giriş yapın
                        </Text>

                        {/* Email Field */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>E-posta Adresi</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    focusedField === 'email' && styles.inputFocused,
                                ]}
                            >
                                <Text style={styles.inputIcon}>✉️</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="ornek@sirket.com"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>
                        </View>

                        {/* Password Field */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Şifre</Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    focusedField === 'password' && styles.inputFocused,
                                ]}
                            >
                                <Text style={styles.inputIcon}>🔒</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Text style={styles.eyeIcon}>
                                        {showPassword ? '🙈' : '👁️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Şifremi Unuttum?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <View style={styles.loadingRow}>
                                    <ActivityIndicator color={Colors.textPrimary} size="small" />
                                    <Text style={[styles.loginButtonText, { marginLeft: Spacing.sm }]}>
                                        Giriş Yapılıyor...
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Giriş Yap</Text>
                            )}
                        </TouchableOpacity>

                        {/* Demo Notice */}
                        <View style={styles.demoNotice}>
                            <View style={styles.demoIconBg}>
                                <Text style={styles.demoIcon}>💡</Text>
                            </View>
                            <Text style={styles.demoText}>
                                Demo mod aktif — Giriş bilgileri önceden dolduruldu
                            </Text>
                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            © 2026 Gemas Fiziksel Ticaret · v1.0.0
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing['2xl'],
        paddingBottom: Spacing['3xl'],
    },
    // Orbs
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    orb1: {
        width: 280,
        height: 280,
        backgroundColor: 'rgba(108, 99, 255, 0.15)',
        top: -60,
        right: -80,
    },
    orb2: {
        width: 220,
        height: 220,
        backgroundColor: 'rgba(0, 212, 170, 0.1)',
        bottom: 100,
        left: -80,
    },
    // Logo
    logoContainer: {
        alignItems: 'center',
        marginTop: height * 0.08,
        marginBottom: Spacing['3xl'],
    },
    logoIcon: {
        width: 88,
        height: 88,
        borderRadius: BorderRadius['2xl'],
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    logoEmoji: {
        fontSize: 42,
    },
    brandName: {
        fontSize: Typography['3xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: Spacing.xs,
    },
    tagline: {
        fontSize: Typography.sm,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 19,
    },
    // Form Card
    formCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing['2xl'],
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    formTitle: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.weights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    formSubtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing['2xl'],
    },
    // Fields
    fieldGroup: {
        marginBottom: Spacing.base,
    },
    label: {
        fontSize: Typography.sm,
        fontWeight: Typography.weights.medium,
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.base,
        minHeight: 52,
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.backgroundTertiary,
    },
    inputIcon: {
        fontSize: 16,
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: Typography.base,
        color: Colors.textPrimary,
        paddingVertical: Spacing.md,
    },
    eyeButton: {
        padding: Spacing.xs,
    },
    eyeIcon: {
        fontSize: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
    },
    forgotPasswordText: {
        fontSize: Typography.sm,
        color: Colors.primaryLight,
        fontWeight: Typography.weights.medium,
    },
    // Login Button
    loginButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.base,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 54,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
        marginBottom: Spacing.base,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: Typography.md,
        fontWeight: Typography.weights.bold,
        color: Colors.textPrimary,
        letterSpacing: 0.3,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Demo Notice
    demoNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.infoBg,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginTop: Spacing.xs,
    },
    demoIconBg: {
        marginRight: Spacing.sm,
    },
    demoIcon: {
        fontSize: 14,
    },
    demoText: {
        flex: 1,
        fontSize: Typography.xs,
        color: Colors.primaryLight,
        lineHeight: 16,
    },
    // Footer
    footer: {
        alignItems: 'center',
        marginTop: Spacing['2xl'],
    },
    footerText: {
        fontSize: Typography.xs,
        color: Colors.textMuted,
    },
});
