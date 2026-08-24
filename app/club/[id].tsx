import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, LoadingView, ErrorState, SectionHeader } from '@/components/ui';
import { MarkdownView } from '@/components/MarkdownView';
import { ShopCard } from '@/components/ShopCard';
import { formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { useClub, useClubArcades, useClubPosts, useGameTitles } from '@/hooks/api';

export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useI18n();

  const clubQuery = useClub(id);
  const arcadesQuery = useClubArcades(id);
  const postsQuery = useClubPosts(id);
  const titlesQuery = useGameTitles();

  const namesByTitleId = useMemo(() => {
    const map = new Map<number, string>();
    for (const title of titlesQuery.data?.titles ?? []) map.set(title.id, title.name);
    return map;
  }, [titlesQuery.data]);

  if (clubQuery.isLoading) return <LoadingView />;
  if (clubQuery.isError) return <ErrorState error={clubQuery.error} onRetry={() => void clubQuery.refetch()} />;

  const { club, university } = clubQuery.data!;
  const posts = postsQuery.data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card style={{ gap: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '900' }}>{club.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {university ? (
              <Card
                style={{ paddingVertical: 4, paddingHorizontal: 10 }}
                onPress={() => router.push(`/university/${university.id}`)}
              >
                <Text style={{ fontSize: 12.5, color: colors.accent, fontWeight: '700' }}>{university.name}</Text>
              </Card>
            ) : null}
            <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
              {(club.membersCount ?? 0)} {t('common.members')}
            </Text>
          </View>
          {club.description ? (
            <MarkdownView source={club.description} />
          ) : null}
        </Card>

        {/* Starred arcades */}
        {(arcadesQuery.data ?? []).length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <SectionHeader title={t('club.starredArcades')} />
            {(arcadesQuery.data ?? []).map((shop) => (
              <View key={shop.id} style={{ marginBottom: 8 }}>
                <ShopCard shop={{ ...shop, distance: 0 }} namesByTitleId={namesByTitleId} onPress={() => router.push(`/shop/${shop.id}`)} />
              </View>
            ))}
          </View>
        ) : null}

        {/* Posts */}
        <View style={{ marginTop: 16 }}>
          <SectionHeader title={t('university.posts')} />
          {postsQuery.isLoading ? <LoadingView /> : null}
          {!postsQuery.isLoading && posts.length === 0 ? (
            <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>—</Text>
          ) : null}
          <View style={{ gap: 10 }}>
            {posts.map((post) => (
              <Card key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {post.isPinned ? <Ionicons name="pin" size={13} color={colors.primary} /> : null}
                    <Text style={{ fontWeight: '800', fontSize: 15, flexShrink: 1 }} numberOfLines={2}>
                      {post.title}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{post.commentCount}</Text>
                    <Ionicons name="arrow-up-outline" size={13} color={colors.textMuted} />
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{post.upvotes}</Text>
                    <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{formatRelativeTime(post.createdAt, locale)}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
          <View style={{ marginTop: 10 }}>
            {postsQuery.hasNextPage ? (
              <Card onPress={() => void postsQuery.fetchNextPage()} style={{ alignItems: 'center', paddingVertical: 10 }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13.5 }}>{t('common.more')}</Text>
              </Card>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
