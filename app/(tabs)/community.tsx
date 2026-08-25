import React, { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingView,
  Screen,
  SegTabs,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import type { ClubListItem, University } from '@/api/types';
import { useClubs, useUniversitySearch } from '@/hooks/api';

const TABBAR_CLEARANCE = 84;

export default function CommunityScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const [scope, setScope] = useState<'universities' | 'clubs'>('universities');
  const [universityQuery, setUniversityQuery] = useState('');
  const [clubQuery, setClubQuery] = useState('');

  const universities = useUniversitySearch(universityQuery);
  const clubs = useClubs(clubQuery, '');

  return (
    <Screen bottomInset={TABBAR_CLEARANCE}>
      <FlatList
        data={
          (scope === 'universities'
            ? (universities.data ?? [])
            : (clubs.data?.pages.flatMap((p) => p.clubs) ?? [])) as (University | ClubListItem)[]
        }
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
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
          <View className="mb-2 gap-3">
            <Text className="text-2xl font-extrabold tracking-tight text-base-content">{t('tabs.community')}</Text>

            <SegTabs
              value={scope}
              onChange={(v) => setScope(v)}
              options={[
                { value: 'universities', label: t('community.universities') },
                { value: 'clubs', label: t('community.clubs') },
              ]}
            />

            {/* Pill search bar */}
            <View className="h-11 flex-row items-center gap-2.5 rounded-full border border-base-300/60 bg-base-200/70 px-4">
              <Ionicons name="search" size={16} className="text-base-content/45" />
              <TextInput
                value={scope === 'universities' ? universityQuery : clubQuery}
                onChangeText={(text) =>
                  scope === 'universities' ? setUniversityQuery(text) : setClubQuery(text)
                }
                placeholder={scope === 'universities' ? t('community.searchUniversities') : t('community.searchClubs')}
                placeholderTextColor="#8A8A8A"
                autoCorrect={false}
                className="flex-1 py-0 text-[14.5px] text-base-content"
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if ('universityId' in item) {
            const club = item as ClubListItem;
            return (
              <Card className="mb-2.5" onPress={() => router.push(`/club/${club.id}`)}>
                <View className="flex-row items-center gap-3">
                  <Avatar name={club.name} image={club.avatarUrl ?? null} size={42} />
                  <View className="flex-1">
                    <Text className="text-[14.5px] font-bold tracking-tight text-base-content" numberOfLines={1}>
                      {club.name}
                    </Text>
                    <Text className="mt-0.5 text-[12px] font-medium text-base-content/50" numberOfLines={1}>
                      {club.universityName ?? club.universityId}
                    </Text>
                  </View>
                  {(club.membersCount ?? 0) > 0 ? <Badge color="accent">{`${club.membersCount} 👥`}</Badge> : null}
                </View>
              </Card>
            );
          }
          const university = item as University;
          return (
            <Card className="mb-2.5" onPress={() => router.push(`/university/${university.id}`)}>
              <View className="flex-row items-center gap-3">
                <Avatar name={university.name} image={university.avatarUrl ?? null} size={42} />
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="shrink text-[15px] font-bold tracking-tight text-base-content" numberOfLines={1}>
                      {university.name}
                    </Text>
                    {university.is985 ? <Badge color="primary">985</Badge> : null}
                    {university.is211 ? <Badge color="secondary">211</Badge> : null}
                    {university.isDoubleFirstClass ? <Badge color="accent">{t('university.dfc')}</Badge> : null}
                  </View>
                  <Text className="text-[12px] font-medium text-base-content/50" numberOfLines={1}>
                    {[university.campuses?.[0]?.province, university.campuses?.[0]?.city]
                      .filter(Boolean)
                      .join(' · ')}
                    {university.type ? ` · ${university.type}` : ''}
                  </Text>
                </View>
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
            <EmptyState message={t('common.empty')} icon="school-outline" />
          )
        }
      />
    </Screen>
  );
}
