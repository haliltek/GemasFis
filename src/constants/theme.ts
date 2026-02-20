// ─── GemasFiş Design System ───────────────────────────────────

export const Colors = {
  // Brand
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4F47E5',
  secondary: '#FF6584',

  // Background (dark theme)
  background: '#0F0F1A',
  backgroundSecondary: '#1A1A2E',
  surface: '#1E1E30',
  surfaceLight: '#252540',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0CC',
  textTertiary: '#6B6B8A',

  // Status
  success: '#4CAF50',
  successBg: '#1B3A1C',
  warning: '#FF9800',
  warningBg: '#3A2800',
  error: '#F44336',
  errorBg: '#3A1010',
  info: '#2196F3',
  infoBg: '#0D2540',

  // Borders & Glass
  border: '#2A2A45',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.10)',
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
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
  '3xl': 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
