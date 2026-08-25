import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Avatar,
  Badge,
  Btn,
  Card,
  ErrorState,
  IconButton,
  ListRow,
  LoadingView,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { ShopCard, ShopMiniCard } from '@/components/ShopCard';
import { useI18n } from '@/i18n';
import type { UserType } from '@/api/types';
import { useGameTitles, useMe, useUnreadCount } from '@/hooks/api';
import { useSession } from '@/stores/session';

const USER_TYPE_LABELS: Record<UserType, string> = {
  site_admin: 'Admin',
  developer: 'Developer',
  school_admin: 'School admin',
  club_admin: 'Club admin',
  school_moderator: 'School mod',
  club_moderator: 'Club mod',
  student: 'Student',
  regular: 'Member',
};

const TABBAR_CLEARANCE = 84;

export default function MeScreen() {
  const { t } = useI18n();
  const router = useRouter();

  const authed = useSession((s) => Boolean(s.cookie?.includes('session_token=')));
  const logout = useSession((s) => s.logout);
  const meQuery = useMe();
  const unread = useUnreadCount();
  const titlesQuery = useGameTitles();

  const namesByTitleId = useMemo(() => {
    const map = new Map<number, string>();
    for (const title of titlesQuery.data?.titles ?? []) map.set(title.id, title.name);
    return map;
  }, [titlesQuery.data]);

  if (!authed) {
    return (
      <Screen bottomInset={TABBAR_CLEARANCE}>
        <View className="flex-1 items-center justify-center gap-5 px-10">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-base-200">
            <Ionicons name="person" size={44} className="text-base-content/35" />
          </View>
          <Text className="text-xl font-extrabold tracking-tight text-base-content">{t('me.notSignedIn')}</Text>
          <Text className="text-center text-[13.5px] leading-5 text-base-content/55">{t('me.signInHint')}</Text>
          <Btn label={t('me.signIn')} icon="qr-code" onPress={() => router.push('/login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bottomInset={TABBAR_CLEARANCE}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View className="mb-4 flex-row items-end justify-between">
          <View>
            <Text className="text-2xl font-extrabold tracking-tight text-base-content">{t('tabs.me')}</Text>
            <Text className="mt-0.5 text-[12px] font-medium text-base-content/50">nearcade</Text>
          </View>
          <View className="flex-row gap-2">
            <ListHeaderIconButton
              name="notifications"
              badge={unread.data ?? 0}
              onPress={() => router.push('/notifications')}
            />
            <ListHeaderIconButton name="settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        {meQuery.isLoading ? <LoadingView /> : null}
        {meQuery.isError ? <ErrorState error={meQuery.error} onRetry={() => void meQuery.refetch()} /> : null}

        {meQuery.data ? (
          <>
            {/* Profile block — mirrors the site's bg-base-200 rounded-xl p-6 sections */}
            <Card className="mb-3.5 p-5">
              <View className="flex-row items-center gap-3">
                <Avatar
                  name={meQuery.data.user.displayName ?? meQuery.data.user.name}
                  image={meQuery.data.user.image}
                  size={56}
                />
                <View className="flex-1">
                  <Text className="text-[17px] font-extrabold tracking-tight text-base-content" numberOfLines={1}>
                    {meQuery.data.user.displayName || meQuery.data.user.name}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text className="text-[12.5px] font-medium text-base-content/50">@{meQuery.data.user.name}</Text>
                    {meQuery.data.user.userType ? (
                      <Badge color="accent">{USER_TYPE_LABELS[meQuery.data.user.userType] ?? meQuery.data.user.userType}</Badge>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Stats row */}
              <View className="mt-4 flex-row justify-around border-t border-base-content/10 pt-3.5">
                <Stat value={meQuery.data.frequentingArcadesCount} label={t('me.frequenting')} />
                <Stat value={meQuery.data.starredArcadesCount} label={t('me.starred')} />
                <Stat value={meQuery.data.universityMembershipCount} label={t('community.universities')} />
                <Stat value={meQuery.data.clubMembershipCount} label={t('common.clubs')} />
              </View>

              {meQuery.data.universityMembership ? (
                <Alert type="primary" icon="school" className="mt-3">
                  {meQuery.data.universityMembership.university.name}
                </Alert>
              ) : null}
            </Card>

            {/* Frequenting arcades rail */}
            {(meQuery.data.user.frequentingArcades ?? []).length > 0 ? (
              <View className="mb-3.5">
                <SectionTitle title={t('me.frequenting')} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {(meQuery.data.user.frequentingArcades ?? []).map((shop) => (
                    <ShopMiniCard key={shop.id} shop={shop} onPress={() => router.push(`/shop/${shop.id}`)} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Account actions */}
            <Card padding={false} className="mb-3.5 overflow-hidden p-1.5">
              <ListRow
                icon="notifications"
                label={t('me.notifications')}
                badge={unread.data ?? 0}
                onPress={() => router.push('/notifications')}
              />
              <ListRow icon="settings" label={t('me.settings')} onPress={() => router.push('/settings')} />
              <ListRow icon="log-out" label={t('me.logout')} danger onPress={logout} />
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function ListHeaderIconButton({
  name,
  badge,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <View>
      <IconButton icon={name} variant="soft" size={38} onPress={onPress} />
      {badge != null && badge > 0 ? (
        <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full bg-error px-1 py-0.5">
          <Text className="text-[9px] font-extrabold text-white">{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-[17px] font-extrabold text-primary">{value}</Text>
      <Text className="mt-0.5 text-[10.5px] font-semibold text-base-content/50">{label}</Text>
    </View>
  );
}
