import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Btn, Card, Input, Screen } from '@/components/ui';
import { useThemePalette } from '@/theme/palette';
import { useI18n } from '@/i18n';
import { useApi } from '@/api';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const api = useApi();
  const qc = useQueryClient();
  const palette = useThemePalette();

  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const signIn = async (raw: string) => {
    // Accept either a bare token or a full session-qr URL containing ?t=
    let value = raw.trim();
    const urlMatch = /[?&]t=([\w-]+)/.exec(value);
    if (urlMatch) value = urlMatch[1];
    if (!value) return;
    setBusy(true);
    try {
      await api.loginWithOneTimeToken(value);
      await qc.invalidateQueries();
      Alert.alert(t('login.success'));
      router.back();
    } catch (err) {
      Alert.alert(String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  };

  const startScan = async () => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) return;
    }
    setScanning(true);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setToken(text);
    } catch {
      // clipboard unavailable
    }
  };

  if (scanning && Platform.OS !== 'web') {
    return (
      <View className="flex-1 bg-black">
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            void signIn(data);
          }}
        >
          {/* Viewfinder frame */}
          <View className="flex-1 items-center justify-center">
            <View className="h-60 w-60 rounded-3xl border-[3px] border-primary/90" />
          </View>
          <View className="absolute bottom-0 left-0 right-0 p-6" style={{ paddingBottom: 40 }}>
            <Btn label={t('common.cancel')} variant="neutral" onPress={() => setScanning(false)} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <Screen topInset={false}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: palette.primary,
          headerStyle: { backgroundColor: palette.background },
          headerTitle: t('login.title'),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Steps card */}
        <Card className="gap-3">
          {[
            { icon: 'desktop-outline' as const, text: t('login.step1') },
            { icon: 'git-branch-outline' as const, text: t('login.step2') },
            { icon: 'qr-code-outline' as const, text: t('login.step3') },
          ].map((step, i) => (
            <View key={i} className="flex-row items-center gap-2.5">
              <View className="h-7 w-7 items-center justify-center rounded-lg bg-secondary/15">
                <Ionicons name={step.icon} size={14} className="text-secondary" />
              </View>
              <Text className="flex-1 text-[13px] leading-[18px] text-base-content/70">{step.text}</Text>
            </View>
          ))}
          <Btn
            label="nearcade.cn → Session handoff"
            variant="soft"
            size="sm"
            icon="open-outline"
            className="self-start"
            onPress={() => void Linking.openURL(`${api.baseUrl}/auth/handoff`)}
          />
        </Card>

        {Platform.OS !== 'web' ? (
          <Btn label={t('login.scanQr')} icon="scan" size="lg" onPress={() => void startScan()} />
        ) : null}

        <Card className="gap-2.5">
          <Text className="text-[13px] font-bold uppercase tracking-wide text-base-content/45">
            {t('login.tokenPlaceholder')}
          </Text>
          <Input
            value={token}
            onChangeText={setToken}
            placeholder={t('login.tokenPlaceholder')}
            multiline
            textAlignVertical="top"
            className="min-h-[64px]"
          />
          <View className="flex-row justify-end gap-2">
            <Btn label={t('common.paste')} variant="ghost" size="sm" icon="clipboard" onPress={() => void pasteFromClipboard()} />
            <Btn
              label={t('login.submit')}
              size="sm"
              loading={busy}
              disabled={!token.trim()}
              onPress={() => void signIn(token)}
            />
          </View>
        </Card>

        <Text className="text-center text-[11.5px] text-base-content/40">{t('me.signInHint')}</Text>
      </ScrollView>
    </Screen>
  );
}
