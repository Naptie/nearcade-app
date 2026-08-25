import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Btn, Card, Chip, Input, ListRow, Screen } from '@/components/ui';
import { useThemePalette } from '@/theme/palette';
import { LOCALE_LABELS, useI18n } from '@/i18n';
import { ThemeMode, useSettings, type Locale } from '@/stores/settings';
import { useSession } from '@/stores/session';

export default function SettingsScreen() {
  const palette = useThemePalette();
  const { t } = useI18n();

  const serverUrl = useSettings((s) => s.serverUrl);
  const setServerUrl = useSettings((s) => s.setServerUrl);
  const localeOverride = useSettings((s) => s.localeOverride);
  const setLocaleOverride = useSettings((s) => s.setLocaleOverride);
  const themeOverride = useSettings((s) => s.themeOverride);
  const setThemeOverride = useSettings((s) => s.setThemeOverride);
  const logout = useSession((s) => s.logout);

  const [draftUrl, setDraftUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const normalized = draftUrl.trim().replace(/\/+$/, '');
      const res = await fetch(
        `${normalized.startsWith('http') ? normalized : `https://${normalized}`}/api/game-titles`
      );
      if (!res.ok) throw new Error(String(res.status));
      setServerUrl(draftUrl);
      Alert.alert('✓', 'OK');
    } catch (err) {
      Alert.alert(String(err instanceof Error ? err.message : err));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Screen topInset={false}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: palette.primary,
          headerStyle: { backgroundColor: palette.background },
          headerTitle: t('settings.title'),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
        {/* Server */}
        <View className="gap-2">
          <Text className="text-[13px] font-bold uppercase tracking-wide text-base-content/45">
            {t('settings.server')}
          </Text>
          <Card className="gap-2.5">
            <Text className="text-[12.5px] leading-[17px] text-base-content/50">{t('settings.serverHint')}</Text>
            <View className="flex-row items-center gap-2">
              <Input
                value={draftUrl}
                onChangeText={setDraftUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                className="flex-1"
              />
              <Btn
                label="✓"
                size="sm"
                loading={testing}
                onPress={() => void testConnection()}
                accessibilityLabel={t('common.save')}
              />
            </View>
          </Card>
        </View>

        {/* Language */}
        <View className="gap-2">
          <Text className="text-[13px] font-bold uppercase tracking-wide text-base-content/45">
            {t('settings.language')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(['en', 'zh', 'ja'] as Locale[]).map((loc) => (
              <Chip
                key={loc}
                label={LOCALE_LABELS[loc]}
                active={(localeOverride ?? null) === loc}
                icon="language"
                onPress={() => setLocaleOverride(loc)}
              />
            ))}
            <Chip
              label={`${t('theme.system')} 🌐`}
              active={localeOverride === null}
              icon="phone-portrait"
              color="secondary"
              onPress={() => setLocaleOverride(null)}
            />
          </View>
        </View>

        {/* Theme */}
        <View className="gap-2">
          <Text className="text-[13px] font-bold uppercase tracking-wide text-base-content/45">
            {t('settings.theme')}
          </Text>
          <Card padding={false} className="overflow-hidden p-1.5">
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <ListRow
                key={mode}
                icon={
                  mode === 'system'
                    ? 'contrast'
                    : mode === 'light'
                      ? 'sunny'
                      : 'moon'
                }
                label={t(`theme.${mode}`)}
                value={(themeOverride ?? 'system') === mode ? '✓' : undefined}
                onPress={() => setThemeOverride(mode)}
              />
            ))}
          </Card>
        </View>

        {/* About */}
        <View className="gap-2">
          <Text className="text-[13px] font-bold uppercase tracking-wide text-base-content/45">
            {t('settings.about')}
          </Text>
          <Card className="gap-3">
            <Text className="text-[13px] leading-[19px] text-base-content/65">{t('settings.aboutText')}</Text>
            <View className="gap-1 border-t border-base-content/10 pt-2.5">
              <Text className="text-[11px] text-base-content/40">Map tiles © OpenStreetMap contributors</Text>
              <Text className="text-[11px] text-base-content/40">Data © nearcade community</Text>
            </View>
          </Card>
        </View>

        {/* Sign out */}
        <Btn label={t('me.logout')} variant="danger" icon="log-out-outline" block onPress={logout} />
      </ScrollView>
    </Screen>
  );
}
