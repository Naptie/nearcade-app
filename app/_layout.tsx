import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, useTheme } from '@/theme';
import { I18nProvider } from '@/i18n';
import { ApiProvider } from '@/api';
import { useSession } from '@/stores/session';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function InnerLayout() {
  const { colors, isDark } = useTheme();
  const hydrated = useSession((s) => s.hydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Give zustand persist one tick to rehydrate before first render.
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!hydrated && !ready) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="shop/[id]" />
        <Stack.Screen name="university/[id]" />
        <Stack.Screen name="club/[id]" />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <ApiProvider>
            <InnerLayout />
          </ApiProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
