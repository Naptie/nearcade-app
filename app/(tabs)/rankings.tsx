import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge,
  Btn,
  Chip,
  EmptyState,
  ErrorState,
  ListFooter,
  LoadingView,
  Screen,
  SegTabs,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { formatCompact, formatRelativeTime } from '@/utils/format';
import type { CampusRankingItem, RegionRankingItem } from '@/api/types';
import { useCampusRankings, useGameTitles, useRegionRankings } from '@/hooks/api';
import { rankingSortOptions } from '@/utils/gameTitles';

const CAMPUS_RADII = [2, 5, 10, 30];
const REGION_LEVELS = ['country', 'province', 'city', 'county'];
const TABBAR_CLEARANCE = 84;

/* Gold/silver/bronze rank tints readable on both emerald and forest. */
const RANK_STYLES = [
  'bg-[#F5C542]/20 text-[#B8920F]',
  'bg-base-content/15 text-base-content/70',
  'bg-[#CD7F32]/20 text-[#A9641F]',
];

export default function RankingsScreen() {
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
  const items = useMemo(
    () =>
      ((query.data?.pages ?? []) as unknown as {
        data: (CampusRankingItem | RegionRankingItem)[];
      }[]).flatMap((p) => p.data),
    [query.data]
  );
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const cacheTime = query.data?.pages[0]?.cacheTime;

  const sortOption = sortOptions.find((o) => o.value === sortBy);
  const sortLabel = sortOption?.title ?? t(`sort.${sortBy}`);

  return (
    <Screen bottomInset={TABBAR_CLEARANCE}>
      <FlatList<CampusRankingItem | RegionRankingItem>
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View className="mb-2 gap-3">
            <Text className="text-2xl font-extrabold tracking-tight text-base-content">{t('tabs.rankings')}</Text>

            <SegTabs
              value={scope}
              onChange={(v) => setScope(v)}
              options={[
                { value: 'campus', label: t('rankings.campus') },
                { value: 'region', label: t('rankings.region') },
              ]}
            />

            <View className="flex-row flex-wrap gap-2">
              {scope === 'campus'
                ? CAMPUS_RADII.map((r) => (
                    <Chip key={r} label={`${r} km`} active={campusRadius === r} onPress={() => setCampusRadius(r)} />
                  ))
                : REGION_LEVELS.map((lvl) => (
                    <Chip
                      key={lvl}
                      label={t(`level.${lvl}`)}
                      active={regionLevel === lvl}
                      onPress={() => setRegionLevel(lvl)}
                    />
                  ))}
            </View>

            {/* Sort picker trigger */}
            <Btn
              label={`${t('rankings.sortBy')} · ${sortLabel}`}
              variant="soft"
              size="sm"
              icon="swap-vertical"
              className="self-start"
              onPress={() => setSortPickerOpen(true)}
            />

            <Text className="text-[12px] font-medium text-base-content/50">
              {t('rankings.total', { count: formatCompact(totalCount) })}
              {cacheTime ? ` · ${formatRelativeTime(cacheTime, locale)}` : ''}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          if (scope === 'campus')
            return <CampusRow rank={index + 1} item={item as CampusRankingItem} radius={campusRadius} sortBy={sortBy} />;
          return <RegionRow rank={index + 1} item={item as RegionRankingItem} sortBy={sortBy} />;
        }}
        ListFooterComponent={<ListFooter hasMore={Boolean(query.hasNextPage)} loading={query.isFetchingNextPage} />}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingView />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyState message={t('common.empty')} icon="podium-outline" />
          )
        }
      />

      {/* Sort sheet */}
      <Modal visible={sortPickerOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSortPickerOpen(false)}>
        <Screen topInset={false}>
          <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
            <Text className="text-xl font-extrabold tracking-tight text-base-content">{t('rankings.sortBy')}</Text>
            <Pressable
              hitSlop={8}
              onPress={() => setSortPickerOpen(false)}
              className="h-9 w-9 items-center justify-center rounded-full bg-base-200 active:bg-base-300/60"
            >
              <Ionicons name="close" size={18} className="text-base-content/60" />
            </Pressable>
          </View>
          <FlatList
            data={sortOptions}
            keyExtractor={(opt) => opt.value}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const active = sortBy === item.value;
              return (
                <Pressable
                  onPress={() => {
                    setSortBy(item.value);
                    setSortPickerOpen(false);
                  }}
                  className={`flex-row items-center gap-3 rounded-xl border-2 px-3.5 py-3 ${
                    active ? 'border-primary/50 bg-primary/10' : 'border-transparent active:bg-base-content/5'
                  }`}
                >
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={17} className={active ? 'text-primary' : 'text-base-content/35'} />
                  <Text className={`flex-1 text-[14px] font-semibold ${active ? 'text-primary' : 'text-base-content'}`}>
                    {item.title ?? t(`sort.${item.value}`)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </Screen>
      </Modal>
    </Screen>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styleCls = RANK_STYLES[rank - 1] ?? 'bg-base-content/10 text-base-content/55';
  return (
    <View className={`h-9 w-9 items-center justify-center rounded-xl ${styleCls}`}>
      <Text className="text-[13px] font-extrabold">{rank}</Text>
    </View>
  );
}

function MetricCell({ label, sub, highlight }: { label: string; sub: string; highlight?: boolean }) {
  void highlight;
  return (
    <View className="items-center">
      <Text className="text-[14px] font-extrabold text-base-content">{label}</Text>
      <Text className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-base-content/45">{sub}</Text>
    </View>
  );
}

function CampusRow({
  rank,
  item,
  radius,
  sortBy,
}: {
  rank: number;
  item: CampusRankingItem;
  radius: number;
  sortBy: string;
}) {
  const metric = item.rankings.find((r) => r.radius === radius) ?? item.rankings[0] ?? null;
  const gameMetric =
    metric?.gameSpecificMachines?.find((g) => g.name.toLowerCase() === sortBy.toLowerCase()) ?? null;

  return (
    <View className="mb-2.5 rounded-2xl border-2 border-base-300/40 bg-base-200/60 p-3.5">
      <View className="flex-row gap-3">
        <RankBadge rank={rank} />
        <View className="flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className="shrink text-[14.5px] font-bold tracking-tight text-base-content" numberOfLines={1}>
              {item.fullName}
            </Text>
            {item.is985 ? <Badge color="primary">985</Badge> : null}
            {item.is211 ? <Badge color="secondary">211</Badge> : null}
            {item.isDoubleFirstClass ? <Badge color="accent">双一流</Badge> : null}
          </View>
          <Text className="text-[11.5px] font-medium text-base-content/50">
            {[item.province, item.city].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
      <View className="mt-2.5 flex-row justify-around border-t border-base-content/10 pt-2.5">
        <MetricCell label={metric ? String(metric.shopCount) : '—'} sub="shops" />
        <MetricCell label={metric ? String(metric.totalMachines) : '—'} sub="machines" />
        <MetricCell label={metric?.areaDensity != null ? metric.areaDensity.toFixed(2) : '—'} sub="/km²" />
        {gameMetric ? <MetricCell label={String(gameMetric.quantity)} sub={gameMetric.name} /> : null}
      </View>
    </View>
  );
}

function RegionRow({ rank, item, sortBy }: { rank: number; item: RegionRankingItem; sortBy: string }) {
  void sortBy;
  return (
    <View className="mb-2.5 rounded-2xl border-2 border-base-300/40 bg-base-200/60 p-3.5">
      <View className="flex-row items-center gap-3">
        <RankBadge rank={rank} />
        <View className="flex-1">
          <Text className="text-[14.5px] font-bold tracking-tight text-base-content" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="mt-0.5 text-[11.5px] font-medium text-base-content/50">
            {[item.country, item.province, item.city].filter(Boolean).slice(0, 2).join(' · ')}
          </Text>
        </View>
      </View>
      <View className="mt-2.5 flex-row justify-around border-t border-base-content/10 pt-2.5">
        <MetricCell label={String(item.shopCount)} sub="shops" />
        <MetricCell label={formatCompact(item.totalMachines)} sub="machines" />
        <MetricCell label={item.areaDensity != null ? item.areaDensity.toFixed(2) : '—'} sub="/km²" />
        {item.machinesPerCapita != null ? (
          <MetricCell label={item.machinesPerCapita.toPrecision(3)} sub="per capita" />
        ) : null}
      </View>
    </View>
  );
}
