import { useColorScheme } from 'react-native';
import { useSettings } from '@/stores/settings';

/**
 * Static color values for native props that cannot take Tailwind classes
 * (MapView pins, BlurView tints, StatusBar, tabBar tints, placeholders…).
 * Values mirror global.css (daisyUI emerald / forest palettes).
 */
export interface StaticPalette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryContent: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  tabBarBg: string;
  blurTint: 'light' | 'dark';
  statusBarStyle: 'dark' | 'light';
}

export const LIGHT_PALETTE: StaticPalette = {
  background: '#FFFFFF',
  surface: '#E8E8E8',
  surfaceAlt: '#F3F3F3',
  border: '#D1D1D1',
  text: '#333C4D',
  textMuted: '#7A8296',
  primary: '#4CAF6E', // slightly deepened emerald for contrast on white
  primaryContent: '#143823',
  accent: '#377CFB',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#377CFB',
  tabBarBg: 'rgba(255,255,255,0.90)',
  blurTint: 'light',
  statusBarStyle: 'dark',
};

export const DARK_PALETTE: StaticPalette = {
  background: '#1B1717',
  surface: '#161212',
  surfaceAlt: '#221D1D',
  border: '#332B2B',
  text: '#CAC9C9',
  textMuted: '#8C8888',
  primary: '#1FB854',
  primaryContent: '#041A0C',
  accent: '#1FB8AB',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#38BDF8',
  tabBarBg: 'rgba(27,23,23,0.92)',
  blurTint: 'dark',
  statusBarStyle: 'light',
};

/** CSS-variable overrides for forced (non-system) themes, mirroring global.css. */
export const LIGHT_VARS: Record<string, string> = {
  '--color-base-100': '#ffffff',
  '--color-base-200': '#e8e8e8',
  '--color-base-300': '#d1d1d1',
  '--color-base-content': '#333c4d',
  '--color-primary': '#66cc8a',
  '--color-primary-content': '#143823',
  '--color-secondary': '#377cfb',
  '--color-secondary-content': '#f7faff',
  '--color-accent': '#f68067',
  '--color-accent-content': '#3d1209',
  '--color-neutral': '#333c4d',
  '--color-neutral-content': '#f8f8f8',
  '--color-info': '#377cfb',
  '--color-info-content': '#f5f9ff',
  '--color-success': '#22c55e',
  '--color-success-content': '#05200f',
  '--color-warning': '#f59e0b',
  '--color-warning-content': '#251602',
  '--color-error': '#ef4444',
  '--color-error-content': '#2f0707',
};

export const DARK_VARS: Record<string, string> = {
  '--color-base-100': '#1b1717',
  '--color-base-200': '#161212',
  '--color-base-300': '#110d0d',
  '--color-base-content': '#cac9c9',
  '--color-primary': '#1fb854',
  '--color-primary-content': '#041a0c',
  '--color-secondary': '#1eb88e',
  '--color-secondary-content': '#031c15',
  '--color-accent': '#1fb8ab',
  '--color-accent-content': '#031b19',
  '--color-neutral': '#19362d',
  '--color-neutral-content': '#d6deda',
  '--color-info': '#38bdf8',
  '--color-info-content': '#041621',
  '--color-success': '#34d399',
  '--color-success-content': '#041a11',
  '--color-warning': '#fbbf24',
  '--color-warning-content': '#1e1503',
  '--color-error': '#f87171',
  '--color-error-content': '#220606',
};

/** The theme actually in effect (user override wins over the system scheme). */
export function useEffectiveScheme(): 'light' | 'dark' {
  const themeOverride = useSettings((s) => s.themeOverride);
  const systemScheme = useColorScheme();
  if (themeOverride === 'dark') return 'dark';
  if (themeOverride === 'light') return 'light';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/** Current theme's static palette. */
export function useThemePalette(): StaticPalette {
  return useEffectiveScheme() === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
}
