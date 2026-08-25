import { useColorScheme } from 'nativewind';

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

/** Current theme's static palette. */
export function useThemePalette(): StaticPalette {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
}
