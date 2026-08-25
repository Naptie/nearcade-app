import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  SegTabs,
} from '@/components/ui';
import { PostRow } from '@/components/PostRow';
import { useI18n } from '@/i18n';
import { formatRelativeTime } from '@/utils/format';
import { useUniversity, useUniversityClubs, useUniversityPosts } from '@/hooks/api';

export default function UniversityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<'posts' | 'clubs'>('posts');

  const universityQuery = useUniversity(id);
  const clubsQuery = useUniversityClubs(id);
  const postsQuery = useUniversityPosts(id);

  const posts = useMemo(() => postsQuery.data?.pages.flatMap((p) => p.posts) ?? [], [postsQuery.data]);
  const clubs = useMemo(() => clubsQuery.data?.pages.flatMap((p) => p.clubs) ?? [], [clubsQuery.data]);

  if (universityQuery.isLoading) return <LoadingView />;
  if (universityQuery.isError)
    return <ErrorState error={universityQuery.error} onRetry={() => void universityQuery.refetch()} />;

  const university = universityQuery.data!;
  const firstCampus = university.campuses?.[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Header — mirrors the site's profile section block */}
        <Card className="gap-2 p-5">
          <View className="flex-row items-center gap-3">
            <Avatar name={university.name} image={university.avatarUrl ?? null} size={52} />
            <View className="flex-1">
              <Text className="text-[19px] font-extrabold tracking-tight text-base-content">{university.name}</Text>
              <Text className="mt-0.5 text-[12px] font-medium text-base-content/50" numberOfLines={1}>
                {[firstCampus?.province, firstCampus?.city].filter(Boolean).join(' · ')}
                {university.affiliation ? ` · ${university.affiliation}` : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            {university.is985 ? <Badge color="primary">{t('university.is985')}</Badge> : null}
            {university.is211 ? <Badge color="secondary">{t('university.is211')}</Badge> : null}
            {university.isDoubleFirstClass ? <Badge color="accent">{t('university.dfc')}</Badge> : null}
            {(university.studentsCount ?? 0) > 0 ? (
              <Meta icon="people" value={`${university.studentsCount?.toLocaleString()} students`} />
            ) : null}
            {(university.clubsCount ?? 0) > 0 ? (
              <Meta icon="chatbubbles" value={`${university.clubsCount} ${t('common.clubs')}`} />
            ) : null}
          </View>
        </Card>

        <SegTabs
          className="mt-4"
          value={tab}
          onChange={(v) => setTab(v)}
          options={[
            { value: 'posts', label: t('university.posts') },
            { value: 'clubs', label: t('community.clubs') },
          ]}
        />

        {tab === 'posts' ? (
          <View className="mt-3.5 gap-2.5">
            {postsQuery.isLoading ? <LoadingView /> : null}
            {!postsQuery.isLoading && posts.length === 0 ? (
              <EmptyState message={t('common.empty')} icon="newspaper-outline" />
            ) : null}
            {posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                timeText={formatRelativeTime(post.createdAt, locale)}
                onPress={() => router.push(`/post/${post.id}`)}
              />
            ))}
            <ListFooter
              hasMore={Boolean(postsQuery.hasNextPage)}
              loading={postsQuery.isFetchingNextPage}
              onMore={() => void postsQuery.fetchNextPage()}
            />
          </View>
        ) : (
          <View className="mt-3.5 gap-2.5">
            {clubsQuery.isLoading ? <LoadingView /> : null}
            {!clubsQuery.isLoading && clubs.length === 0 ? (
              <EmptyState message={t('common.empty')} icon="people-outline" />
            ) : null}
            {clubs.map((club) => (
              <Card key={club.id} onPress={() => router.push(`/club/${club.id}`)}>
                <View className="flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-1">
                    <Text className="text-[14.5px] font-bold tracking-tight text-base-content" numberOfLines={1}>
                      {club.name}
                    </Text>
                    {club.description ? (
                      <Text className="mt-0.5 text-[12px] font-medium text-base-content/50" numberOfLines={2}>
                        {club.description.replace(/[#*`>\[\]!\-]/g, '')}
                      </Text>
                    ) : null}
                  </View>
                  {(club.membersCount ?? 0) > 0 ? <Badge color="accent">{`${club.membersCount} 👥`}</Badge> : null}
                </View>
              </Card>
            ))}
            <ListFooter
              hasMore={Boolean(clubsQuery.hasNextPage)}
              loading={clubsQuery.isFetchingNextPage}
              onMore={() => void clubsQuery.fetchNextPage()}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
