import React, { useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Screen, Text, Card, Button, LoadingView, ErrorState, Segmented } from '@/components/ui';
import { OpenBadge, GameChip } from '@/components/ShopCard';
import { MarkdownView } from '@/components/MarkdownView';
import { UserAvatar } from '@/components/ShopCard';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { useAttendance, useGameTitles, useShop, useShopChangelog, useShopComments } from '@/hooks/api';
import { computeIsOpen, formatRelativeTime, openingHoursText } from '@/utils/format';
import { titleColor } from '@/utils/gameTitles';

type TabKey = 'games' | 'comments' | 'changelog';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopId = Number(id);
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<TabKey>('games');

  const shopQuery = useShop(shopId);
  const commentsQuery = useShopComments(shopId);
  const changelogQuery = useShopChangelog(shopId);
  const attendanceQuery = useAttendance(shopId);
  const titlesQuery = useGameTitles();

  const namesByTitleId = useMemo(() => {
    const map = new Map<number, string>();
    for (const title of titlesQuery.data?.titles ?? []) map.set(title.id, title.name);
    return map;
  }, [titlesQuery.data]);

  if (shopQuery.isLoading) return <LoadingView />;
  if (shopQuery.isError) return <ErrorState error={shopQuery.error} onRetry={() => void shopQuery.refetch()} />;
  const shop = shopQuery.data!;
  const isOpen =
    shop.isOpen ?? computeIsOpen(shop.openingHours, shop.timezone?.offset != null ? shop.timezone.offset * 60 : undefined);
  const addressLine = [...(shop.address.general ?? []), shop.address.detailed].filter(Boolean).join(' ');

  const openDirections = () => {
    const [lng, lat] = shop.location.coordinates;
    const label = encodeURIComponent(shop.name);
    const url =
      Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${lat},${lng}&q=${label}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    void Linking.openURL(url);
  };

  // Plain computation (post-early-return): cheap enough not to memoize.
  const totalsByGameId = new Map<number, number>();
  for (const g of attendanceQuery.data?.games ?? []) totalsByGameId.set(g.gameId, g.total);
  const reportedTotal = attendanceQuery.data?.reported?.reduce((sum, r) => sum + r.currentAttendances, 0) ?? 0;
  const rankedGames = shop.games
    .map((g) => ({ ...g, total: totalsByGameId.get(g.gameId) ?? 0 }))
    .sort((a, b) => b.total - a.total || a.titleId - b.titleId);

  const comments = commentsQuery.data ?? [];
  const changelogEntries = changelogQuery.data?.pages.flatMap((p) => p.entries) ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 21, fontWeight: '900', flexShrink: 1 }}>{shop.name}</Text>
            <OpenBadge isOpen={isOpen} />
            {shop.isClaimed ? (
              <View style={{ backgroundColor: `${colors.accent}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>{t('shop.claimed')}</Text>
              </View>
            ) : null}
            {shop.isLocked ? (
              <View style={{ backgroundColor: `${colors.warning}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.warning }}>{t('shop.locked')}</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>{addressLine}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label={t('shop.directions')} icon={<Ionicons name="map" size={15} color="#fff" />} onPress={openDirections} small />
          </View>
          <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
            {t('shop.hours')}: {openingHoursText(shop.openingHours)}
            {shop.timezone ? ` (${shop.timezone.name})` : ''}
          </Text>
        </Card>

        {/* Tabs */}
        <View style={{ marginTop: 14 }}>
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as TabKey)}
            options={[
              { value: 'games', label: t('shop.games') },
              { value: 'comments', label: t('shop.comments') },
              { value: 'changelog', label: t('shop.changelog') },
            ]}
          />
        </View>

        {/* Games tab */}
        {tab === 'games' ? (
          <View style={{ marginTop: 14, gap: 8 }}>
            {reportedTotal > 0 ? (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pulse" size={16} color={colors.success} />
                <Text style={{ color: colors.success, fontWeight: '700' }}>
                  {t('discover.attendanceNow', { count: reportedTotal })}
                </Text>
              </Card>
            ) : null}
            {rankedGames.map((game) => (
              <Card key={game.gameId}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 4, height: 34, borderRadius: 2, backgroundColor: titleColor(game.titleId) }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontWeight: '800', fontSize: 14.5 }}>{namesByTitleId.get(game.titleId) ?? game.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                      {game.version}
                      {game.cost ? ` · ${game.cost}` : ''}
                      {game.quantity > 1 ? ` · ×${game.quantity}` : ''}
                    </Text>
                  </View>
                  {game.total > 0 ? (
                    <View style={{ backgroundColor: `${colors.primary}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12.5 }}>{game.total}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Comments tab */}
        {tab === 'comments' ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            {commentsQuery.isLoading ? <LoadingView /> : null}
            {!commentsQuery.isLoading && comments.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>—</Text>
            ) : null}
            {comments.map((comment) => (
              <Card key={comment.id}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <UserAvatar name={comment.author?.displayName ?? comment.author?.name} image={comment.author?.image} size={32} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontWeight: '700', fontSize: 13 }}>
                        {comment.author?.displayName || comment.author?.name || comment.createdBy}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatRelativeTime(comment.createdAt, locale)}</Text>
                    </View>
                    <MarkdownView source={comment.content} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="arrow-up-circle" size={16} color={colors.textMuted} />
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{comment.upvotes}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="arrow-down-circle" size={16} color={colors.textMuted} />
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>{comment.downvotes}</Text>
                      </View>
                      {comment.parentCommentId ? (
                        <Text style={{ fontSize: 11, color: colors.accent }}>{t('post.reply')}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Changelog tab */}
        {tab === 'changelog' ? (
          <View style={{ marginTop: 14, gap: 8 }}>
            {changelogQuery.isLoading ? <LoadingView /> : null}
            {changelogEntries.map((entry) => (
              <Card key={entry.id} style={{ paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700' }}>
                      {entry.action}
                      {entry.fieldInfo?.field ? ` · ${entry.fieldInfo.field}` : ''}
                    </Text>
                    {(entry.oldValue || entry.newValue) && (
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                        {entry.oldValue ? `${entry.oldValue} → ` : ''}
                        {entry.newValue ?? ''}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatRelativeTime(entry.createdAt, locale)}</Text>
                </View>
              </Card>
            ))}
            {changelogQuery.hasNextPage ? (
              <Button
                label={t('common.more')}
                variant="ghost"
                loading={changelogQuery.isFetchingNextPage}
                onPress={() => void changelogQuery.fetchNextPage()}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
