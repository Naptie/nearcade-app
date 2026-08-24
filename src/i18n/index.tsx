import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import { useSettings, type Locale } from '@/stores/settings';
import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';

const dictionaries: Record<Locale, Record<string, string>> = { en, zh, ja };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

function detectSystemLocale(): Locale {
  let tag = 'en';
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    tag = navigator.language || 'en';
  }
  const lower = tag.toLowerCase();
  if (lower.startsWith('zh')) return 'zh';
  if (lower.startsWith('ja')) return 'ja';
  return 'en';
}

interface I18nContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({ locale: 'en', t: (k) => k });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const localeOverride = useSettings((s) => s.localeOverride);
  const locale = localeOverride ?? detectSystemLocale();
  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale] ?? en;
    const t = (key: string, params?: Record<string, string | number>) => {
      let text = dict[key] ?? en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    };
    return { locale, t };
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
