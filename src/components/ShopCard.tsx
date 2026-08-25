import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge,
  Card,
  Meta,
} from '@/components/ui';
import { cn } from '@/lib/cn';
import { useI18n } from '@/i18n';
import { titleColor } from '@/utils/gameTitles';
import { formatDistance, openingHoursText } from '@/utils/format';
import { DENSITY_BORDER, DENSITY_TEXT, attendanceDensity } from '@/utils/attendance';
import type { DiscoverShop, Shop } from '@/api/types';

/** Soft pill for a game machine, mirroring the site's `badge badge-soft`. */
export function GameChip({ name, color, quantity }: { name: string; color?: string; quantity?: number }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-lg border border-base-300/50 bg-base-100/70 px-2 py-1">
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color ?? '#E23A78' }} />
      <Text className="text-[11.5px] font-bold text-base-content/85">{name}</Text>
      {quantity != null && quantity > 1 ? (
        <Text className="text-[10.5px] font-semibold text-base-content/45">×{quantity}</Text>
      ) : null}
    </View>
  );
}

export function ShopGameChips({
  shop,
  namesByTitleId,
}: {
  shop: Shop | DiscoverShop;
  namesByTitleId: Map<number, string>;
}) {
  const games = [...shop.games]
    .sort((a, b) => (b.totalAttendance ?? 0) - (a.totalAttendance ?? 0))
    .slice(0, 6);
  if (games.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {games.map((g) => (
        <GameChip
          key={g.gameId}
          name={namesByTitleId.get(g.titleId) ?? g.name}
          color={titleColor(g.titleId)}
          quantity={g.quantity}
        />
      ))}
      {shop.games.length > 6 ? (
        <View className="justify-center">
          <Text className="text-[11.5px] font-semibold text-base-content/45">+{shop.games.length - 6}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function OpenBadge({ isOpen }: { isOpen: boolean | null | undefined }) {
  const { t } = useI18n();
  if (isOpen == null) return null;
  return (
    <Badge color={isOpen ? 'success' : 'error'}>{isOpen ? t('common.open') : t('common.closed')}</Badge>
  );
}

function addressLineOf(shop: Shop): string {
  return [...(shop.address.general ?? []), shop.address.detailed].filter(Boolean).join(' ');
}

/**
 * Arcade card replicating nearcade.cn's ShopCard: 2px density-tinted border,
 * clock/location meta rows, soft game badges and a live-attendance footer.
 */
export function ShopCard({
  shop,
  onPress,
  namesByTitleId,
}: {
  shop: DiscoverShop;
  onPress?: () => void;
  namesByTitleId: Map<number, string>;
}) {
  const { t } = useI18n();
  const density = attendanceDensity(shop.totalAttendance);
  const addressLine = addressLineOf(shop);

  return (
    <Card onPress={onPress} padding={false} className={cn('border-2 p-4', DENSITY_BORDER[density])}>
      {/* Name + status */}
      <View className="flex-row items-center gap-2">
        <Text className="shrink text-[16px] font-extrabold tracking-tight text-base-content" numberOfLines={1}>
          {shop.name}
        </Text>
        <OpenBadge isOpen={shop.isOpen} />
        <View className="flex-1" />
        {typeof shop.distance === 'number' ? (
          <Badge color="primary">{formatDistance(shop.distance)}</Badge>
        ) : null}
      </View>

      {/* Meta rows */}
      {shop.isOpen != null || shop.openingHours?.length ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="time" size={13} className="text-primary" />
          <Text className="flex-1 text-[12px] font-medium text-base-content/60" numberOfLines={1}>
            {openingShort(shop)}
          </Text>
        </View>
      ) : null}
      {addressLine ? (
        <View className="mt-1 flex-row items-center gap-1.5">
          <Ionicons name="location" size={13} className="text-primary" />
          <Text className="flex-1 text-[12px] font-medium text-base-content/60" numberOfLines={1}>
            {addressLine}
          </Text>
        </View>
      ) : null}

      {/* Games */}
      <View className="mt-2.5">
        <ShopGameChips shop={shop} namesByTitleId={namesByTitleId} />
      </View>

      {/* Footer */}
      <View className="mt-3 flex-row items-center justify-between border-t border-base-content/10 pt-2.5">
        <Meta icon="desktop" value={`${shop.games.length} ${t('common.machines')}`} />
        <View className="flex-row items-center gap-1">
          <Ionicons name="person" size={12} className={DENSITY_TEXT[density]} />
          <Text className={cn('text-[12px] font-bold', DENSITY_TEXT[density])}>
            {(shop.totalAttendance ?? 0) > 0
              ? t('discover.attendanceNow', { count: shop.totalAttendance ?? 0 })
              : t('discover.nobodyPlaying')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function openingShort(shop: DiscoverShop): string {
  return openingHoursText(shop.openingHours);
}

/** Compact horizontal mini-card for "frequenting / starred" rails. */
export function ShopMiniCard({ shop, onPress }: { shop: Shop; onPress?: () => void }) {
  return (
    <Card onPress={onPress} padding={false} className="w-44 shrink grow-0 p-3">
      <Text className="text-[13.5px] font-extrabold tracking-tight text-base-content" numberOfLines={1}>
        {shop.name}
      </Text>
      <Text className="mt-0.5 text-[11.5px] font-medium text-base-content/55" numberOfLines={1}>
        {addressLineOf(shop)}
      </Text>
      <View className="mt-2 flex-row items-center justify-between">
        <Badge color="primary">{`${shop.games.length} 🕹`}</Badge>
        <OpenBadge isOpen={shop.isOpen ?? null} />
      </View>
    </Card>
  );
}
