import React, { useMemo, useState } from 'react';
import { Alert as RNAlert, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Alert,
  Avatar,
  Badge,
  Btn,
  Card,
  ErrorState,
  LoadingView,
  Screen,
  SegTabs,
} from '@/components/ui';
import { OpenBadge } from '@/components/ShopCard';
import { MarkdownView } from '@/components/MarkdownView';
import { useI18n } from '@/i18n';
import {
  useAttendance,
  useGameTitles,
  useShop,
  useShopChangelog,
  useShopComments,
} from '@/hooks/api';
import { computeIsOpen, formatRelativeTime, openingHoursText } from '@/utils/format';
import { titleColor } from '@/utils/gameTitles';
import { openDirections } from '@/utils/mapLinks';

type TabKey = 'games' | 'comments' | 'changelog';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopId = Number(id);
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
    shop.isOpen ??
    computeIsOpen(shop.openingHours, shop.timezone?.offset != null ? shop.timezone.offset * 60 : undefined);
  const addressLine = [...(shop.address.general ?? []), shop.address.detailed].filter(Boolean).join(' ');

  const copyAddress = async () => {
    void Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(addressLine || `${shop.name}`);
    RNAlert.alert(t('common.copied'));
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
    <>
      <Stack.Screen options={{ headerTitle: shop.name }} />
      <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="shrink text-[21px] font-extrabold tracking-tight text-base-content">{shop.name}</Text>
            <OpenBadge isOpen={isOpen} />
            {shop.isClaimed ? <Badge color="accent">{t('shop.claimed')}</Badge> : null}
            {shop.isLocked ? <Badge color="warning">{t('shop.locked')}</Badge> : null}
          </View>

          {addressLine ? (
            <Alert type="info" icon="location">
              {addressLine}
            </Alert>
          ) : null}

          {/* Action row */}
          <View className="flex-row gap-2">
            <Btn
              label={t('shop.directions')}
              variant="primary"
              size="sm"
              icon="map"
              onPress={() =>
                void openDirections(
                  shop.location.coordinates[1],
                  shop.location.coordinates[0],
                  shop.name
                )
              }
            />
            <Btn label={t('common.copy')} variant="soft" size="sm" icon="copy" onPress={() => void copyAddress()} />
          </View>

          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time" size={13} className="text-primary" />
            <Text className="flex-1 text-[12.5px] font-medium text-base-content/55">
              {openingHoursText(shop.openingHours)}
              {shop.timezone ? ` · ${shop.timezone.name}` : ''}
            </Text>
          </View>
        </View>

        {/* Description (site renders the markdown description here) */}
        {shop.comment ? (
          <Card className="mt-4">
            <MarkdownView source={shop.comment} />
          </Card>
        ) : null}

        {/* Tabs */}
        <SegTabs
          className="mt-4"
          value={tab}
          onChange={(v) => setTab(v)}
          options={[
            { value: 'games', label: t('shop.games') },
            { value: 'comments', label: t('shop.comments') },
            { value: 'changelog', label: t('shop.changelog') },
          ]}
        />

        {/* Games tab */}
        {tab === 'games' ? (
          <View className="mt-3.5 gap-2">
            <LiveAttendanceBanner total={attendanceQuery.data?.total ?? 0} reported={reportedTotal} />
            {rankedGames.map((game) => (
              <Card key={game.gameId}>
                <View className="flex-row items-center gap-3">
                  <View style={{ width: 4, height: 36, borderRadius: 2, backgroundColor: titleColor(game.titleId) }} />
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[14px] font-bold tracking-tight text-base-content" numberOfLines={1}>
                      {namesByTitleId.get(game.titleId) ?? game.name}
                    </Text>
                    <Text className="text-[11.5px] font-medium text-base-content/50" numberOfLines={1}>
                      {[game.version, game.cost, game.quantity > 1 ? `×${game.quantity}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  {game.total > 0 ? <Badge color={game.total >= 10 ? 'warning' : 'success'}>{`${game.total} 🎮`}</Badge> : null}
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Comments tab */}
        {tab === 'comments' ? (
          <View className="mt-3.5 gap-2.5">
            {commentsQuery.isLoading ? <LoadingView /> : null}
            {!commentsQuery.isLoading && comments.length === 0 ? (
              <EmptyCommentHint />
            ) : null}
            {comments.map((comment) => (
              <Card key={comment.id}>
                <View className="flex-row gap-2.5">
                  <Avatar name={comment.author?.displayName ?? comment.author?.name} image={comment.author?.image} size={32} />
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[13px] font-bold text-base-content">
                        {comment.author?.displayName || comment.author?.name || comment.createdBy}
                      </Text>
                      <Text className="text-[11px] text-base-content/45">{formatRelativeTime(comment.createdAt, locale)}</Text>
                    </View>
                    <MarkdownView source={comment.content} />
                    <View className="mt-0.5 flex-row items-center gap-3">
                      <VotePill direction="up" count={comment.upvotes} active={comment.vote?.voteType === 'upvote'} />
                      <VotePill direction="down" count={comment.downvotes} active={comment.vote?.voteType === 'downvote'} />
                      {comment.parentCommentId ? <Text className="text-[11px] font-bold text-accent">{t('post.reply')}</Text> : null}
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {/* Changelog tab */}
        {tab === 'changelog' ? (
          <View className="mt-3.5 gap-2">
            {changelogQuery.isLoading ? <LoadingView /> : null}
            {changelogEntries.map((entry) => (
              <Card key={entry.id} padding={false} className="p-3">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-base-content">
                      {entry.action}
                      {entry.fieldInfo?.field ? ` · ${entry.fieldInfo.field}` : ''}
                    </Text>
                    {(entry.oldValue || entry.newValue) && (
                      <Text className="mt-1 text-[12px] font-medium text-base-content/50" numberOfLines={2}>
                        {entry.oldValue ? `${entry.oldValue} → ` : ''}
                        {entry.newValue ?? ''}
                      </Text>
                    )}
                  </View>
                  <Text className="text-[11px] text-base-content/45">{formatRelativeTime(entry.createdAt, locale)}</Text>
                </View>
              </Card>
            ))}
            {changelogQuery.hasNextPage ? (
              <Btn
                label={t('common.more')}
                variant="ghost"
                size="sm"
                className="self-center"
                loading={changelogQuery.isFetchingNextPage}
                onPress={() => void changelogQuery.fetchNextPage()}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
    </>
  );
}

function LiveAttendanceBanner({ total, reported }: { total: number; reported: number }) {
  const { t } = useI18n();
  const count = Math.max(total, reported);
  if (count <= 0) return null;
  return (
    <Alert type={count >= 15 ? 'error' : count >= 8 ? 'warning' : 'success'} icon="pulse">
      {t('discover.attendanceNow', { count })}
    </Alert>
  );
}

function VotePill({ direction, count, active }: { direction: 'up' | 'down'; count: number; active: boolean }) {
  const cls = active
    ? direction === 'up'
      ? 'bg-success/20 text-success'
      : 'bg-error/20 text-error'
    : 'bg-base-content/5 text-base-content/50';
  return (
    <View className={`flex-row items-center gap-1 rounded-lg px-2 py-0.5 ${cls}`}>
      <Ionicons name={direction === 'up' ? 'arrow-up' : 'arrow-down'} size={12} />
      <Text className="text-[11.5px] font-bold">{count}</Text>
    </View>
  );
}

function EmptyCommentHint() {
  const { t } = useI18n();
  return (
    <View className="items-center py-8">
      <Ionicons name="chatbubble-ellipses-outline" size={26} className="text-base-content/30" />
      <Text className="mt-2 text-[13px] text-base-content/45">{t('common.empty')}</Text>
    </View>
  );
}
