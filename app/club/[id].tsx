import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingView,
  Meta,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { PostRow } from '@/components/PostRow';
import { ShopMiniCard } from '@/components/ShopCard';
import { MarkdownView } from '@/components/MarkdownView';
import { useI18n } from '@/i18n';
import { formatRelativeTime } from '@/utils/format';
import { useClub, useClubArcades, useClubPosts } from '@/hooks/api';

export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();

  const clubQuery = useClub(id);
  const arcadesQuery = useClubArcades(id);
  const postsQuery = useClubPosts(id);

  if (clubQuery.isLoading) return <LoadingView />;
  if (clubQuery.isError) return <ErrorState error={clubQuery.error} onRetry={() => void clubQuery.refetch()} />;

  const { club, university } = clubQuery.data!;
  const posts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];
  const arcades = arcadesQuery.data ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Card className="gap-2.5 p-5">
          <View className="flex-row items-center gap-3">
            <Avatar name={club.name} image={club.avatarUrl ?? null} size={52} />
            <View className="flex-1">
              <Text className="text-[19px] font-extrabold tracking-tight text-base-content">{club.name}</Text>
              <View className="mt-1 flex-row flex-wrap items-center gap-2">
                {university ? (
                  <Badge color="secondary" className="flex-row items-center gap-1">
                    <Ionicons name="school" size={10} /> {university.name}
                  </Badge>
                ) : null}
                <Meta icon="people" value={`${club.membersCount ?? 0} ${t('common.members')}`} />
              </View>
            </View>
          </View>
          {club.description ? <MarkdownView source={club.description} /> : null}
        </Card>

        {/* Starred arcades rail */}
        {arcades.length > 0 ? (
          <View className="mt-4">
            <SectionTitle title={t('club.starredArcades')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {arcades.map((shop) => (
                <ShopMiniCard key={shop.id} shop={shop} onPress={() => router.push(`/shop/${shop.id}`)} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Posts */}
        <View className="mt-4">
          <SectionTitle title={t('university.posts')} />
          {postsQuery.isLoading ? <LoadingView /> : null}
          {!postsQuery.isLoading && posts.length === 0 ? (
            <EmptyState message={t('common.empty')} icon="newspaper-outline" />
          ) : null}
          <View className="gap-2.5">
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                timeText={formatRelativeTime(post.createdAt, locale)}
                onPress={() => router.push(`/post/${post.id}`)}
              />
            ))}
          </View>
          <ListFooter
            hasMore={Boolean(postsQuery.hasNextPage)}
            loading={postsQuery.isFetchingNextPage}
            onMore={() => void postsQuery.fetchNextPage()}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
