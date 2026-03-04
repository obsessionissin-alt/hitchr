export const Colors = {
  // Hitchr prototype palette (light)
  primary: '#FF6B6B',
  primaryLight: '#FF8F8F',
  primaryDark: '#E64545',

  trustBlue: '#4A90E2',
  trustBlueLight: '#E8F2FC',
  trustGreen: '#52C41A',
  trustGreenLight: '#E8F8E0',

  accent: '#FF6B6B',
  accentLight: '#FFCCD0',

  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E8E8E8',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',

  // Backward-compatible aliases
  gray: '#A3A3A3',
  lightGray: '#D4D4D4',
  darkGray: '#F5F5F5',
  offWhite: '#FAFAFA',

  white: '#FFFFFF',
  black: '#000000',

  // Semantic colors
  success: '#52C41A',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#4A90E2',

  // UI tokens
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceLight: '#FAFAFA',
  border: '#E8E8E8',
  divider: '#F3F4F6',
  text: '#171717',
  textSecondary: '#525252',
  textTertiary: '#737373',
  textMuted: '#A3A3A3',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  round: 999,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
};

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const Typography = {
  ...FontSizes,
  ...FontWeights,
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const Motion = {
  durations: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

export const useTheme = () => ({
  colors: Colors,
  shadows: Shadows,
  typography: Typography,
  spacing: Spacing,
  radius: BorderRadius,
  motion: Motion,
});
