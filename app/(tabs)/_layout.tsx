import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
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
