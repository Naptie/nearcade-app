import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemePalette } from '@/theme/palette';
import { useI18n } from '@/i18n';

export default function TabsLayout() {
  const palette = useThemePalette();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarIconStyle: { marginTop: 2 },
        /* Floating glass capsule — the app counterpart of the site's
           liquid-glass navigation bar. */
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 8,
          height: 60,
          borderRadius: 999,
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : palette.tabBarBg,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint={palette.blurTint}
              intensity={45}
              style={[StyleSheet.absoluteFill, { borderRadius: 999, overflow: 'hidden' }]}
            />
          ) : null,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: t('tabs.rankings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="podium" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.community'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
