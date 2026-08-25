import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Alert,
  Btn,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingView,
  Screen,
  SectionTitle,
  Wordmark,
} from '@/components/ui';
import { AppMap, radiusToRegion } from '@/components/map/AppMap';
import type { MapPin } from '@/components/map/types';
import { ShopCard } from '@/components/ShopCard';
import { useThemePalette } from '@/theme/palette';
import { useI18n } from '@/i18n';
import { useDiscover, useGameTitles } from '@/hooks/api';
import { useSettings } from '@/stores/settings';

const RADIUS_OPTIONS = [1, 2, 5, 10, 20, 30];

// Fallback origin (Shanghai People's Square) so the app is usable on first
// launch before any permission is granted.
const FALLBACK = { latitude: 31.2304, longitude: 121.4737 };

const TABBAR_CLEARANCE = 84;

export default function DiscoverScreen() {
  const palette = useThemePalette();
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

  const region = useMemo(() => radiusToRegion(lat, lng, radiusKm), [lat, lng, radiusKm]);
  const pins = useMemo<MapPin[]>(
    () =>
      shops.slice(0, 40).map((shop) => ({
        id: String(shop.id),
        latitude: shop.location.coordinates[1],
        longitude: shop.location.coordinates[0],
        title: shop.name,
        onPress: () => router.push(`/shop/${shop.id}`),
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
      void Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
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
    <Screen bottomInset={TABBAR_CLEARANCE}>
      <FlatList
        data={shops}
        keyExtractor={(item) => String(item.id)}
        refreshing={discoverQuery.isRefetching}
        onRefresh={() => void discoverQuery.refetch()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="mb-2 gap-3.5">
            {/* Brand header */}
            <View className="flex-row items-end justify-between">
              <View>
                <Wordmark size={26} />
                <Text className="mt-0.5 text-[12px] font-medium text-base-content/50">{t('discover.tagline')}</Text>
              </View>
              <View className="flex-row gap-2">
                <IconButton
                  icon="navigate"
                  variant="soft"
                  loading={locating}
                  onPress={() => void locate()}
                  accessibilityLabel={t('discover.useGps')}
                />
                <IconButton
                  icon="options-outline"
                  variant="ghost"
                  onPress={() => setPickerOpen(true)}
                  accessibilityLabel={t('discover.pickLocation')}
                />
              </View>
            </View>

            {locationError ? <Alert type="warning" icon="location">{locationError}</Alert> : null}

            {/* Discover panel — mirrors the site's hero panel */}
            <View className="gap-2.5 rounded-2xl border-2 border-base-300/40 bg-base-200/60 p-3.5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="pulse" size={16} className="text-primary" />
                <Text className="text-[14px] font-extrabold tracking-tight text-base-content">{t('discover.title')}</Text>
                <View className="flex-1" />
                <Chip
                  label={`${t('discover.games')}${selectedTitles.length ? ` · ${selectedTitles.length}` : ''}`}
                  active={selectedTitles.length > 0}
                  icon="game-controller"
                  color="secondary"
                  onPress={() => setGamesOpen(true)}
                />
              </View>

              {/* Radius selector (site uses a slider; discrete chips read better on mobile) */}
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={RADIUS_OPTIONS}
                keyExtractor={(r) => String(r)}
                ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                renderItem={({ item }) => (
                  <Chip label={`${item} ${t('common.km')}`} active={radiusKm === item} onPress={() => setRadiusKm(item)} />
                )}
              />
            </View>

            {/* Live map — Apple Maps on iOS, featherweight OSM elsewhere */}
            <View className="h-52 overflow-hidden rounded-2xl border border-base-300/40">
              <AppMap region={region} pins={pins} />
            </View>

            <SectionTitle
              title={
                discoverQuery.isLoading
                  ? t('common.loading')
                  : discoverQuery.isError
                    ? t('common.error')
                    : t('discover.results', { count: shops.length })
              }
            />
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
            <EmptyState message={t('discover.noResults')} icon="map-outline" />
          )
        }
      />

      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onApply={(newLat, newLng) => {
          setLocation(newLat, newLng);
          setPickerOpen(false);
        }}
        initialLatitude={lat}
        initialLongitude={lng}
      />

      <GamesFilterModal
        open={gamesOpen}
        onClose={() => setGamesOpen(false)}
        selected={selectedTitles}
        toggle={toggleTitle}
        clear={() => setSelectedTitles([])}
      />
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function LocationPickerModal({
  open,
  onClose,
  onApply,
  initialLatitude,
  initialLongitude,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (latitude: number, longitude: number) => void;
  initialLatitude: number;
  initialLongitude: number;
}) {
  const { t } = useI18n();
  const [draftLat, setDraftLat] = useState(String(initialLatitude));
  const [draftLng, setDraftLng] = useState(String(initialLongitude));

  React.useEffect(() => {
    if (open) {
      setDraftLat(initialLatitude.toFixed(5));
      setDraftLng(initialLongitude.toFixed(5));
    }
  }, [open, initialLatitude, initialLongitude]);

  const apply = () => {
    const newLat = parseFloat(draftLat);
    const newLng = parseFloat(draftLng);
    if (!Number.isFinite(newLat) || !Number.isFinite(newLng)) return;
    onApply(clampCoord(newLat, -90, 90), clampCoord(newLng, -180, 180));
  };

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen topInset={false} className="p-4">
        <Text className="mb-4 text-xl font-extrabold tracking-tight text-base-content">{t('discover.pickLocation')}</Text>
        <View className="gap-3">
          <Input value={draftLat} onChangeText={setDraftLat} keyboardType="numbers-and-punctuation" placeholder={t('discover.latitude')} />
          <Input value={draftLng} onChangeText={setDraftLng} keyboardType="numbers-and-punctuation" placeholder={t('discover.longitude')} />
          <View className="mt-1 flex-row justify-end gap-2">
            <Btn label={t('common.cancel')} variant="ghost" onPress={onClose} />
            <Btn label={t('discover.apply')} onPress={apply} icon="checkmark" />
          </View>
        </View>
      </Screen>
    </Modal>
  );
}

function clampCoord(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function GamesFilterModal({
  open,
  onClose,
  selected,
  toggle,
  clear,
}: {
  open: boolean;
  onClose: () => void;
  selected: number[];
  toggle: (id: number) => void;
  clear: () => void;
}) {
  const { t } = useI18n();
  const palette = useThemePalette();
  const titlesQuery = useGameTitles();
  const titles = titlesQuery.data?.titles ?? [];

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen topInset={false}>
        <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
          <Text className="text-xl font-extrabold tracking-tight text-base-content">{t('discover.gameFilter')}</Text>
          <Pressable hitSlop={8} onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-base-200 active:bg-base-300/60">
            <Ionicons name="close" size={18} color={palette.textMuted} />
          </Pressable>
        </View>
        <FlatList
          data={titles}
          keyExtractor={(title) => String(title.id)}
          contentContainerStyle={{ padding: 20 }}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Chip
              label={item.name}
              active={selected.includes(item.id)}
              color="secondary"
              className="flex-1"
              onPress={() => toggle(item.id)}
            />
          )}
          ListFooterComponent={
            selected.length > 0 ? (
              <Btn label={t('discover.clearGames')} variant="ghost" size="sm" className="mt-4 self-center" onPress={clear} />
            ) : null
          }
        />
      </Screen>
    </Modal>
  );
}
