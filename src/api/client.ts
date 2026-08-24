import type {
  ActivitiesResponse,
  AttendanceResponse,
  CampusRankingItem,
  ChangelogResponse,
  ClubDetailResponse,
  ClubsListResponse,
  Comment,
  DiscoverResponse,
  GameTitle,
  HomeStats,
  NotificationsResponse,
  OrganizationPostsResponse,
  Post,
  PostDetailResponse,
  RegionRankingItem,
  RankingsResponse,
  Shop,
  ShopListResponse,
  ShopPhoto,
  UserProfileResponse,
  University,
} from './types';

export const DEFAULT_SERVER_URL = 'https://nearcade.cn';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  /** Returns the stored cookie header value for the current server (may be ''). */
  getCookie?: () => string | undefined;
  /** Persists cookies captured from a response's set-cookie header. */
  storeCookies?: (setCookieHeader: string | null) => void;
}

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_SERVER_URL;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export class NearcadeApi {
  readonly baseUrl: string;
  private getCookie?: () => string | undefined;
  private storeCookies?: (setCookieHeader: string | null) => void;

  constructor(opts: ApiClientOptions) {
    this.baseUrl = normalizeBaseUrl(opts.baseUrl);
    this.getCookie = opts.getCookie;
    this.storeCookies = opts.storeCookies;
  }

  private async request<T>(
    path: string,
    init: { method?: string; query?: Record<string, string | number | boolean | undefined>; body?: unknown; timeoutMs?: number } = {}
  ): Promise<T> {
    const url = new URL(path.replace(/^\/+/, ''), `${this.baseUrl}/`);
    if (init.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
      }
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), init.timeoutMs ?? 20000);
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      const cookie = this.getCookie?.();
      if (cookie) headers.Cookie = cookie;
      if (init.body !== undefined) headers['Content-Type'] = 'application/json';
      const res = await fetch(url.toString(), {
        method: init.method ?? 'GET',
        headers,
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        signal: controller.signal,
        // Web: harmless cross-origin without credentials; same-origin deployments
        // will send the session cookie automatically.
        credentials: 'include',
      });
      this.storeCookies?.(res.headers.get('set-cookie'));
      if (!res.ok) {
        let message = `${res.status} ${res.statusText}`;
        try {
          const data = (await res.json()) as { message?: string; error?: string };
          message = data.message ?? data.error ?? message;
        } catch {
          // keep default message
        }
        throw new ApiError(res.status, message);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ---- Misc ----
  getGameTitles() {
    return this.request<{ titles: GameTitle[] }>('/api/game-titles', { timeoutMs: 30000 });
  }
  getHomeStats() {
    return this.request<HomeStats>('/api/home/stats');
  }
  getHomeChangelog(page = 1, limit = 20) {
    return this.request<ChangelogResponse>('/api/home/changelog', { query: { page, limit } });
  }

  // ---- Discover / shops ----
  discover(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
    gameTitleIds?: number[];
    name?: string;
    fetchAttendance?: boolean;
    includeTimeInfo?: boolean;
  }) {
    return this.request<DiscoverResponse>('/api/discover', {
      query: {
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius,
        limit: params.limit,
        gameTitleIds: params.gameTitleIds?.length ? params.gameTitleIds.join(',') : undefined,
        name: params.name,
        fetchAttendance: params.fetchAttendance === false ? 'false' : undefined,
        includeTimeInfo: params.includeTimeInfo === false ? 'false' : undefined,
      },
      timeoutMs: 30000,
    });
  }
  listShops(params: { q?: string; regionId?: string; page?: number; limit?: number }) {
    return this.request<ShopListResponse>('/api/shops', { query: params });
  }
  getShop(id: number) {
    return this.request<{ shop: Shop }>(`/api/shops/${id}`);
  }
  getShopComments(id: number) {
    return this.request<Comment[]>(`/api/shops/${id}/comments`);
  }
  getShopChangelog(id: number, page = 1, limit = 20) {
    return this.request<ChangelogResponse>(`/api/shops/${id}/changelog`, { query: { page, limit } });
  }
  getShopPhotos(id: number) {
    return this.request<{ photos: ShopPhoto[] }>(`/api/shops/${id}/photos`);
  }
  getAttendance(id: number) {
    return this.request<AttendanceResponse>(`/api/shops/${id}/attendance`);
  }

  // ---- Rankings ----
  getCampusRankings(params: { sortBy?: string; radius?: number; limit?: number; after?: number }) {
    return this.request<RankingsResponse<CampusRankingItem>>('/api/rankings/campus', {
      query: { sortBy: params.sortBy, radius: params.radius, limit: params.limit, after: params.after },
      timeoutMs: 30000,
    });
  }
  getRegionRankings(params: { sortBy?: string; level?: string; limit?: number; after?: number }) {
    return this.request<RankingsResponse<RegionRankingItem>>('/api/rankings/region', {
      query: { sortBy: params.sortBy, level: params.level, limit: params.limit, after: params.after },
      timeoutMs: 30000,
    });
  }

  // ---- Universities ----
  searchUniversities(q: string) {
    return this.request<{ universities: University[] }>('/api/universities', { query: { q } });
  }
  getUniversity(id: string) {
    return this.request<{ university: University }>(`/api/universities/${encodeURIComponent(id)}`);
  }
  getUniversityClubs(id: string, page = 1) {
    return this.request<{
      clubs: import('./types').Club[];
      hasMore: boolean;
      page: number;
      totalClubs: number;
    }>(`/api/universities/${encodeURIComponent(id)}/clubs`, { query: { page } });
  }
  getUniversityPosts(id: string, page = 1) {
    return this.request<OrganizationPostsResponse>(`/api/universities/${encodeURIComponent(id)}/posts`, {
      query: { page },
    });
  }
  getUniversityMembers(id: string, page = 1) {
    return this.request<{
      members: import('./types').OrgMember[];
      hasMore: boolean;
      page: number;
      totalMembers: number;
    }>(`/api/universities/${encodeURIComponent(id)}/members`, { query: { page } });
  }

  // ---- Clubs ----
  listClubs(params: { q?: string; university?: string; page?: number }) {
    return this.request<ClubsListResponse>('/api/clubs', { query: params });
  }
  getClub(id: string) {
    return this.request<ClubDetailResponse>(`/api/clubs/${encodeURIComponent(id)}`);
  }
  getClubArcades(id: string, page = 1) {
    return this.request<{ arcades: Shop[]; hasMore: boolean; page: number; total: number }>(
      `/api/clubs/${encodeURIComponent(id)}/arcades`,
      { query: { page } }
    );
  }
  getClubPosts(id: string, page = 1) {
    return this.request<OrganizationPostsResponse>(`/api/clubs/${encodeURIComponent(id)}/posts`, {
      query: { page },
    });
  }
  getClubMembers(id: string, page = 1) {
    return this.request<{
      members: import('./types').OrgMember[];
      hasMore: boolean;
      page: number;
      totalMembers: number;
    }>(`/api/clubs/${encodeURIComponent(id)}/members`, { query: { page } });
  }

  // ---- Posts ----
  getPost(postId: string) {
    return this.request<PostDetailResponse>(`/api/posts/${encodeURIComponent(postId)}`);
  }
  votePost(postId: string, voteType: 'upvote' | 'downvote') {
    return this.request<{ success: boolean; upvotes: number; downvotes: number; userVote: 'upvote' | 'downvote' | null }>(
      `/api/posts/${encodeURIComponent(postId)}/vote`,
      { method: 'POST', body: { voteType } }
    );
  }
  commentOnPost(postId: string, content: string, parentCommentId?: string) {
    return this.request<{ success: boolean; commentId: string }>(`/api/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: { content, parentCommentId: parentCommentId || undefined },
    });
  }
  voteComment(commentId: string, voteType: 'upvote' | 'downvote') {
    return this.request<{ success: boolean; upvotes: number; downvotes: number; userVote: 'upvote' | 'downvote' | null }>(
      `/api/comments/${encodeURIComponent(commentId)}/vote`,
      { method: 'POST', body: { voteType } }
    );
  }

  // ---- Users ----
  getMe() {
    return this.request<UserProfileResponse>('/api/users/me');
  }
  getUser(id: string) {
    return this.request<UserProfileResponse>(`/api/users/${encodeURIComponent(id)}`);
  }
  getUserActivities(id: string, page = 1, limit = 20) {
    return this.request<ActivitiesResponse>(`/api/users/${encodeURIComponent(id)}/activities`, {
      query: { page, limit },
    });
  }

  // ---- Auth ----
  /**
   * Redeems a Better Auth one-time token (shown as QR / copyable code on the
   * website at /auth/handoff) and stores the resulting session cookie.
   */
  async loginWithOneTimeToken(token: string): Promise<void> {
    const url = new URL('/api/auth/one-time-token/verify', `${this.baseUrl}/`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });
      if (!res.ok) {
        let message = `${res.status}`;
        try {
          const data = (await res.json()) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          // ignore
        }
        throw new ApiError(res.status, message);
      }
      await res.json().catch(() => null);
      const setCookie = res.headers.get('set-cookie');
      if (!setCookie || !/session_token=/i.test(setCookie)) {
        throw new ApiError(401, 'No session cookie returned — is the token valid and unused?');
      }
      this.storeCookies?.(setCookie);
    } finally {
      clearTimeout(timer);
    }
  }

  // ---- Notifications ----
  getNotifications(page = 1, unreadOnly = false) {
    return this.request<NotificationsResponse>('/api/notifications', {
      query: { page, limit: 30, unreadOnly: unreadOnly ? 'true' : undefined },
    });
  }
  markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/api/notifications', {
      method: 'POST',
      body: { action: 'markAsRead' },
    });
  }
}

// Re-export Post for convenience of screens building feeds.
export type { Post };
