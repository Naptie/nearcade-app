import '../global.css';

import React, { useEffect, useState } from 'react';
import { Appearance, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { VariableContextProvider } from 'nativewind';
import { useSettings } from '@/stores/settings';
import { useSession } from '@/stores/session';
import { DARK_VARS, LIGHT_VARS, useThemePalette } from '@/theme/palette';
import { I18nProvider, useI18n } from '@/i18n';
import { ApiProvider } from '@/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

void SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Applies the user's theme preference. Native uses Appearance.setColorScheme
 * (flips prefers-color-scheme for `dark:` variants); every platform gets the
 * matching CSS-variable overrides via VariableContextProvider (react-native-web
 * lacks Appearance.setColorScheme, so the context does the heavy lifting).
 */
function ThemeSync({ children }: { children: React.ReactNode }) {
  const themeOverride = useSettings((s) => s.themeOverride);

  React.useEffect(() => {
    // react-native-web's Appearance polyfill has no setColorScheme — the
    // VariableContextProvider below handles forced themes there.
    try {
      if (typeof Appearance.setColorScheme === 'function') {
        if (themeOverride === 'dark' || themeOverride === 'light') {
          Appearance.setColorScheme(themeOverride);
        } else {
          Appearance.setColorScheme('unspecified');
        }
      }
    } catch {
      // Appearance overrides unsupported on this platform — vars still apply.
    }
  }, [themeOverride]);

  if (themeOverride === 'dark') {
    return <VariableContextProvider value={DARK_VARS}>{children}</VariableContextProvider>;
  }
  if (themeOverride === 'light') {
    return <VariableContextProvider value={LIGHT_VARS}>{children}</VariableContextProvider>;
  }
  return <>{children}</>;
}

function InnerLayout() {
  const palette = useThemePalette();
  const { t } = useI18n();
  const hydrated = useSessionHydrated();
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });
  // Fallback so a stuck hydration/font load can never blank the app.
  const [gateTimedOut, setGateTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setGateTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const ready = (hydrated && (fontsLoaded || Boolean(fontError))) || gateTimedOut;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  return (
    <ThemeSync>
      <StatusBar style={palette.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shop/[id]" options={detailHeaderOptions(palette, t('title.shop'))} />
        <Stack.Screen name="university/[id]" options={detailHeaderOptions(palette, t('title.university'))} />
        <Stack.Screen name="club/[id]" options={detailHeaderOptions(palette, t('title.club'))} />
        <Stack.Screen name="post/[id]" options={detailHeaderOptions(palette, t('title.post'))} />
        <Stack.Screen
          name="login"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            ...detailHeaderOptions(palette, t('login.title')),
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            ...detailHeaderOptions(palette, t('me.notifications')),
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            ...detailHeaderOptions(palette, t('settings.title')),
          }}
        />
      </Stack>
    </ThemeSync>
  );
}

function detailHeaderOptions(palette: ReturnType<typeof useThemePalette>, title?: string) {
  return {
    headerShown: true,
    headerShadowVisible: false,
    headerBackTitle: '',
    headerTintColor: palette.primary,
    headerStyle: { backgroundColor: palette.background },
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
    headerTitle: title ?? '',
  };
}

function useSessionHydrated(): boolean {
  return useSession((s) => s.hydrated);
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <I18nProvider>
          <ApiProvider>
            <InnerLayout />
          </ApiProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
