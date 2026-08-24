/**
 * Shared API DTOs mirroring nearcade's Zod-validated responses.
 * Dates are ISO-8601 UTC strings. Coordinates are GeoJSON [lng, lat].
 */

export type UserType =
  | 'site_admin'
  | 'developer'
  | 'school_admin'
  | 'club_admin'
  | 'school_moderator'
  | 'club_moderator'
  | 'student'
  | 'regular';

export interface Location {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface OpeningHourTime {
  hour: number; // 0-23
  minute: number; // 0-59
}

/** Length 1 = same hours all week, length 7 = per weekday (Mon-first). */
export type OpeningHours = OpeningHourTime[][];

export interface Game {
  gameId: number;
  titleId: number;
  name: string;
  version: string;
  comment: string;
  quantity: number;
  cost: string;
  totalAttendance?: number;
}

export interface RegionName {
  [locale: string]: string;
}

export interface ExpandedRegion {
  id: string;
  name: RegionName;
}

export interface ShopAddress {
  general: string[];
  detailed: string;
  region?: string[] | ExpandedRegion[];
}

export interface Shop {
  _id?: string;
  id: number;
  name: string;
  comment: string;
  address: ShopAddress;
  openingHours: OpeningHours;
  games: Game[];
  location: Location;
  timezone?: { name: string; offset: number };
  isOpen?: boolean;
  isClaimed?: boolean;
  ownerId?: string;
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverShop extends Shop {
  distance: number;
  totalAttendance?: number;
  currentReportedAttendance?: {
    reportedAt: string;
    reportedBy: string;
    reporter?: UserSummary;
    comment: string | null;
  } | null;
}

export interface DiscoverResponse {
  shops: DiscoverShop[];
  location: { name: string | null; latitude: number; longitude: number };
  radius: number;
  limit?: number;
  gameTitleIds?: number[];
}

export interface ShopListResponse {
  shops: Shop[];
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserSummary {
  id: string;
  name: string | null;
  displayName?: string | null;
  image?: string | null;
}

export interface SocialLink {
  platform: string;
  username: string;
  verified?: boolean;
  userId?: string;
}

export interface UserPublic {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
  avatarImageId?: string;
  createdAt: string;
  updatedAt: string;
  joinedAt?: string;
  lastActiveAt?: string;
  userType?: UserType;
  bio?: string | null;
  displayName?: string | null;
  socialLinks?: SocialLink[];
  frequentingArcades?: number[];
  starredArcades?: number[];
}

export interface ImageAsset {
  id: string;
  url: string;
  storageProvider: 's3' | 'leancloud';
  storageKey: string;
  uploadedAt?: string;
}

export interface ShopPhoto extends ImageAsset {
  shopId: number;
  uploadedBy?: string | null;
  uploader?: UserSummary;
}

export interface VoteInfo {
  id: string;
  userId: string;
  voteType: 'upvote' | 'downvote';
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId?: string;
  shopId?: number;
  shopDeleteRequestId?: string;
  content: string;
  images?: string[];
  resolvedImages?: ImageAsset[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: string | null;
  upvotes: number;
  downvotes: number;
  author?: UserPublic;
  vote?: VoteInfo;
}

export interface ChangelogEntry {
  id: string;
  shopId?: number;
  shopName?: string;
  type?: 'university' | 'club';
  targetId?: string;
  action: string;
  fieldInfo: {
    field: string;
    gameId?: number | null;
    gameName?: string | null;
    gameVersion?: string | null;
    photoId?: string | null;
    photoUrl?: string | null;
    campusId?: string | null;
    campusName?: string | null;
    deleteRequestId?: string | null;
  };
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown>;
  userId?: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; displayName?: string | null; image?: string | null } | null;
}

export interface ChangelogResponse {
  entries: ChangelogEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

export interface AttendanceGameTotal {
  gameId: number;
  titleId: number;
  name: string;
  version: string;
  quantity: number;
  total: number;
}

export interface AttendanceResponse {
  success: boolean;
  total: number;
  games: AttendanceGameTotal[];
  registered: {
    userId?: string;
    gameId: number;
    attendedAt: string;
    plannedLeaveAt: string;
    user?: UserSummary;
  }[];
  reported: {
    gameId: number;
    currentAttendances: number;
    comment: string | null;
    reportedBy: string;
    reportedAt: string;
    reporter?: UserSummary;
  }[];
}

// ---- Rankings ----

export interface RankingMetrics {
  radius: number;
  shopCount: number;
  totalMachines: number;
  areaDensity: number | null;
  machinesPerCapita: number | null;
  gameSpecificMachines: { name: string; quantity: number }[];
}

export interface CampusRankingItem {
  id: string;
  universityName: string;
  campusName: string | null;
  fullName: string;
  type: string;
  majorCategory: string | null;
  natureOfRunning: string | null;
  affiliation: string;
  is985: boolean | null;
  is211: boolean | null;
  isDoubleFirstClass: boolean | null;
  province: string;
  city: string;
  district: string | null;
  address: string;
  location: Location;
  rankings: RankingMetrics[];
}

export interface RegionRankingItem {
  id: string;
  level: string;
  name: string;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  county?: string | null;
  regionChain?: { id: string; name: RegionName }[];
  location: Location;
  area: number | null;
  population: number | null;
  shopCount: number;
  totalMachines: number;
  areaDensity: number | null;
  machinesPerCapita: number | null;
  gameSpecificMachines: { name: string; quantity: number }[];
}

export interface RankingsResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
  cached: boolean;
  cacheTime: string;
  stale: boolean;
  calculating?: boolean;
}

// ---- Universities & clubs ----

export interface Campus {
  id: string;
  name: string | null;
  province: string;
  city: string;
  district: string | null;
  address: string;
  location: Location;
}

export interface University {
  id: string;
  name: string;
  slug?: string;
  type: string;
  majorCategory: string | null;
  natureOfRunning: string | null;
  affiliation: string;
  is985: boolean | null;
  is211: boolean | null;
  isDoubleFirstClass: boolean | null;
  campuses: Campus[];
  backgroundColor?: string;
  avatarUrl?: string;
  avatarImageId?: string | null;
  description?: string;
  website?: string;
  postReadability?: 0 | 1 | 2;
  postWritability?: 0 | 1 | 2 | 3;
  studentsCount?: number;
  frequentingArcades?: number[];
  clubsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubListItem extends Club {
  universityName?: string;
  universityAvatarUrl?: string | null;
}

export interface ClubsListResponse {
  clubs: ClubListItem[];
  universities: { id: string; name: string }[];
  totalCount: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  query: string;
  selectedUniversityId: string;
}

export interface OrgMember {
  memberType: string;
  joinedAt: string;
  user: UserSummary;
}

export interface Club {
  id: string;
  universityId: string;
  name: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  avatarImageId?: string | null;
  backgroundColor?: string;
  website?: string;
  acceptJoinRequests: boolean;
  postReadability: 0 | 1 | 2;
  postWritability: 0 | 1 | 2 | 3;
  membersCount?: number;
  starredArcades: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubDetailResponse {
  club: Club;
  university: University | null;
  members: OrgMember[];
  starredArcades: Shop[];
  stats: { totalMembers: number };
  userPermissions: { canEdit: boolean; canManage: boolean; canJoin: 0 | 1 | 2; role?: string };
  canWritePosts: boolean;
}

// ---- Posts ----

export interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  resolvedImages?: ImageAsset[];
  universityId?: string;
  clubId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  readability: 0 | 1 | 2;
  author?: UserPublic;
}

export interface OrganizationPostsResponse {
  posts: Post[];
  hasMore: boolean;
  page: number;
}

export interface PostDetailResponse {
  post: Post;
  comments: Comment[];
  userVote: 'upvote' | 'downvote' | null;
}

// ---- Users / profile ----

export interface ProfileMembership {
  verifiedAt?: string;
  joinedAt: string;
  university: { id: string; slug?: string; name: string };
}

export interface UserProfileResponse {
  user: Omit<UserPublic, 'frequentingArcades' | 'starredArcades'> & {
    displayName: string | null;
    bio: string | null;
    email: string | null;
    frequentingArcades: Shop[];
    starredArcades: Shop[];
    isActivityPublic?: boolean;
  };
  frequentingArcadesCount: number;
  starredArcadesCount: number;
  universityMembershipCount: number;
  clubMembershipCount: number;
  universityMembership: ProfileMembership | null;
  isOwnProfile: boolean;
}

export interface Activity {
  id: string;
  type: string;
  createdAt: string;
  userId: string;
  postTitle?: string;
  postId?: string;
  universityId?: string;
  clubId?: string;
  universityName?: string;
  clubName?: string;
  commentContent?: string;
  commentId?: string;
  parentPostTitle?: string;
  voteType?: 'upvote' | 'downvote';
  changelogAction?: string;
  changelogDescription?: string;
  changelogTargetName?: string;
  shopId?: number;
  shopName?: string;
  joinedUniversityName?: string;
  joinedClubName?: string;
  createdClubName?: string;
  isLive?: boolean;
}

export interface ActivitiesResponse {
  activities: Activity[];
  hasMore: boolean;
  page: number;
  limit: number;
}

// ---- Notifications ----

export type NotificationType =
  | 'COMMENTS'
  | 'REPLIES'
  | 'POST_VOTES'
  | 'COMMENT_VOTES'
  | 'JOIN_REQUESTS'
  | 'SHOP_DELETE_REQUESTS';

export interface Notification {
  id: string;
  type: NotificationType;
  actorUserId: string;
  actorName: string;
  actorDisplayName?: string;
  actorImage?: string;
  targetUserId: string;
  createdAt: string;
  readAt?: string | null;
  content?: string;
  postId?: string;
  postTitle?: string;
  commentId?: string;
  voteType?: 'upvote' | 'downvote';
  shopId?: number;
  shopName?: string;
  universityId?: string;
  clubId?: string;
  universityName?: string;
  clubName?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  hasMore: boolean;
  page: number;
  limit: number;
}

// ---- Misc ----

export interface GameTitle {
  id: number;
  key: string;
  name: string;
  seats: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  parentName?: string | null;
  value: number;
}

export interface HomeStats {
  totals: { shops: number; machines: number; users: number };
  region: Record<'country' | 'province' | 'city', Record<'shops' | 'machines', LeaderboardEntry[]>>;
  campus: Record<string, Record<'shops' | 'machines', LeaderboardEntry[]>>;
}
