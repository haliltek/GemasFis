// GemasFis Design System - Premium Dark Theme
export const Colors = {
  // Brand Gradient Colors
  primary: '#6C63FF',
  primaryDark: '#4A42D4',
  primaryLight: '#A89CFF',
  secondary: '#00D4AA',
  secondaryDark: '#00A882',
  accent: '#FF6B6B',
  accentWarm: '#FFB347',

  // Background Layers
  background: '#0A0A0F',
  backgroundSecondary: '#111118',
  backgroundTertiary: '#1A1A27',
  surface: '#1E1E2E',
  surfaceLight: '#252538',
  surfaceMid: '#2A2A3D',

  // Glass Effect
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(0, 0, 0, 0.4)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C8',
  textTertiary: '#6B6B8A',
  textMuted: '#3D3D5C',

  // Status Colors
  success: '#00D4AA',
  successBg: 'rgba(0, 212, 170, 0.15)',
  warning: '#FFB347',
  warningBg: 'rgba(255, 179, 71, 0.15)',
  error: '#FF6B6B',
  errorBg: 'rgba(255, 107, 107, 0.15)',
  info: '#6C63FF',
  infoBg: 'rgba(108, 99, 255, 0.15)',
  pending: '#9B9BC8',
  pendingBg: 'rgba(155, 155, 200, 0.15)',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderFocus: '#6C63FF',

  // Gradients (used as arrays for LinearGradient)
  gradientPrimary: ['#6C63FF', '#4A42D4'] as string[],
  gradientSecondary: ['#00D4AA', '#00A882'] as string[],
  gradientDark: ['#1E1E2E', '#111118'] as string[],
  gradientBackground: ['#0A0A0F', '#111118', '#1A1A27'] as string[],
  gradientCard: ['rgba(30,30,46,0.95)', 'rgba(20,20,35,0.98)'] as string[],
  gradientSuccess: ['#00D4AA', '#00B48C'] as string[],
  gradientError: ['#FF6B6B', '#E05555'] as string[],
  gradientWarning: ['#FFB347', '#E5962E'] as string[],
  gradientSurface: ['rgba(108,99,255,0.12)', 'rgba(74,66,212,0.08)'] as string[],

  // Tab Bar
  tabBarBackground: 'rgba(14,14,22,0.95)',
  tabBarActive: '#6C63FF',
  tabBarInactive: '#4A4A6A',

  // Overlay
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
};

export const Typography = {
  // Font Families (System fonts, optimized for mobile)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  // Font Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 31,
  '4xl': 38,
  // Font Weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  success: {
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
};

export const AnimationDurations = {
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
};
