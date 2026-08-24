import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button, LoadingView, ErrorState } from '@/components/ui';
import { ShopCard } from '@/components/ShopCard';
import { UserAvatar } from '@/components/ShopCard';
import { useTheme } from '@/theme';
import { useI18n } from '@/i18n';
import { useGameTitles, useMe, useUnreadCount } from '@/hooks/api';
import { useSession } from '@/stores/session';

const USER_TYPE_LABELS: Record<string, string> = {
  site_admin: 'Admin',
  developer: 'Developer',
  school_admin: 'School admin',
  club_admin: 'Club admin',
  school_moderator: 'School mod',
  club_moderator: 'Club mod',
  student: 'Student',
  regular: 'Member',
};

export default function MeScreen() {
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const router = useRouter();

  const authed = useSession((s) => Boolean(s.cookie?.includes('session_token=')));
  const logout = useSession((s) => s.logout);
  const meQuery = useMe();
  const unread = useUnreadCount();
  const titlesQuery = useGameTitles();

  const namesByTitleId = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const title of titlesQuery.data?.titles ?? []) map.set(title.id, title.name);
    return map;
  }, [titlesQuery.data]);

  if (!authed) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
          <Ionicons name="person-circle-outline" size={88} color={colors.textMuted} />
          <Text style={{ fontSize: 20, fontWeight: '800' }}>{t('me.notSignedIn')}</Text>
          <Text style={{ fontSize: 13.5, color: colors.textMuted, textAlign: 'center' }}>{t('me.signInHint')}</Text>
          <Button label={t('me.signIn')} icon={<Ionicons name="qr-code" size={16} color="#fff" />} onPress={() => router.push('/login')} />
        </View>
      </Screen>
    );
  }


  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '900' }}>{t('tabs.me')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <HeaderIcon name="notifications" badge={unread.data ?? 0} onPress={() => router.push('/notifications')} />
            <HeaderIcon name="settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        {meQuery.isLoading ? <LoadingView /> : null}
        {meQuery.isError ? <ErrorState error={meQuery.error} onRetry={() => void meQuery.refetch()} /> : null}

        {meQuery.data ? (
          <>
            <Card style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <UserAvatar name={meQuery.data.user.displayName ?? meQuery.data.user.name} image={meQuery.data.user.image} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800' }}>{meQuery.data.user.displayName || meQuery.data.user.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <Text style={{ fontSize: 12.5, color: colors.textMuted }}>@{meQuery.data.user.name}</Text>
                    {meQuery.data.user.userType ? (
                      <View style={{ backgroundColor: `${colors.accent}20`, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent }}>
                          {USER_TYPE_LABELS[meQuery.data.user.userType] ?? meQuery.data.user.userType}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', marginTop: 14, justifyContent: 'space-around' }}>
                <Stat value={meQuery.data.frequentingArcadesCount} label={t('me.frequenting')} />
                <Stat value={meQuery.data.starredArcadesCount} label={t('me.starred')} />
                <Stat value={meQuery.data.universityMembershipCount} label={t('community.universities')} />
                <Stat value={meQuery.data.clubMembershipCount} label={t('common.clubs')} />
              </View>

              {meQuery.data.universityMembership ? (
                <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 12 }}>
                  🎓 {meQuery.data.universityMembership.university.name}
                </Text>
              ) : null}
            </Card>

            {/* Frequenting arcades */}
            {(meQuery.data.user.frequentingArcades ?? []).length > 0 ? (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>{t('me.frequenting')}</Text>
                {(meQuery.data.user.frequentingArcades ?? []).map((shop) => (
                  <View key={shop.id} style={{ marginBottom: 8 }}>
                    <ShopCard
                      shop={{ ...shop, distance: 0 }}
                      namesByTitleId={namesByTitleId}
                      onPress={() => router.push(`/shop/${shop.id}`)}
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <Button label={t('me.logout')} variant="danger" small onPress={logout} />
      </ScrollView>
    </Screen>
  );
}

function HeaderIcon({ name, badge, onPress }: { name: keyof typeof Ionicons.glyphMap; badge?: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View>
      <Ionicons.Button
        name={name}
        size={22}
        color={colors.textMuted}
        backgroundColor={colors.surface}
        borderRadius={12}
        iconStyle={{ marginRight: 0 }}
        style={{ paddingHorizontal: 9 }}
        onPress={onPress}
      />
      {badge && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 17, fontWeight: '900', color: colors.primary }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}
