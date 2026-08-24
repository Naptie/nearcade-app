import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useApi } from '@/api';
import { ApiError } from '@/api/client';
import { useSession } from '@/stores/session';

export const qk = {
  gameTitles: ['game-titles'] as const,
  homeStats: ['home-stats'] as const,
  homeChangelog: (page: number) => ['home-changelog', page] as const,
  discover: (lat: number, lng: number, radius: number, titles: number[]) =>
    ['discover', lat, lng, radius, [...titles].sort()] as const,
  shop: (id: number) => ['shop', id] as const,
  shopComments: (id: number) => ['shop-comments', id] as const,
  shopChangelog: (id: number, page: number) => ['shop-changelog', id, page] as const,
  attendance: (id: number) => ['attendance', id] as const,
  campusRankings: (sortBy: string, radius: number) => ['rankings-campus', sortBy, radius] as const,
  regionRankings: (sortBy: string, level: string) => ['rankings-region', sortBy, level] as const,
  universitySearch: (q: string) => ['universities-search', q] as const,
  university: (id: string) => ['university', id] as const,
  universityClubs: (id: string, page: number) => ['university-clubs', id, page] as const,
  universityPosts: (id: string, page: number) => ['university-posts', id, page] as const,
  clubs: (q: string, universityId: string, page: number) => ['clubs', q, universityId, page] as const,
  club: (id: string) => ['club', id] as const,
  post: (id: string) => ['post', id] as const,
  me: ['me'] as const,
  userActivities: (id: string, page: number) => ['user-activities', id, page] as const,
  notifications: (unreadOnly: boolean, page: number) => ['notifications', unreadOnly, page] as const,
};

export function useGameTitles() {
  const api = useApi();
  return useQuery({
    queryKey: qk.gameTitles,
    queryFn: () => api.getGameTitles(),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useHomeStats() {
  const api = useApi();
  return useQuery({ queryKey: qk.homeStats, queryFn: () => api.getHomeStats(), staleTime: 60_000 });
}

export function useHomeChangelog(page = 1) {
  const api = useApi();
  return useQuery({ queryKey: qk.homeChangelog(page), queryFn: () => api.getHomeChangelog(page, 20) });
}

export function useDiscover(lat: number | null, lng: number | null, radius: number, gameTitleIds: number[]) {
  const api = useApi();
  return useQuery({
    queryKey: qk.discover(lat ?? 0, lng ?? 0, radius, gameTitleIds),
    queryFn: () => api.discover({ latitude: lat!, longitude: lng!, radius, gameTitleIds }),
    enabled: lat != null && lng != null,
    staleTime: 30_000,
  });
}

export function useShop(id: number) {
  const api = useApi();
  return useQuery({
    queryKey: qk.shop(id),
    queryFn: async () => {
      const { shop } = await api.getShop(id);
      return shop;
    },
    enabled: Number.isFinite(id),
  });
}

export function useShopComments(id: number) {
  const api = useApi();
  return useQuery({ queryKey: qk.shopComments(id), queryFn: () => api.getShopComments(id) });
}

export function useShopChangelog(id: number) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ['shop-changelog-inf', id],
    queryFn: ({ pageParam }) => api.getShopChangelog(id, pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: Number.isFinite(id),
  });
}

export function useAttendance(id: number) {
  const api = useApi();
  return useQuery({ queryKey: qk.attendance(id), queryFn: () => api.getAttendance(id), staleTime: 15_000 });
}

export function useCampusRankings(sortBy: string, radius: number) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: qk.campusRankings(sortBy, radius),
    queryFn: ({ pageParam }) => api.getCampusRankings({ sortBy, radius, after: pageParam as number | undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => (last.nextCursor != null ? Number(last.nextCursor) : undefined),
    staleTime: 5 * 60_000,
  });
}

export function useRegionRankings(sortBy: string, level: string) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: qk.regionRankings(sortBy, level),
    queryFn: ({ pageParam }) => api.getRegionRankings({ sortBy, level, after: pageParam as number | undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => (last.nextCursor != null ? Number(last.nextCursor) : undefined),
    staleTime: 5 * 60_000,
  });
}

export function useUniversitySearch(q: string) {
  const api = useApi();
  return useQuery({
    queryKey: qk.universitySearch(q),
    queryFn: async () => {
      const { universities } = await api.searchUniversities(q);
      return universities;
    },
    enabled: q.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useUniversity(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: qk.university(id),
    queryFn: async () => {
      const { university } = await api.getUniversity(id);
      return university;
    },
  });
}

export function useUniversityPosts(id: string) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ['university-posts-inf', id],
    queryFn: ({ pageParam }) => api.getUniversityPosts(id, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useUniversityClubs(id: string) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ['university-clubs-inf', id],
    queryFn: ({ pageParam }) => api.getUniversityClubs(id, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useClubs(q: string, universityId: string) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ['clubs-inf', q, universityId],
    queryFn: ({ pageParam }) => api.listClubs({ q, university: universityId || undefined, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage ? last.currentPage + 1 : undefined),
  });
}

export function useClub(id: string) {
  const api = useApi();
  return useQuery({ queryKey: qk.club(id), queryFn: () => api.getClub(id) });
}

export function useClubArcades(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['club-arcades', id],
    queryFn: async () => {
      const res = await api.getClubArcades(id, 1);
      return res.arcades;
    },
    staleTime: 5 * 60_000,
  });
}

export function useClubPosts(id: string) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ['club-posts-inf', id],
    queryFn: ({ pageParam }) => api.getClubPosts(id, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function usePost(postId: string) {
  const api = useApi();
  return useQuery({ queryKey: qk.post(postId), queryFn: () => api.getPost(postId) });
}

export function useIsAuthed() {
  const cookie = useSession((s) => s.cookie);
  return Boolean(cookie && cookie.includes('session_token='));
}

export function useMe() {
  const api = useApi();
  const authed = useIsAuthed();
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      try {
        return await api.getMe();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    enabled: authed,
    staleTime: 60_000,
    retry: false,
  });
}

/** Unread notification count for the tab badge. */
export function useUnreadCount() {
  const api = useApi();
  const authed = useIsAuthed();
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await api.getNotifications(1, true);
      return res.notifications.length;
    },
    enabled: authed,
    refetchInterval: 60_000,
    retry: false,
  });
}

export function useNotifications(unreadOnly: boolean) {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: ['notifications-inf', unreadOnly],
    queryFn: ({ pageParam }) => api.getNotifications(pageParam as number, unreadOnly),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: useIsAuthed(),
  });
}

// ---- Mutations ----

export function useVotePostMutation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, voteType }: { postId: string; voteType: 'upvote' | 'downvote' }) =>
      api.votePost(postId, voteType),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.post(vars.postId) });
    },
  });
}

export function useCommentOnPostMutation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      api.commentOnPost(postId, content),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.post(vars.postId) });
    },
  });
}

export function useMarkAllReadMutation() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
