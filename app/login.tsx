import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, TextInput as RNTextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { useApi } from '@/api';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const api = useApi();
  const qc = useQueryClient();

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
      <Screen>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            void signIn(data);
          }}
        >
          <View style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end', padding: 24 }}>
            <Button label={t('common.cancel')} onPress={() => setScanning(false)} variant="outline" />
          </View>
        </CameraView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, gap: 14, paddingBottom: 48 }}>
        <Text style={{ fontSize: 26, fontWeight: '900' }}>{t('login.title')}</Text>

        <Card style={{ gap: 10 }}>
          {[
            { icon: 'desktop-outline' as const, text: t('login.step1') },
            { icon: 'git-branch-outline' as const, text: t('login.step2') },
            { icon: 'qr-code-outline' as const, text: t('login.step3') },
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={step.icon} size={18} color={colors.accent} />
              <Text style={{ fontSize: 13.5, color: colors.textMuted, flex: 1 }}>{step.text}</Text>
            </View>
          ))}
          <Button
            label="nearcade.cn → Session handoff"
            variant="ghost"
            small
            icon={<Ionicons name="open-outline" size={13} color={colors.primary} />}
            onPress={() => void Linking.openURL(`${api.baseUrl}/auth/handoff`)}
          />
        </Card>

        {Platform.OS !== 'web' ? (
          <Button
            label={t('login.scanQr')}
            icon={<Ionicons name="scan" size={17} color="#fff" />}
            onPress={() => void startScan()}
            loading={false}
          />
        ) : null}

        <Card style={{ gap: 10 }}>
          <RNTextInput
            value={token}
            onChangeText={setToken}
            placeholder={t('login.tokenPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            style={{
              minHeight: 64,
              color: colors.text,
              fontSize: 14,
              backgroundColor: colors.surfaceAlt,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              label="📋"
              variant="ghost"
              small
              onPress={() => void pasteFromClipboard()}
            />
            <Button label={t('login.submit')} loading={busy} disabled={!token.trim()} onPress={() => void signIn(token)} small />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
