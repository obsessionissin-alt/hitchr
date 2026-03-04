// src/constants/theme.tsx
// Modern Indian Design System - hitchr V2
// Inspired by authentic Indian aesthetics, street culture, and Gen Z vibes

export const theme = {
  colors: {
    // Primary "Spicy" Palette
    primary: '#F2C94C',        // Rickshaw Yellow - warm, inviting, iconic
    secondary: '#FF007A',      // Coconut Magenta - bold, youthful, energetic
    accent: '#219653',         // Forest Green - natural, trustworthy, adventure
    
    // Neutrals with warmth
    background: '#FCF9F1',     // Eggshell - warm off-white, less sterile
    surface: '#FFFFFF',        // Pure white for cards
    surfaceSecondary: '#F5F2E8', // Cream tint for layering
    surfaceDark: '#1B1B1B',    // Carbon Black for dark surfaces
    
    // Text colors
    textPrimary: '#1B1B1B',    // Carbon Black - strong, readable
    textSecondary: '#5C5C5C',  // Charcoal - softer secondary
    textTertiary: '#8B8B8B',   // Stone Grey - subtle hints
    textInverse: '#FCF9F1',    // Eggshell on dark backgrounds
    textOnPrimary: '#1B1B1B',  // Dark text on yellow
    
    // Semantic colors
    success: '#219653',        // Forest Green
    warning: '#F2994A',        // Mango Orange
    danger: '#EB5757',         // Chilli Red
    info: '#2D9CDB',           // Sky Blue
    
    // Border colors
    border: '#E5E0D5',         // Warm grey border
    borderLight: '#F0EDE4',    // Very light warm border
    borderStrong: '#1B1B1B',   // Bold black border for emphasis
    
    // Role-specific colors (keeping hitchr identity)
    pilot: '#F2C94C',          // Rickshaw Yellow
    rider: '#2D9CDB',          // Sky Blue
    
    // Status & interaction
    active: '#219653',         // Forest Green
    inactive: '#8B8B8B',       // Stone Grey
    
    // Special effects
    overlay: 'rgba(27, 27, 27, 0.6)',
    glow: 'rgba(242, 201, 76, 0.3)',
    magentaGlow: 'rgba(255, 0, 122, 0.15)',
    
    // Legacy support
    white: '#FFFFFF',
    black: '#1B1B1B',
    text: '#1B1B1B',
    error: '#EB5757',
  },
  
  // Spacing system (8px base grid)
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Border radius - more rounded for friendly feel
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 50,
    full: 9999,
  },
  
  // Font sizes
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 48,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
  
  // Typography presets
  typography: {
    // Display/Hero text - for big moments
    hero: {
      fontSize: 48,
      fontWeight: '900' as const,
      letterSpacing: -1,
      lineHeight: 52,
    },
    // Page titles
    title: {
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
      lineHeight: 38,
    },
    // Section headers
    heading: {
      fontSize: 24,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
      lineHeight: 30,
    },
    // Card titles, emphasized text
    subheading: {
      fontSize: 18,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    // Body text
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 24,
    },
    // Small body text
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 20,
    },
    // Labels, badges
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    // Tiny text, captions
    caption: {
      fontSize: 10,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
      lineHeight: 14,
    },
  },
  
  // Shadows - warmer, softer
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#1B1B1B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#1B1B1B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#1B1B1B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#1B1B1B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
    // Colored shadows for CTAs
    glow: {
      shadowColor: '#F2C94C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    magenta: {
      shadowColor: '#FF007A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  
  // Animation durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      damping: 15,
      stiffness: 150,
    },
  },
};

// Export individual pieces for convenience
export const { colors, spacing, borderRadius, shadows, typography, fontSize, fontWeight } = theme;

export type Theme = typeof theme;
