import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
    Platform,
    Image,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { edgeFunctions, storageService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { OcrData, AiSuggestion } from '../../types/index';
import { formatConfidence } from '../../utils/formatters';

const { width, height } = Dimensions.get('window');

type ScanStep = 'idle' | 'picked' | 'uploading' | 'analyzing' | 'done';

export function ScanScreen({ navigation }: any) {
    const { user } = useAuthStore();
    const [step, setStep] = useState<ScanStep>('idle');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [ocrData, setOcrData] = useState<OcrData | null>(null);
    const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
    const [aiConfidence, setAiConfidence] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scanLineAnim = useRef(new Animated.Value(-1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Idle pulse on camera button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    useEffect(() => {
        if (step === 'analyzing') {
            // Scan line animation
            Animated.loop(
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 1800,
                    useNativeDriver: true,
                })
            ).start();
            // Spinner
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [step]);

    const requestPermissions = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Kamera İzni Gerekli',
                'Fiş çekmek için kamera iznine ihtiyaç var. Ayarlardan izin veriniz.',
                [{ text: 'Tamam' }]
            );
            return false;
        }
        return true;
    };

    const handleCamera = async () => {
        const ok = await requestPermissions();
        if (!ok) return;

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.92,
            allowsEditing: true,
            aspect: [3, 4],
            cameraType: ImagePicker.CameraType.back,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setStep('picked');
        }
    };

    const handleGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Galeri İzni Gerekli', 'Fotoğraf seçmek için galeri izni gereklidir.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.92,
            allowsEditing: true,
            aspect: [3, 4],
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
            setStep('picked');
        }
    };

    const handleAnalyze = async () => {
        if (!imageUri || !user) return;
        setError(null);

        try {
            // Step 1: Upload image
            setStep('uploading');
            setUploadProgress(0);
            const url = await storageService.uploadReceipt(
                imageUri,
                user.uid,
                (pct) => setUploadProgress(pct)
            );
            setUploadedUrl(url);

            // Step 2: Analyze with Gemini (via Edge Function)
            setStep('analyzing');
            // Convert to base64 for edge function
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);

            const result = await edgeFunctions.analyzeReceipt(base64);
            setOcrData(result.ocrData);
            setAiSuggestions(result.aiSuggestions);
            setAiConfidence(result.confidence);
            setStep('done');
        } catch (err: any) {
            setError(err.message || 'Analiz sırasında hata oluştu');
            setStep('picked');
        }
    };

    const handleProceedToForm = () => {
        if (!imageUri) return;
        navigation.navigate('ReceiptForm', {
            imageUri: uploadedUrl || imageUri,
            ocrData,
        });
    };

    const handleRetry = () => {
        setStep('idle');
        setImageUri(null);
        setUploadedUrl(null);
        setOcrData(null);
        setAiSuggestions([]);
        setError(null);
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                resolve(dataUrl.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const spinInterpolate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const scanLineTranslateY = scanLineAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-180, 180],
    });

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Fiş Tara</Text>
                    <Text style={styles.subtitle}>
                        {step === 'idle'
                            ? 'Kamera ile çekin veya galeriden seçin'
                            : step === 'picked'
                                ? 'Fişi analiz etmeye hazır'
                                : step === 'uploading'
                                    ? 'Yükleniyor...'
                                    : step === 'analyzing'
                                        ? 'Yapay Zeka Analiz Ediyor...'
                                        : 'Analiz Tamamlandı ✅'}
                    </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* IDLE — Pick Source Buttons */}
                    {step === 'idle' && (
                        <View style={styles.idleContainer}>
                            {/* Camera Button */}
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <TouchableOpacity
                                    style={styles.cameraButton}
                                    onPress={handleCamera}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.cameraIconOuter}>
                                        <View style={styles.cameraIconInner}>
                                            <Text style={styles.cameraEmoji}>📷</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cameraButtonText}>Fişi Çek</Text>
                                    <Text style={styles.cameraButtonSub}>
                                        Kamera ile yüksek kaliteli çekim
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Gallery Button */}
                            <TouchableOpacity
                                style={styles.galleryButton}
                                onPress={handleGallery}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.galleryIcon}>🖼️</Text>
                                <View>
                                    <Text style={styles.galleryText}>Galeriden Seç</Text>
                                    <Text style={styles.gallerySub}>Mevcut fotoğraftan fiş seç</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Tips */}
                            <View style={styles.tipsCard}>
                                <Text style={styles.tipsTitle}>💡 İpuçları</Text>
                                {[
                                    'Fişi düz ve aydınlık yüzeye koyun',
                                    'Tüm metin alanlarının görünür olmasını sağlayın',
                                    "Kamera'yı fişe dik tutun (perspektif bozulmasını önler)",
                                    'Toplam tutar ve tarih mutlaka görünmeli',
                                ].map((tip, i) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Text style={styles.tipNumber}>{i + 1}</Text>
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* PICKED — Preview + Analyze Button */}
                    {(step === 'picked' || step === 'uploading') && imageUri && (
                        <View style={styles.previewContainer}>
                            <View style={styles.imageWrapper}>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                                {step === 'uploading' && (
                                    <View style={styles.uploadOverlay}>
                                        <ActivityIndicator size="large" color={Colors.primary} />
                                        <Text style={styles.uploadText}>Yükleniyor... {uploadProgress}%</Text>
                                        <View style={styles.uploadProgressBar}>
                                            <View
                                                style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>

                            {error && (
                                <View style={styles.errorCard}>
                                    <Text style={styles.errorText}>⚠️ {error}</Text>
                                </View>
                            )}

                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                                    <Text style={styles.retryBtnText}>↩ Yeniden Seç</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.analyzeBtn}
                                    onPress={handleAnalyze}
                                    disabled={step === 'uploading'}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.analyzeBtnText}>
                                        {step === 'uploading' ? 'Yükleniyor...' : '🤖 AI ile Analiz Et'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* ANALYZING — Scan Animation */}
                    {step === 'analyzing' && imageUri && (
                        <View style={styles.analyzingContainer}>
                            <View style={styles.scanFrame}>
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.scanImage}
                                    resizeMode="contain"
                                />
                                {/* Scan line */}
                                <Animated.View
                                    style={[
                                        styles.scanLine,
                                        { transform: [{ translateY: scanLineTranslateY }] },
                                    ]}
                                />
                                {/* Corner brackets */}
                                <View style={[styles.corner, styles.cornerTL]} />
                                <View style={[styles.corner, styles.cornerTR]} />
                                <View style={[styles.corner, styles.cornerBL]} />
                                <View style={[styles.corner, styles.cornerBR]} />
                            </View>

                            <View style={styles.analyzingInfo}>
                                <Animated.View
                                    style={[styles.aiSpinner, { transform: [{ rotate: spinInterpolate }] }]}
                                >
                                    <Text style={styles.aiSpinnerIcon}>✨</Text>
                                </Animated.View>
                                <Text style={styles.analyzingTitle}>Gemini AI Analiz Ediyor</Text>
                                <Text style={styles.analyzingSubtitle}>
                                    Metin çıkarılıyor, masraf kategorisi belirleniyor...
                                </Text>
                                <View style={styles.analysisSteps}>
                                    {['OCR metin tespiti', 'Tutar & tarih çıkarımı', 'Logo kategori eşleşmesi'].map(
                                        (s, i) => (
                                            <View key={i} style={styles.analysisStep}>
                                                <ActivityIndicator size="small" color={Colors.primary} />
                                                <Text style={styles.analysisStepText}>{s}</Text>
                                            </View>
                                        )
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* DONE — Results */}
                    {step === 'done' && ocrData && (
                        <View style={styles.resultsContainer}>
                            {/* Receipt preview small */}
                            {imageUri && (
                                <Image
                                    source={{ uri: imageUri }}
                                    style={styles.resultThumbnail}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Confidence */}
                            <View style={styles.confidenceCard}>
                                <Text style={styles.confidenceLabel}>AI Doğruluk Skoru</Text>
                                <View style={styles.confidenceRow}>
                                    <View style={styles.confidenceBar}>
                                        <View
                                            style={[
                                                styles.confidenceFill,
                                                {
                                                    width: `${aiConfidence * 100}%`,
                                                    backgroundColor:
                                                        aiConfidence > 0.8 ? Colors.success : aiConfidence > 0.6 ? Colors.warning : Colors.error,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            styles.confidenceValue,
                                            {
                                                color:
                                                    aiConfidence > 0.8 ? Colors.success : aiConfidence > 0.6 ? Colors.warning : Colors.error,
                                            },
                                        ]}
                                    >
                                        {formatConfidence(aiConfidence)}
                                    </Text>
                                </View>
                            </View>

                            {/* Extracted Data */}
                            <View style={styles.extractedCard}>
                                <Text style={styles.extractedTitle}>📤 Çıkarılan Bilgiler</Text>
                                {[
                                    { label: 'Satıcı', value: ocrData.merchantName },
                                    { label: 'Tutar', value: ocrData.totalAmount ? `${ocrData.totalAmount.toLocaleString('tr-TR')} ${ocrData.currency || 'TRY'}` : undefined },
                                    { label: 'KDV', value: ocrData.kdvAmount ? `${ocrData.kdvAmount.toLocaleString('tr-TR')} TRY` : undefined },
                                    { label: 'Tarih', value: ocrData.date },
                                    { label: 'Vergi No', value: ocrData.taxNumber },
                                ]
                                    .filter((item) => item.value)
                                    .map((item) => (
                                        <View key={item.label} style={styles.extractedRow}>
                                            <Text style={styles.extractedLabel}>{item.label}</Text>
                                            <Text style={styles.extractedValue}>{item.value}</Text>
                                        </View>
                                    ))}
                            </View>

                            {/* AI Suggestions */}
                            {aiSuggestions.length > 0 && (
                                <View style={styles.suggestionsCard}>
                                    <Text style={styles.suggestionsTitle}>🤖 AI Masraf Önerileri</Text>
                                    {aiSuggestions.map((s, i) => (
                                        <View key={s.serviceCode} style={[styles.suggestionRow, i === 0 && styles.suggestionTop]}>
                                            <View style={styles.suggestionLeft}>
                                                {i === 0 && <Text style={styles.suggestionBest}>⭐ Önerilen</Text>}
                                                <Text style={styles.suggestionName}>{s.serviceName}</Text>
                                                <Text style={styles.suggestionReason}>{s.reason}</Text>
                                            </View>
                                            <View style={[styles.suggestionConfBadge, { backgroundColor: i === 0 ? Colors.successBg : Colors.infoBg }]}>
                                                <Text style={[styles.suggestionConf, { color: i === 0 ? Colors.success : Colors.primaryLight }]}>
                                                    {formatConfidence(s.confidence)}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* CTA Buttons */}
                            <View style={styles.ctaRow}>
                                <TouchableOpacity style={styles.ctaRetry} onPress={handleRetry}>
                                    <Text style={styles.ctaRetryText}>↩ Yeniden Tara</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.ctaProceed}
                                    onPress={handleProceedToForm}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.ctaProceedText}>Devam Et →</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1 },
    header: {
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing.base,
        paddingBottom: Spacing.base,
    },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: Typography.weights.extrabold,
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    scrollContent: { paddingHorizontal: Spacing['2xl'], paddingBottom: Spacing['4xl'] + 60 },

    // Idle
    idleContainer: { alignItems: 'center' },
    cameraButton: {
        width: width - Spacing['2xl'] * 2,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing['2xl'],
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.primary + '60',
        marginBottom: Spacing.base,
        ...Shadows.primary,
    },
    cameraIconOuter: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.infoBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.base,
        borderWidth: 2,
        borderColor: Colors.primary + '40',
    },
    cameraIconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.primary,
    },
    cameraEmoji: { fontSize: 36 },
    cameraButtonText: {
        fontSize: Typography.xl,
        fontWeight: Typography.weights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    cameraButtonSub: { fontSize: Typography.sm, color: Colors.textSecondary },
    galleryButton: {
        width: width - Spacing['2xl'] * 2,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.xl,
    },
    galleryIcon: { fontSize: 28, marginRight: Spacing.md },
    galleryText: {
        fontSize: Typography.base,
        fontWeight: Typography.weights.semibold,
        color: Colors.textPrimary,
    },
    gallerySub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
    tipsCard: {
        width: width - Spacing['2xl'] * 2,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tipsTitle: {
        fontSize: Typography.sm,
        fontWeight: Typography.weights.semibold,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xs },
    tipNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.infoBg,
        textAlign: 'center',
        lineHeight: 20,
        fontSize: Typography.xs,
        color: Colors.primaryLight,
        fontWeight: Typography.weights.bold,
        marginRight: Spacing.sm,
    },
    tipText: { flex: 1, fontSize: Typography.sm, color: Colors.textTertiary, lineHeight: 18 },

    // Preview
    previewContainer: { alignItems: 'center' },
    imageWrapper: {
        width: width - Spacing['2xl'] * 2,
        height: (width - Spacing['2xl'] * 2) * (4 / 3),
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        marginBottom: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    previewImage: { width: '100%', height: '100%' },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.glassDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadText: { color: Colors.textPrimary, fontSize: Typography.base, marginTop: Spacing.sm },
    uploadProgressBar: {
        width: 200,
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        marginTop: Spacing.sm,
        overflow: 'hidden',
    },
    uploadProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
    errorCard: {
        backgroundColor: Colors.errorBg,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.base,
        width: '100%',
    },
    errorText: { color: Colors.error, fontSize: Typography.sm },
    actionRow: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
    retryBtn: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    retryBtnText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: Typography.weights.medium },
    analyzeBtn: {
        flex: 2,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        ...Shadows.primary,
    },
    analyzeBtnText: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.weights.bold },

    // Analyzing
    analyzingContainer: { alignItems: 'center' },
    scanFrame: {
        width: width - Spacing['2xl'] * 2,
        height: (width - Spacing['2xl'] * 2) * (4 / 3),
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: Colors.surface,
        marginBottom: Spacing.xl,
    },
    scanImage: { width: '100%', height: '100%', opacity: 0.7 },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.primary, borderWidth: 3 },
    cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
    cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
    cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
    analyzingInfo: { alignItems: 'center', width: '100%' },
    aiSpinner: { marginBottom: Spacing.sm },
    aiSpinnerIcon: { fontSize: 36 },
    analyzingTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.weights.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    analyzingSubtitle: {
        fontSize: Typography.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.base,
    },
    analysisSteps: { width: '100%', gap: Spacing.sm },
    analysisStep: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    analysisStepText: { fontSize: Typography.sm, color: Colors.textSecondary },

    // Results
    resultsContainer: { width: '100%' },
    resultThumbnail: {
        width: 80,
        height: 100,
        borderRadius: BorderRadius.md,
        alignSelf: 'flex-start',
        marginBottom: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    confidenceCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
    },
    confidenceLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: Spacing.sm },
    confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    confidenceBar: { flex: 1, height: 6, backgroundColor: Colors.backgroundSecondary, borderRadius: 3, overflow: 'hidden' },
    confidenceFill: { height: '100%', borderRadius: 3 },
    confidenceValue: { fontWeight: Typography.weights.bold, fontSize: Typography.md, width: 44, textAlign: 'right' },
    extractedCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
    },
    extractedTitle: { fontSize: Typography.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
    extractedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    extractedLabel: { fontSize: Typography.sm, color: Colors.textTertiary },
    extractedValue: { fontSize: Typography.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary, maxWidth: '60%', textAlign: 'right' },
    suggestionsCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.base,
    },
    suggestionsTitle: { fontSize: Typography.sm, fontWeight: Typography.weights.semibold, color: Colors.textSecondary, marginBottom: Spacing.sm },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    suggestionTop: {
        backgroundColor: Colors.successBg,
        marginHorizontal: -Spacing.base,
        paddingHorizontal: Spacing.base,
        borderRadius: BorderRadius.md,
        borderBottomWidth: 0,
        marginBottom: Spacing.xs,
    },
    suggestionLeft: { flex: 1 },
    suggestionBest: { fontSize: Typography.xs, color: Colors.success, fontWeight: Typography.weights.semibold, marginBottom: 2 },
    suggestionName: { fontSize: Typography.sm, fontWeight: Typography.weights.medium, color: Colors.textPrimary },
    suggestionReason: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
    suggestionConfBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
    suggestionConf: { fontSize: Typography.sm, fontWeight: Typography.weights.bold },
    ctaRow: { flexDirection: 'row', gap: Spacing.sm },
    ctaRetry: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    ctaRetryText: { color: Colors.textSecondary, fontWeight: Typography.weights.medium },
    ctaProceed: {
        flex: 2,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        ...Shadows.primary,
    },
    ctaProceedText: { color: Colors.textPrimary, fontWeight: Typography.weights.bold, fontSize: Typography.md },
});
