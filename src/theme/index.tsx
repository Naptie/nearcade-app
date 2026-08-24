import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/stores/settings';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  tabInactive: string;
}

const light: ThemeColors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F6',
  border: '#E2E5EF',
  text: '#171A21',
  textMuted: '#697089',
  primary: '#E23A78',
  primarySoft: '#FDE7EF',
  accent: '#0AA2C0',
  accentSoft: '#E0F4FA',
  success: '#1D9E62',
  warning: '#C77E10',
  danger: '#D64545',
  tabInactive: '#8B91A8',
};

const dark: ThemeColors = {
  background: '#0E1016',
  surface: '#171A24',
  surfaceAlt: '#1F2330',
  border: '#2A2F40',
  text: '#F0F2F8',
  textMuted: '#9BA3BC',
  primary: '#FF3E8E',
  primarySoft: '#3A1726',
  accent: '#38E0FF',
  accentSoft: '#10303A',
  success: '#34D28B',
  warning: '#F0A63C',
  danger: '#FF6B6B',
  tabInactive: '#6B7189',
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ colors: dark, isDark: true });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const override = useSettings((s) => s.themeOverride);
  const system = useColorScheme();
  const isDark = !override || override === 'system' ? system !== 'light' : override === 'dark';
  const value = useMemo(() => ({ colors: isDark ? dark : light, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
