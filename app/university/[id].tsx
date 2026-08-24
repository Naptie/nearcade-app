import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, LoadingView, ErrorState, Segmented, ListFooter } from '@/components/ui';
import { MarkdownView } from '@/components/MarkdownView';
import { formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { useUniversity, useUniversityClubs, useUniversityPosts } from '@/hooks/api';

export default function UniversityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<'clubs' | 'posts'>('posts');

  const universityQuery = useUniversity(id);
  const clubsQuery = useUniversityClubs(id);
  const postsQuery = useUniversityPosts(id);

  const posts = useMemo(() => postsQuery.data?.pages.flatMap((p) => p.posts) ?? [], [postsQuery.data]);
  const clubs = useMemo(() => clubsQuery.data?.pages.flatMap((p) => p.clubs) ?? [], [clubsQuery.data]);

  if (universityQuery.isLoading) return <LoadingView />;
  if (universityQuery.isError) return <ErrorState error={universityQuery.error} onRetry={() => void universityQuery.refetch()} />;

  const university = universityQuery.data!;
  const firstCampus = university.campuses?.[0];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 20, fontWeight: '900', flexShrink: 1 }}>{university.name}</Text>
            {university.is985 ? <Badge text={t('university.is985')} color="#E23A78" /> : null}
            {university.is211 ? <Badge text={t('university.is211')} color="#7C5CE0" /> : null}
            {university.isDoubleFirstClass ? <Badge text={t('university.dfc')} color="#0AA2C0" /> : null}
          </View>
          <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
            {[firstCampus?.province, firstCampus?.city].filter(Boolean).join(' · ')}
            {university.affiliation ? ` · ${university.affiliation}` : ''}
          </Text>
          {(university.studentsCount ?? 0) > 0 || (university.clubsCount ?? 0) > 0 ? (
            <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
              {university.studentsCount != null && university.studentsCount > 0
                ? `${university.studentsCount.toLocaleString()} students`
                : ''}
              {university.clubsCount ? `${university.clubsCount} ${t('common.clubs')}` : ''}
            </Text>
          ) : null}
        </Card>

        <View style={{ marginTop: 14 }}>
          <Segmented
            value={tab}
            onChange={(v) => setTab(v as 'clubs' | 'posts')}
            options={[
              { value: 'posts', label: t('university.posts') },
              { value: 'clubs', label: t('community.clubs') },
            ]}
          />
        </View>

        {tab === 'posts' ? (
          <View style={{ marginTop: 14, gap: 10 }}>
            {postsQuery.isLoading ? <LoadingView /> : null}
            {posts.map((post) => (
              <Card key={post.id} onPress={() => router.push(`/post/${post.id}`)}>
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {post.isPinned ? (
                      <Ionicons name="pin" size={13} color={colors.primary} />
                    ) : null}
                    <Text style={{ fontWeight: '800', fontSize: 15, flexShrink: 1 }} numberOfLines={2}>
                      {post.title}
                    </Text>
                  </View>
                  {post.content ? (
                    <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={2}>
                      {post.content.replace(/[#*`>\[\]!\-]/g, '').slice(0, 140)}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 }}>
                    <Meta icon="chatbubble-outline" value={post.commentCount} />
                    <Meta icon="arrow-up-outline" value={post.upvotes} />
                    <Text style={{ fontSize: 11.5, color: colors.textMuted }}>
                      {formatRelativeTime(post.createdAt, locale)}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
            <ListFooter hasMore={Boolean(postsQuery.hasNextPage)} loading={postsQuery.isFetchingNextPage} onMore={() => void postsQuery.fetchNextPage()} />
          </View>
        ) : (
          <View style={{ marginTop: 14, gap: 10 }}>
            {clubsQuery.isLoading ? <LoadingView /> : null}
            {!clubsQuery.isLoading && clubs.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>—</Text>
            ) : null}
            {clubs.map((club) => (
              <Card key={club.id} onPress={() => router.push(`/club/${club.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                    {club.name}
                  </Text>
                  {club.membersCount != null ? (
                    <Text style={{ fontSize: 12.5, color: colors.accent, fontWeight: '700' }}>{club.membersCount}</Text>
                  ) : null}
                </View>
                {club.description ? (
                  <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 4 }} numberOfLines={2}>
                    {club.description}
                  </Text>
                ) : null}
              </Card>
            ))}
            <ListFooter hasMore={Boolean(clubsQuery.hasNextPage)} loading={clubsQuery.isFetchingNextPage} onMore={() => void clubsQuery.fetchNextPage()} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ backgroundColor: `${color}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color }}>{text}</Text>
    </View>
  );
}

function Meta({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={{ fontSize: 12, color: colors.textMuted }}>{value}</Text>
    </View>
  );
}
