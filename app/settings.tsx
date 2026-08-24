import React, { useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, Chip, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { useI18n, LOCALE_LABELS } from '@/i18n';
import { useSettings, type Locale, type ThemeMode } from '@/stores/settings';
import { useSession } from '@/stores/session';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

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
      const res = await fetch(`${normalized.startsWith('http') ? normalized : `https://${normalized}`}/api/game-titles`);
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
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 48 }} style={{}}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Ionicons name="settings" size={22} color={colors.primary} />
          <Text style={{ fontSize: 24, fontWeight: '900' }}>{t('settings.title')}</Text>
        </View>

        <SectionHeader title={t('settings.server')} />
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12.5, color: colors.textMuted, marginBottom: 6 }}>{t('settings.serverHint')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={draftUrl}
              onChangeText={setDraftUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 14,
                backgroundColor: colors.surfaceAlt,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            />
            <Button label="✓" small loading={testing} onPress={() => void testConnection()} />
          </View>
        </Card>

        <SectionHeader title={t('settings.language')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {(['en', 'zh', 'ja'] as Locale[]).map((loc) => (
            <Chip key={loc} label={LOCALE_LABELS[loc]} active={(localeOverride ?? null) === loc} onPress={() => setLocaleOverride(loc)} />
          ))}
          <Chip label={`${t('theme.system')} 🌐`} active={localeOverride === null} onPress={() => setLocaleOverride(null)} />
        </View>

        <SectionHeader title={t('settings.theme')} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
            <Chip
              key={mode}
              label={t(`theme.${mode}`)}
              active={(themeOverride ?? 'system') === mode}
              onPress={() => setThemeOverride(mode)}
            />
          ))}
        </View>

        <SectionHeader title={t('me.notifications')} />
        <Card style={{ marginBottom: 20 }}>
          <Button
            label={t('me.logout')}
            variant="danger"
            small
            icon={<Ionicons name="log-out-outline" size={14} color="#fff" />}
            onPress={() => {
              logout();
              router.back();
            }}
          />
        </Card>

        <SectionHeader title={t('settings.about')} />
        <Card>
          <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textMuted }}>{t('settings.aboutText')}</Text>
          <Text style={{ fontSize: 11.5, marginTop: 10, color: colors.textMuted }}>
            Map tiles © OpenStreetMap contributors · Data © nearcade.cn community
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}
