import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Chip, Segmented, LoadingView, ErrorState, EmptyState, ListFooter, Button } from '@/components/ui';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { useCampusRankings, useGameTitles, useRegionRankings } from '@/hooks/api';
import { rankingSortOptions } from '@/utils/gameTitles';
import { formatCompact, formatRelativeTime } from '@/utils/format';

const CAMPUS_RADII = [2, 5, 10, 30];
const REGION_LEVELS = ['country', 'province', 'city', 'county'];

export default function RankingsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();

  const [scope, setScope] = useState<'campus' | 'region'>('campus');
  const [campusRadius, setCampusRadius] = useState(10);
  const [regionLevel, setRegionLevel] = useState('country');
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('shops');

  const titlesQuery = useGameTitles();
  const sortOptions = useMemo(() => rankingSortOptions(titlesQuery.data?.titles), [titlesQuery.data]);

  const campus = useCampusRankings(sortBy, campusRadius);
  const region = useRegionRankings(sortBy, regionLevel);

  const query = scope === 'campus' ? campus : region;
  const items = useMemo(() => {
    const pages = (query.data?.pages ?? []) as unknown as {
      data: Record<string, unknown>[];
      cacheTime: string;
    }[];
    return pages.flatMap((p) => p.data);
  }, [query.data]);
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const cacheTime = query.data?.pages[0]?.cacheTime;

  const sortOption = sortOptions.find((o) => o.value === sortBy);
  const sortLabel = sortOption?.title ?? t(`sort.${sortBy}`);

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '900' }}>{t('tabs.rankings')}</Text>
            <Segmented
              value={scope}
              onChange={(v) => setScope(v as 'campus' | 'region')}
              options={[
                { value: 'campus', label: t('rankings.campus') },
                { value: 'region', label: t('rankings.region') },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {scope === 'campus'
                ? CAMPUS_RADII.map((r) => (
                    <Chip key={r} label={`${r} km`} active={campusRadius === r} onPress={() => setCampusRadius(r)} />
                  ))
                : REGION_LEVELS.map((lvl) => (
                    <Chip key={lvl} label={t(`level.${lvl}`)} active={regionLevel === lvl} onPress={() => setRegionLevel(lvl)} />
                  ))}
            </View>
            {/* Sort picker */}
            <Card
              style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => setSortPickerOpen(true)}
            >
              <Text style={{ fontSize: 13.5, color: colors.textMuted }}>{t('rankings.sortBy')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '700' }}>{sortLabel}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </View>
            </Card>
            <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
              {t('rankings.total', { count: formatCompact(totalCount) })}
              {cacheTime ? ` · ${formatRelativeTime(cacheTime, locale)}` : ''}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          if (scope === 'campus') return <CampusRow rank={index + 1} item={item as never} radius={campusRadius} />;
          return <RegionRow rank={index + 1} item={item as never} />;
        }}
        ListFooterComponent={<ListFooter hasMore={Boolean(query.hasNextPage)} loading={query.isFetchingNextPage} />}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingView />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState message={t('common.empty')} icon={<Ionicons name="podium-outline" size={40} color={colors.textMuted} />} />
          )
        }
      />

      {/* Sort sheet */}
      {sortPickerOpen ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: '#00000088',
            justifyContent: 'flex-end',
          }}
        >
          <Card style={{ borderRadius: 0, maxHeight: 480 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 10 }}>{t('rankings.sortBy')}</Text>
            <FlatList
              data={sortOptions}
              keyExtractor={(opt) => opt.value}
              renderItem={({ item }) => (
                <Chip
                  label={item.title ?? t(`sort.${item.value}`)}
                  active={sortBy === item.value}
                  color={colors.primary}
                  onPress={() => {
                    setSortBy(item.value);
                    setSortPickerOpen(false);
                  }}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              style={{ marginBottom: 24 }}
            />
            <Button label={t('common.close')} variant="ghost" onPress={() => setSortPickerOpen(false)} />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return '#F5C542';
  if (rank === 2) return '#A8B4C4';
  if (rank === 3) return '#CD7F32';
  return '#666F88';
}

function RankBadge({ rank }: { rank: number }) {
  const color = rankColor(rank);
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: `${color}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontWeight: '900', fontSize: 13 }}>{rank}</Text>
    </View>
  );
}

function CampusRow({ rank, item, radius }: { rank: number; item: import('@/api/types').CampusRankingItem; radius: number }) {
  const metric = item.rankings.find((r) => r.radius === radius) ?? item.rankings[0] ?? null;
  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <RankBadge rank={rank} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontWeight: '800', fontSize: 15, flexShrink: 1 }} numberOfLines={1}>
              {item.fullName}
            </Text>
            {item.is985 ? <MiniTag text="985" /> : null}
            {item.is211 ? <MiniTag text="211" /> : null}
            {item.isDoubleFirstClass ? <MiniTag text="双一流" /> : null}
          </View>
          <Text style={{ fontSize: 12, color: '#9BA3BC' }}>
            {[item.province, item.city].filter(Boolean).join(' · ')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
            <Metric label={metric?.shopCount != null ? String(metric.shopCount) : '—'} sub="shops" />
            <Metric label={metric?.totalMachines != null ? String(metric.totalMachines) : '—'} sub="machines" />
            <Metric label={metric?.areaDensity != null ? metric.areaDensity.toFixed(2) : '—'} sub="/km²" />
          </View>
        </View>
      </View>
    </Card>
  );
}

function RegionRow({ rank, item }: { rank: number; item: import('@/api/types').RegionRankingItem }) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <RankBadge rank={rank} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontWeight: '800', fontSize: 15 }} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
            <Metric label={String(item.shopCount)} sub="shops" />
            <Metric label={formatCompact(item.totalMachines)} sub="machines" />
            <Metric label={item.areaDensity != null ? item.areaDensity.toFixed(2) : '—'} sub="/km²" />
          </View>
        </View>
      </View>
    </Card>
  );
}

function MiniTag({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: '#E23A7822', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#E23A78' }}>{text}</Text>
    </View>
  );
}

function Metric({ label, sub }: { label: string; sub: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontWeight: '800', fontSize: 15 }}>{label}</Text>
      <Text style={{ fontSize: 10, color: '#9BA3BC' }}>{sub}</Text>
    </View>
  );
}
