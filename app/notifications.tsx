import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingView,
  Screen,
} from '@/components/ui';
import { useThemePalette } from '@/theme/palette';
import { useI18n } from '@/i18n';
import { formatRelativeTime } from '@/utils/format';
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
  const { t, locale } = useI18n();
  const palette = useThemePalette();
  const router = useRouter();
  const query = useNotifications(false);
  const markAll = useMarkAllReadMutation();

  const notifications = query.data?.pages.flatMap((p) => p.notifications) ?? [];

  return (
    <Screen topInset={false}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: palette.primary,
          headerStyle: { backgroundColor: palette.background },
          headerTitle: t('me.notifications'),
          headerRight: () => (
            <Pressable hitSlop={8} onPress={() => markAll.mutate()} disabled={markAll.isPending}>
              <Text className="text-[13px] font-bold text-primary">
                {markAll.isPending ? '…' : t('notifications.markAllRead')}
              </Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <Pressable onPress={() => item.postId && router.push(`/post/${item.postId}`)}>
            <Card
              padding={false}
              className={`mb-2 flex-row items-start gap-2.5 p-3.5 ${
                item.readAt ? '' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <Avatar name={item.actorDisplayName ?? item.actorName} image={item.actorImage} size={34} />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name={TYPE_ICONS[item.type] ?? 'notifications'} size={12} className="text-accent" />
                  {!item.readAt ? <View className="h-2 w-2 rounded-full bg-primary" /> : null}
                  <Text className="text-[10.5px] font-bold uppercase tracking-wide text-base-content/45">{item.type}</Text>
                  <View className="flex-1" />
                  <Text className="text-[10.5px] text-base-content/45">{formatRelativeTime(item.createdAt, locale)}</Text>
                </View>
                <Text className="mt-1 text-[13.5px] leading-[19px] text-base-content/85" numberOfLines={3}>
                  {item.content ?? `${item.actorDisplayName || item.actorName} · ${item.postTitle ?? item.shopName ?? ''}`}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
        ListFooterComponent={
          <ListFooter
            hasMore={Boolean(query.hasNextPage)}
            loading={query.isFetchingNextPage}
            onMore={() => void query.fetchNextPage()}
          />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingView />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState message={t('common.empty')} icon="notifications-off-outline" />
          )
        }
      />
    </Screen>
  );
}
