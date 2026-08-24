import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text, Card } from '@/components/ui';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { titleColor } from '@/utils/gameTitles';
import { formatDistance } from '@/utils/format';
import type { DiscoverShop, Shop } from '@/api/types';

export function GameChip({ name, color, quantity }: { name: string; color?: string; quantity?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.surfaceAlt,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color ?? colors.accent }} />
      <Text style={{ fontSize: 12, fontWeight: '600' }}>{name}</Text>
      {quantity != null && quantity > 1 ? <Text style={{ fontSize: 11, color: colors.textMuted }}>×{quantity}</Text> : null}
    </View>
  );
}

export function ShopGameChips({ shop, namesByTitleId }: { shop: Shop | DiscoverShop; namesByTitleId: Map<number, string> }) {
  const games = [...shop.games].sort((a, b) => (b.totalAttendance ?? 0) - (a.totalAttendance ?? 0)).slice(0, 6);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {games.map((g) => (
        <GameChip key={g.gameId} name={namesByTitleId.get(g.titleId) ?? g.name} color={titleColor(g.titleId)} quantity={g.quantity} />
      ))}
      {shop.games.length > 6 ? (
        <View style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: 12, color: '#9BA3BC' }}>+{shop.games.length - 6}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function OpenBadge({ isOpen }: { isOpen: boolean | null | undefined }) {
  const { t } = useI18n();
  if (isOpen == null) return null;
  return (
    <View
      style={{
        backgroundColor: isOpen ? '#34D28B22' : '#FF6B6B22',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '700', color: isOpen ? '#34D28B' : '#FF6B6B' }}>
        {isOpen ? t('common.open') : t('common.closed')}
      </Text>
    </View>
  );
}

export function ShopCard({
  shop,
  onPress,
  namesByTitleId,
}: {
  shop: DiscoverShop;
  onPress?: () => void;
  namesByTitleId: Map<number, string>;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const addressLine = shop.address.general?.slice(1).join(' ');
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', flexShrink: 1 }} numberOfLines={1}>
              {shop.name}
            </Text>
            <OpenBadge isOpen={shop.isOpen} />
          </View>
          {addressLine ? (
            <Text style={{ fontSize: 12.5, color: colors.textMuted }} numberOfLines={1}>
              {addressLine} · {shop.address.detailed}
            </Text>
          ) : null}
          <ShopGameChips shop={shop} namesByTitleId={namesByTitleId} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {typeof shop.distance === 'number' ? (
            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>{formatDistance(shop.distance)}</Text>
          ) : null}
          {(shop.totalAttendance ?? 0) > 0 ? (
            <Text style={{ fontSize: 11, color: colors.success, fontWeight: '700' }}>
              {t('discover.attendanceNow', { count: shop.totalAttendance ?? 0 })}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export function UserAvatar({ name, image, size = 36 }: { name?: string | null; image?: string | null; size?: number }) {
  const { colors } = useTheme();
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  const bg = ['#E23A78', '#0AA2C0', '#7C5CE0', '#1D9E62', '#D08A2C'][initial.charCodeAt(0) % 5];
  if (image) {
    return <ExpoImage source={{ uri: image }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{initial}</Text>
    </View>
  );
}
