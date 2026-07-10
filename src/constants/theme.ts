/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E293B',
    background: '#F8FAFC',
    backgroundElement: '#E2E8F0',
    backgroundSelected: '#CBD5E1',
    textSecondary: '#64748B',
    primary: '#8B5CF6',     // Calming Lavender
    secondary: '#0D9488',   // Calm Teal
    accent: '#F43F5E',      // Rose/Red
    border: '#E2E8F0',
    card: '#FFFFFF',
  },
  dark: {
    text: '#F3F4F6',
    background: '#080C16',  // Deep Midnight Sapphire Blue
    backgroundElement: '#131A2E',
    backgroundSelected: '#1E294B',
    textSecondary: '#94A3B8',
    primary: '#60A5FA',     // Calming Sky Blue Accent
    secondary: '#2DD4BF',   // Calm Mint Accent
    accent: '#FB7185',      // Rose Pink
    border: '#1E294B',      // Dark Navy Border
    card: 'rgba(19, 26, 46, 0.85)', // Premium Navy Card
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
