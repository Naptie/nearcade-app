import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Segmented, LoadingView, ErrorState, EmptyState, ListFooter } from '@/components/ui';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { useClubs, useUniversitySearch } from '@/hooks/api';

export default function CommunityScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [scope, setScope] = useState<'universities' | 'clubs'>('universities');
  const [universityQuery, setUniversityQuery] = useState('');
  const [clubQuery, setClubQuery] = useState('');
  const [clubUniversityFilter, setClubUniversityFilter] = useState('');

  const universities = useUniversitySearch(universityQuery);
  const clubs = useClubs(clubUniversityFilter ? '' : clubQuery, clubUniversityFilter);

  // University filter options come embedded in the clubs list response.
  const universityOptions = useMemo(() => clubs.data?.pages[0]?.universities ?? [], [clubs.data]);

  return (
    <Screen>
      <FlatList
        data={
          (scope === 'universities' ? (universities.data ?? []) : (clubs.data?.pages.flatMap((p) => p.clubs) ?? [])) as (
            import('@/api/types').University | import('@/api/types').ClubListItem
          )[]
        }
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        onEndReached={
          scope === 'clubs'
            ? () => {
                if (clubs.hasNextPage && !clubs.isFetchingNextPage) void clubs.fetchNextPage();
              }
            : undefined
        }
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '900' }}>{t('tabs.community')}</Text>
            <Segmented
              value={scope}
              onChange={(v) => setScope(v as 'universities' | 'clubs')}
              options={[
                { value: 'universities', label: t('community.universities') },
                { value: 'clubs', label: t('community.clubs') },
              ]}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={{ flex: 1, color: colors.text, fontSize: 15 }}
                placeholder={scope === 'universities' ? t('community.searchUniversities') : t('community.searchClubs')}
                placeholderTextColor={colors.textMuted}
                value={scope === 'universities' ? universityQuery : clubQuery}
                onChangeText={(text) =>
                  scope === 'universities' ? setUniversityQuery(text) : setClubQuery(text)
                }
                autoCorrect={false}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if ('universityId' in item) {
            const club = item as import('@/api/types').ClubListItem;
            return (
              <Card
                style={{ marginBottom: 10 }}
                onPress={() => router.push(`/club/${club.id}`)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: `${colors.primary}22`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="people-circle" size={26} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
                      {club.name}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: colors.textMuted }} numberOfLines={1}>
                      {club.universityName ?? club.universityId}
                    </Text>
                  </View>
                  {(club.membersCount ?? 0) > 0 ? (
                    <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '700' }}>{club.membersCount}</Text>
                  ) : null}
                </View>
              </Card>
            );
          }
          const university = item as import('@/api/types').University;
          return (
            <Card style={{ marginBottom: 10 }} onPress={() => router.push(`/university/${university.id}`)}>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontWeight: '800', fontSize: 15.5, flexShrink: 1 }} numberOfLines={1}>
                    {university.name}
                  </Text>
                  {university.is985 ? <TagChip text="985" /> : null}
                  {university.is211 ? <TagChip text="211" /> : null}
                  {university.isDoubleFirstClass ? <TagChip text="双一流" /> : null}
                </View>
                <Text style={{ fontSize: 12.5, color: colors.textMuted }} numberOfLines={1}>
                  {[university.campuses?.[0]?.province, university.campuses?.[0]?.city].filter(Boolean).join(' · ')}
                  {university.type ? ` · ${university.type}` : ''}
                </Text>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          scope === 'universities' && universities.isFetching ? (
            <LoadingView />
          ) : universities.isError || clubs.isError ? (
            <ErrorState error={universities.error ?? clubs.error} onRetry={() => void universities.refetch()} />
          ) : (
            <EmptyState message={t('common.empty')} icon={<Ionicons name="school-outline" size={40} color={colors.textMuted} />} />
          )
        }
      />
    </Screen>
  );
}

function TagChip({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: `${colors.primary}20`, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>{text}</Text>
    </View>
  );
}
