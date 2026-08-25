import '../global.css';

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useSettings } from '@/stores/settings';
import { useSession } from '@/stores/session';
import { useThemePalette } from '@/theme/palette';
import { I18nProvider } from '@/i18n';
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

/** Applies the user's theme preference to NativeWind's color scheme. */
function ThemeSync() {
  const { setColorScheme } = useColorScheme();
  const themeOverride = useSettings((s) => s.themeOverride);
  React.useEffect(() => {
    setColorScheme(themeOverride === 'dark' ? 'dark' : themeOverride === 'light' ? 'light' : 'system');
  }, [themeOverride, setColorScheme]);
  return null;
}

function InnerLayout() {
  const palette = useThemePalette();
  const hydrated = useSessionHydrated();
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  useEffect(() => {
    if (hydrated && fontsLoaded) void SplashScreen.hideAsync().catch(() => {});
  }, [hydrated, fontsLoaded]);

  if (!hydrated || !fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  return (
    <>
      <ThemeSync />
      <StatusBar style={palette.statusBarStyle} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shop/[id]" options={detailHeaderOptions(palette)} />
        <Stack.Screen name="university/[id]" options={detailHeaderOptions(palette)} />
        <Stack.Screen name="club/[id]" options={detailHeaderOptions(palette)} />
        <Stack.Screen name="post/[id]" options={detailHeaderOptions(palette)} />
        <Stack.Screen
          name="login"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            ...detailHeaderOptions(palette),
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            ...detailHeaderOptions(palette),
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            ...detailHeaderOptions(palette),
          }}
        />
      </Stack>
    </>
  );
}

function detailHeaderOptions(palette: ReturnType<typeof useThemePalette>) {
  return {
    headerShown: true,
    headerShadowVisible: false,
    headerBackTitle: '',
    headerTintColor: palette.primary,
    headerStyle: { backgroundColor: palette.background },
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
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
