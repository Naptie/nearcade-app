import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, LoadingView, ErrorState, EmptyState } from '@/components/ui';
import { UserAvatar } from '@/components/ShopCard';
import { formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { useMarkAllReadMutation, useNotifications } from '@/hooks/api';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  COMMENTS: 'chatbubble-ellipses',
  REPLIES: 'return-down-forward',
  POST_VOTES: 'arrow-up-circle',
  COMMENT_VOTES: 'thumbs-up',
  JOIN_REQUESTS: 'person-add',
  SHOP_DELETE_REQUESTS: 'trash',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const router = useRouter();
  const query = useNotifications(false);
  const markAll = useMarkAllReadMutation();

  const notifications = query.data?.pages.flatMap((p) => p.notifications) ?? [];

  return (
    <Screen>
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: '900' }}>{t('me.notifications')}</Text>
            <Button
              label={t('notifications.markAllRead')}
              variant="ghost"
              small
              loading={markAll.isPending}
              onPress={() => markAll.mutate()}
            />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => item.postId && router.push(`/post/${item.postId}`)}>
            <Card style={{ marginBottom: 8, opacity: item.readAt ? 0.65 : 1 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <UserAvatar name={item.actorDisplayName ?? item.actorName} image={item.actorImage} size={34} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={TYPE_ICONS[item.type] ?? 'notifications'} size={13} color={colors.accent} />
                    {!item.readAt ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary }} /> : null}
                    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '700' }}>{item.type}</Text>
                  </View>
                  <Text style={{ fontSize: 14, marginTop: 3 }} numberOfLines={3}>
                    {item.content ?? `${item.actorDisplayName || item.actorName} · ${item.postTitle ?? item.shopName ?? ''}`}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {formatRelativeTime(item.createdAt, locale)}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingView />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState message={t('common.empty')} icon={<Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />} />
          )
        }
      />
    </Screen>
  );
}
