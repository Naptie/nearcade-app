import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Screen, Text, Card, Chip, Button, LoadingView, ErrorState, EmptyState } from '@/components/ui';
import { TileMap, type MapMarker } from '@/components/TileMap';
import { ShopCard } from '@/components/ShopCard';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { useDiscover, useGameTitles } from '@/hooks/api';
import { useSettings } from '@/stores/settings';
import { titleName } from '@/utils/gameTitles';
import { useRouter } from 'expo-router';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 30];

// Fallback origin (Shanghai People's Square) so the app is usable on first
// launch before any permission is granted.
const FALLBACK = { latitude: 31.2304, longitude: 121.4737 };

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const lastLatitude = useSettings((s) => s.lastLatitude);
  const lastLongitude = useSettings((s) => s.lastLongitude);
  const setLocation = useSettings((s) => s.setLocation);

  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedTitles, setSelectedTitles] = useState<number[]>([]);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);

  const lat = lastLatitude ?? FALLBACK.latitude;
  const lng = lastLongitude ?? FALLBACK.longitude;

  const titlesQuery = useGameTitles();
  const namesByTitleId = useMemo(() => {
    const map = new Map<number, string>();
    for (const title of titlesQuery.data?.titles ?? []) map.set(title.id, title.name);
    return map;
  }, [titlesQuery.data]);

  const discoverQuery = useDiscover(lat, lng, radiusKm, selectedTitles);
  const shops = discoverQuery.data?.shops ?? [];

  const markers = useMemo<MapMarker[]>(
    () =>
      shops.slice(0, 30).map((shop) => ({
        latitude: shop.location.coordinates[1],
        longitude: shop.location.coordinates[0],
        onPress: () => router.push(`/shop/${shop.id}` as never),
      })),
    [shops, router]
  );

  const locate = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('permission denied');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(pos.coords.latitude, pos.coords.longitude);
      if (Haptics.impactAsync) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setLocationError(t('discover.locationFailed'));
    } finally {
      setLocating(false);
    }
  }, [setLocation, t]);

  const toggleTitle = (id: number) => {
    setSelectedTitles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <Screen>
      <FlatList
        data={shops}
        keyExtractor={(item) => String(item.id)}
        refreshing={discoverQuery.isRefetching}
        onRefresh={() => void discoverQuery.refetch()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 24, fontWeight: '900' }}>{t('discover.title')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={locate}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="navigate" size={18} color={colors.accent} />
                </Pressable>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {locationError ? (
              <Text style={{ fontSize: 12.5, color: colors.danger }}>{locationError}</Text>
            ) : null}

            {/* Filter row */}
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {RADIUS_OPTIONS.map((r) => (
                  <Chip key={r} label={`${r} ${t('common.km')}`} active={radiusKm === r} onPress={() => setRadiusKm(r)} />
                ))}
                <Chip
                  label={`${t('discover.games')}${selectedTitles.length ? ` · ${selectedTitles.length}` : ''}`}
                  active={selectedTitles.length > 0}
                  onPress={() => setGamesOpen(true)}
                  color={colors.accent}
                />
              </ScrollView>
            </View>

            {/* Map */}
            <TileMap center={{ latitude: lat, longitude: lng }} markers={markers} height={190} initialZoom={11} />

            <Text style={{ fontSize: 13, color: colors.textMuted }}>
              {discoverQuery.isLoading ? t('common.loading') : t('discover.results', { count: shops.length })}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <ShopCard shop={item} namesByTitleId={namesByTitleId} onPress={() => router.push(`/shop/${item.id}`)} />
          </View>
        )}
        ListEmptyComponent={
          discoverQuery.isLoading || titlesQuery.isLoading ? (
            <LoadingView />
          ) : discoverQuery.isError ? (
            <ErrorState error={discoverQuery.error} onRetry={() => void discoverQuery.refetch()} />
          ) : (
            <EmptyState message={t('discover.noResults')} icon={<Ionicons name="sad" size={40} color={colors.textMuted} />} />
          )
        }
      />

      {/* Manual location picker */}
      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onApply={(latitude, longitude) => {
          setLocation(latitude, longitude);
          setPickerOpen(false);
        }}
        initialLatitude={lat}
        initialLongitude={lng}
      />

      {/* Game filter modal */}
      <Modal visible={gamesOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setGamesOpen(false)}>
        <Screen style={{ paddingTop: 48, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '900' }}>{t('discover.gameFilter')}</Text>
            <Button label={t('common.close')} variant="ghost" small onPress={() => setGamesOpen(false)} />
          </View>
          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 32 }}>
            {(titlesQuery.data?.titles ?? []).map((title) => (
              <Chip
                key={title.id}
                label={titleName(title, namesByTitleId)}
                active={selectedTitles.includes(title.id)}
                onPress={() => toggleTitle(title.id)}
              />
            ))}
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
}

function LocationPickerModal({
  open,
  onClose,
  onApply,
  initialLatitude,
  initialLongitude,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (lat: number, lng: number) => void;
  initialLatitude: number;
  initialLongitude: number;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [latText, setLatText] = useState(String(initialLatitude));
  const [lngText, setLngText] = useState(String(initialLongitude));

  React.useEffect(() => {
    if (open) {
      setLatText(initialLatitude.toFixed(5));
      setLngText(initialLongitude.toFixed(5));
    }
  }, [open, initialLatitude, initialLongitude]);

  const apply = () => {
    const latitude = parseFloat(latText);
    const longitude = parseFloat(lngText);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    onApply(latitude, longitude);
  };

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000088', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ width: '100%', maxWidth: 420, gap: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: '800' }}>{t('discover.pickLocation')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{t('discover.latitude')}</Text>
              <TextInput
                value={latText}
                onChangeText={setLatText}
                keyboardType="numbers-and-punctuation"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                }}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{t('discover.longitude')}</Text>
              <TextInput
                value={lngText}
                onChangeText={setLngText}
                keyboardType="numbers-and-punctuation"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  color: colors.text,
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Button label={t('common.cancel')} variant="ghost" onPress={onClose} small />
            <Button label={t('discover.apply')} onPress={apply} small />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
