import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SERVER_URL } from '@/api/client';

export type Locale = 'en' | 'zh' | 'ja';
export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  serverUrl: string;
  localeOverride: Locale | null;
  themeOverride: ThemeMode | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  setServerUrl: (url: string) => void;
  setLocaleOverride: (locale: Locale | null) => void;
  setThemeOverride: (mode: ThemeMode | null) => void;
  setLocation: (latitude: number, longitude: number) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      serverUrl: DEFAULT_SERVER_URL,
      localeOverride: null,
      themeOverride: null,
      lastLatitude: null,
      lastLongitude: null,
      setServerUrl: (serverUrl) => {
        const trimmed = serverUrl.trim().replace(/\/+$/, '');
        set({ serverUrl: trimmed || DEFAULT_SERVER_URL });
      },
      setLocaleOverride: (localeOverride) => set({ localeOverride }),
      setThemeOverride: (themeOverride) => set({ themeOverride }),
      setLocation: (lastLatitude, lastLongitude) => set({ lastLatitude, lastLongitude }),
    }),
    {
      name: 'nearcade.settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
