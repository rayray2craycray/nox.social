export interface Venue {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
  };
  type?: 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT';
  rating?: number;
  priceLevel?: number;
  hours?: Record<string, string>;
  tags?: string[];
  capacity?: number;
  features?: string[];
  distance?: number;
  description?: string;
  phoneNumber?: string;
  website?: string;
  isOpen: boolean;
  currentVibeLevel: number;
  coverCharge?: number;
  genres: string[];
  imageUrl: string;
  hasPublicLobby: boolean;
  vipThreshold: number;
}

export interface Performer {
  id: string;
  name: string;
  stageName?: string;
  bio?: string;
  genres: string[];
  imageUrl?: string;
  followerCount: number;
  followersCount: number; // Alias for followerCount (used in content features)
  totalRevenueGenerated: number;
  baseCity: string;
  epkVideoUrl: string;
  verified: boolean;
  socialLinks?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
}

export interface VibeVideo {
  id: string;
  venueId: string;
  performerId?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  title: string;
  views: number;
  likes: number;
  timestamp: string;
  filter?: 'none' | 'neon-glitch' | 'afterhours-noir' | 'vhs-retro' | 'cyber-wave' | 'golden-hour';
  sticker?: 'none' | 'get-tickets' | 'join-lobby' | 'live-tonight' | 'swipe-up';
  stickerPosition?: { x: number; y: number }; // Position as percentage (0-100)
}

export interface UserBadge {
  id: string;
  venueId: string;
  venueName: string;
  badgeType: 'GUEST' | 'REGULAR' | 'PLATINUM' | 'WHALE';
  unlockedAt: string;
}

export interface ServerChannel {
  id: string;
  name: string;
  type: 'PUBLIC_LOBBY' | 'INNER_CIRCLE' | 'PERFORMER_DIRECT';
  isLocked: boolean;
  unreadCount: number;
}

export interface VenueServer {
  venueId: string;
  venueName: string;
  channels: ServerChannel[];
  memberCount: number;
  lastActivity: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userBadge: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export type UserRole = 'VENUE' | 'PARTYGOER' | 'TALENT' | null;

export interface UserTransaction {
  id: string;
  venueId: string;
  amount: number;
  timestamp: string;
  locationId?: string;
  cardToken?: string;
  orderGuid?: string;
  checkGuid?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
  totalSpend: number;
  badges: UserBadge[];
  isIncognito: boolean;
  followedPerformers: string[];
  isVenueManager?: boolean;
  managedVenues?: string[];
  role: UserRole;
  isAuthenticated: boolean;
  isVerified?: boolean;
  verifiedCategory?: 'PERFORMER' | 'PROMOTER' | 'MANAGER';
  transactionHistory: UserTransaction[];
}

export interface VenueRule {
  id: string;
  type: 'SPENDING_TIER' | 'FREQUENCY_TIER' | 'SPECIFIC_PURCHASE' | 'PERFORMER_LOYALTY';
  trigger: {
    condition: string;
    threshold: number;
    timeWindow?: number;
  };
  reward: {
    serverAccess: string;
    badgeType?: string;
    notifyManager?: boolean;
  };
  isActive: boolean;
}

export interface VenueAnalytics {
  venueId: string;
  period: 'today' | 'week' | 'month';
  totalRevenue: number;
  totalTransactions: number;
  averageSpend: number;
  uniqueGuests: number;
  newMembers: number;
  vipUpgrades: number;
  peakHours: { hour: number; revenue: number; guests: number }[];
  topSpenders: { userId: string; name: string; spend: number; tier: string }[];
}

export interface ServerMember {
  userId: string;
  displayName: string;
  tier: 'GUEST' | 'REGULAR' | 'PLATINUM' | 'WHALE';
  totalSpend: number;
  visitCount: number;
  lastVisit: string;
  isOnline: boolean;
  status: 'ACTIVE' | 'BANNED' | 'WARNED';
}

export interface PerformerBooking {
  id: string;
  performerId: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  fee: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  expectedRevenue?: number;
  actualRevenue?: number;
  attendanceGenerated?: number;
}

export interface PromoterStats {
  promoterId: string;
  promoterName: string;
  uniqueTrackingCode: string;
  totalGuestsBrought: number;
  totalRevenue: number;
  lifetimeValue: number;
  conversionRate: number;
  payout: number;
}

export interface Gig {
  id: string;
  performerId: string;
  venueId: string;
  venueName: string;
  venueImageUrl: string;
  venueLocation?: string;
  date: string;
  startTime: string;
  endTime: string;
  fee: number;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  genre: string;
  expectedAttendance?: number;
  actualRevenue?: number;
  ticketClicks?: number;
  barSalesGenerated?: number;
}

export interface PromoVideo {
  id: string;
  performerId: string;
  gigId?: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  caption: string;
  duration: number;
  status: 'DRAFT' | 'PUBLISHED' | 'PROCESSING';
  createdAt: string;
  views: number;
  ticketClicks: number;
  socialShares: number;
}

export interface PerformerAnalytics {
  performerId: string;
  totalGigs: number;
  totalRevenue: number;
  totalBarSalesGenerated: number;
  followerCount: number;
  followerGrowth: number;
  averageTicketClicks: number;
  topVenues: { venueId: string; venueName: string; gigCount: number; revenue: number }[];
  recentVideos: PromoVideo[];
  upcomingGigs: Gig[];
}

export type VibeEnergyLevel = 'Chill' | 'Social' | 'Wild';
export type WaitTimeRange = '0-10m' | '10-30m' | '30m+';

export interface VibeCheckVote {
  userId: string;
  venueId: string;
  music: number;
  density: number;
  energy: VibeEnergyLevel;
  waitTime: WaitTimeRange;
  weight: number;
  timestamp: string;
}

export interface VenueVibeData {
  venueId: string;
  musicScore: number;
  densityScore: number;
  energyLevel: VibeEnergyLevel;
  waitTime: WaitTimeRange;
  lastUpdated: string;
  totalVotes: number;
}

export interface UserVibeCooldown {
  venueId: string;
  lastVoteTimestamp: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  shareLocation: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export type LocationPrecision = 'EXACT' | 'VENUE_ONLY' | 'HIDDEN';

export interface FriendLocation {
  userId: string;
  displayName: string;
  avatarUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  venueId?: string;
  venueName?: string;
  precision: LocationPrecision;
  lastUpdated: string;
  isActive: boolean;
}

export interface LocationSettings {
  ghostMode: boolean;
  precision: LocationPrecision;
  autoExpireEnabled: boolean;
  autoExpireTime: string;
  onlyShowToMutual: boolean;
}

export interface FriendProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  isOnline: boolean;
  currentVenueId?: string;
  currentVenueName?: string;
  mutualFriends: number;
  isVerified?: boolean;
  verifiedCategory?: 'PERFORMER' | 'PROMOTER' | 'MANAGER';
}

export type SuggestionSource =
  | { type: 'CONTACT'; phoneNumber: string }
  | { type: 'INSTAGRAM'; instagramUsername: string }
  | { type: 'MUTUAL_FRIENDS'; count: number }
  | { type: 'VENUE'; venueId: string; venueName: string }
  | { type: 'ALGORITHM' };

export interface SuggestedPerson extends FriendProfile {
  source: SuggestionSource;
  priority: number; // Higher = show first (contacts = 100, Instagram = 80, mutuals = 60, etc.)
}

export type FeedFilter = 'NEARBY' | 'FOLLOWING';

export interface FeedSettings {
  selectedFilter: FeedFilter;
  lastUpdated: string;
}

// ===== POS INTEGRATION (TOAST & SQUARE) =====

/**
 * POS Provider Types
 */
export type POSProviderType = 'TOAST' | 'SQUARE';

/**
 * POS Integration Status
 */
export type POSStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'VALIDATING';

/**
 * POS Integration Credentials
 */
export interface POSCredentials {
  apiKey: string; // Toast API key or Square access token
  locationId: string; // Toast restaurant GUID or Square location ID
  environment: 'PRODUCTION' | 'SANDBOX';
}

/**
 * POS Location (generic for both providers)
 */
export interface POSLocation {
  id: string;
  name: string;
  address: string;
  provider: POSProviderType;
  metadata?: {
    restaurantGuid?: string; // Toast-specific
    merchantName?: string; // Square-specific
    currency?: string;
    timezone?: string;
  };
}

/**
 * POS Integration
 */
export interface POSIntegration {
  id: string;
  venueId: string;
  provider: POSProviderType;
  status: POSStatus;
  metadata: {
    locationName?: string;
    merchantName?: string;
    currency?: string;
    timezone?: string;
    webhookUrl?: string;
    environment?: 'SANDBOX' | 'PRODUCTION'; // Added for environment tracking
    restaurantExternalId?: string;
  };
  syncConfig: {
    enabled: boolean;
    interval: number; // in seconds
    lastSyncAt?: string;
    lastSyncStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
    syncErrors?: string[];
  };
  webhooks?: {
    enabled: boolean;
    events?: string[];
  };
  connectedAt?: string;
  disconnectedAt?: string;
  stats?: {
    transactionCount: number;
    totalRevenue: number;
    averageTransaction: number;
  };
}

/**
 * Spend Rule (works for both Toast and Square)
 */
export interface SpendRule {
  id: string;
  venueId: string;
  threshold: number; // in dollars
  tierUnlocked: 'GUEST' | 'REGULAR' | 'PLATINUM' | 'WHALE';
  serverAccessLevel: 'PUBLIC_LOBBY' | 'INNER_CIRCLE';
  isLiveOnly: boolean;
  liveTimeWindow?: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  performerId?: string;
  description?: string;
  priority?: number;
  isActive: boolean;
  stats?: {
    timesTriggered: number;
    lastTriggeredAt?: string;
    usersUnlocked: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * POS Transaction
 */
export interface POSTransaction {
  id: string;
  posIntegrationId: string;
  venueId: string;
  provider: POSProviderType;
  externalIds: {
    transactionId: string; // Toast checkGuid or Square payment_id
    orderId?: string; // Toast orderGuid or Square order_id
    customerId?: string;
  };
  amount: {
    total: number; // in cents
    subtotal?: number;
    tax?: number;
    tip?: number;
    discount?: number;
  };
  currency: string;
  paymentMethod: {
    type?: string; // CARD, CASH, MOBILE_PAYMENT
    cardBrand?: string; // VISA, MASTERCARD, AMEX
    lastFour?: string;
    cardToken?: string;
  };
  userId?: string;
  matchedAt?: string;
  matchConfidence?: number; // 0-100
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
  timestamp: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  rulesProcessed?: Array<{
    ruleId: string;
    triggered: boolean;
    tierUnlocked: string;
    accessGranted: string;
    processedAt: string;
  }>;
  createdAt?: string;
}

/**
 * Sync Result
 */
export interface SyncResult {
  transactionsSynced: number;
  newTransactions: number;
  duplicatesSkipped: number;
  rulesProcessed?: number;
  tiersUnlocked?: {
    REGULAR?: number;
    PLATINUM?: number;
    WHALE?: number;
  };
  syncDuration?: number;
}

/**
 * Revenue Stats
 */
export interface RevenueStats {
  period: 'day' | 'week' | 'month' | 'year' | 'all';
  totalRevenue: number; // in dollars
  totalTransactions: number;
  averageTransaction: number; // in dollars
}

// Legacy Toast types (for backward compatibility - deprecated)
/**
 * @deprecated Use POSLocation instead
 */
export interface ToastLocation extends POSLocation {
  restaurantGuid: string;
}

/**
 * @deprecated Use POSIntegration instead
 */
export interface ToastIntegration extends Omit<POSIntegration, 'provider'> {
  accessToken?: string;
  refreshToken?: string;
  selectedLocations: string[];
  webhooksEnabled: boolean;
  lastSyncAt?: string; // Added for sync tracking
}

/**
 * @deprecated Use SpendRule instead
 */
export interface ToastSpendRule extends SpendRule {}

/**
 * @deprecated Use POSTransaction instead
 */
export interface ToastTransactionData {
  id: string;
  venueId: string;
  locationId: string;
  amount: number;
  cardToken: string;
  timestamp: string;
  orderGuid: string;
  checkGuid: string;
  userId?: string;
}

export interface CardTokenMapping {
  userId: string;
  cardToken: string;
  lastUsed: string;
  provider: 'STRIPE' | 'PLAID';
}

export interface LinkedCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  cardholderName?: string;
}

// ===== GROWTH FEATURES: VIRAL LOOP =====

// Group Purchases & Ticket Splitting
export interface GroupPurchase {
  id: string;
  initiatorId: string;
  venueId: string;
  eventId?: string;
  ticketType: 'ENTRY' | 'TABLE' | 'BOTTLE_SERVICE';
  totalAmount: number;
  perPersonAmount: number;
  maxParticipants: number;
  currentParticipants: string[]; // userId[]
  status: 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  notes?: string;
}

export interface GroupPurchaseInvite {
  id: string;
  groupPurchaseId: string;
  inviterId: string;
  inviteeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sentAt: string;
  respondedAt?: string;
}

// Referral System
export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  status: 'PENDING' | 'COMPLETED' | 'REWARDED';
  rewardType: 'DISCOUNT' | 'SKIP_LINE' | 'FREE_DRINK' | 'VIP_ACCESS';
  rewardValue: number;
  usedAt?: string;
  createdAt: string;
}

export interface ReferralReward {
  id: string;
  userId: string;
  referralId: string;
  type: 'REFERRER' | 'REFEREE';
  reward: {
    type: 'DISCOUNT' | 'SKIP_LINE' | 'FREE_DRINK' | 'VIP_ACCESS';
    value: number;
    description: string;
  };
  isUsed: boolean;
  expiresAt: string;
  usedAt?: string;
}

export interface UserReferralStats {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsEarned: number;
  pendingRewards: ReferralReward[];
  lifetimeValue: number;
}

// Instagram Story Sharing
export interface StoryTemplate {
  id: string;
  name: string;
  type: 'EVENT' | 'VENUE' | 'GROUP_INVITE' | 'ACHIEVEMENT';
  backgroundUrl: string;
  overlayElements: {
    type: 'TEXT' | 'IMAGE' | 'STICKER' | 'QR_CODE';
    content: string;
    position: { x: number; y: number };
    style?: any;
  }[];
  deepLink: string;
}

export interface ShareableContent {
  id: string;
  userId: string;
  type: 'GROUP_PURCHASE' | 'EVENT' | 'ACHIEVEMENT' | 'REFERRAL';
  templateId: string;
  customData: any;
  deepLink: string;
  createdAt: string;
  shareCount: number;
  clickCount: number;
}

// ===== GROWTH FEATURES: COLD START SOLUTIONS =====

// Events & Ticketing
export interface Event {
  id: string;
  venueId: string;
  venueName?: string;
  title: string;
  description: string;
  performerIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  ticketTiers: TicketTier[];
  imageUrl: string;
  genres: string[];
  totalCapacity: number;
  createdAt: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  tier: 'EARLY_BIRD' | 'GENERAL' | 'VIP' | 'TABLE';
  salesWindow: {
    start: string;
    end: string;
  };
  isAppExclusive: boolean;
  perks?: string[];
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  tierId: string;
  qrCode: string;
  status: 'ACTIVE' | 'USED' | 'TRANSFERRED' | 'CANCELLED';
  purchasedAt: string;
  usedAt?: string;
  transferredTo?: string;
  transferredAt?: string;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  toUserId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  createdAt: string;
  acceptedAt?: string;
}

// Guest List Management
export interface GuestListEntry {
  id: string;
  venueId: string;
  eventId?: string;
  date: string;
  guestUserId?: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  plusOnes: number;
  listType?: 'STANDARD' | 'VIP' | 'MEDIA';
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';
  addedBy: string;
  notes?: string;
  checkedInAt?: string;
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  guestListEntryId?: string;
  ticketId?: string;
  venueId: string;
  eventId?: string;
  userId?: string;
  guestName?: string;
  checkedInBy: string;
  checkedInAt: string;
  method: 'QR_CODE' | 'MANUAL' | 'GUEST_LIST';
}

// ===== GROWTH FEATURES: NETWORK EFFECTS =====

// Crews & Squads
export interface Crew {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  imageUrl?: string;
  isPrivate: boolean;
  stats: {
    totalNightsOut: number;
    totalSpent: number;
    favoriteVenueId?: string;
    streakDays: number;
  };
  createdAt: string;
}

export interface CrewInvite {
  id: string;
  crewId: string;
  inviterId: string;
  inviteeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sentAt: string;
  respondedAt?: string;
}

export interface CrewNightPlan {
  id: string;
  crewId: string;
  plannerId: string;
  venueId: string;
  eventId?: string;
  date: string;
  time: string;
  description?: string;
  attendingMemberIds: string[];
  status: 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

// Challenges & Rewards
export interface Challenge {
  id: string;
  challengeId: string; // Added for backward compatibility - same as id
  venueId?: string;
  type: 'VISIT_COUNT' | 'SPEND_AMOUNT' | 'STREAK' | 'SOCIAL' | 'EVENT_ATTENDANCE';
  title: string;
  description: string;
  requirements: {
    type: string;
    target: number;
    timeframe?: string; // e.g., "7_DAYS", "30_DAYS", "ALL_TIME"
  };
  reward: {
    type: 'DISCOUNT' | 'FREE_DRINK' | 'VIP_ACCESS' | 'SKIP_LINE' | 'BADGE' | 'POINTS';
    value: any;
    description: string;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'; // Added for status tracking
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
  participantCount: number;
  completedCount: number;
}

export interface ChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  currentProgress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CLAIMED';
  startedAt: string;
  completedAt?: string;
  claimedAt?: string;
}

export interface ChallengeReward {
  id: string;
  userId: string;
  challengeId: string;
  reward: Challenge['reward'];
  isUsed: boolean;
  expiresAt?: string;
  usedAt?: string;
  createdAt: string;
}

// Social Proof & Trending
export interface VenueSocialProof {
  venueId: string;
  friendsPresent: FriendLocation[];
  trendingScore: number; // 0-100
  recentCheckIns: number; // Last hour
  popularityRank?: number; // 1-10 in area
  hypeFactors: {
    type: 'FRIENDS_HERE' | 'TRENDING_UP' | 'EVENT_TONIGHT' | 'CHALLENGE_ACTIVE' | 'HOT_SPOT';
    label: string;
  }[];
}

export interface TrendingVenue {
  venueId: string;
  trendingScore: number;
  trendingReason: string;
  timeframeHours: number; // 1, 6, 24
}

// ===== GROWTH FEATURES: CONTENT & DISCOVERY =====

// Performer type is defined above (lines 18-36)

export interface PerformerPost {
  id: string;
  performerId: string;
  type: 'GIG_ANNOUNCEMENT' | 'BEHIND_SCENES' | 'TRACK_DROP' | 'UPDATE';
  content: {
    text?: string;
    imageUrl?: string;
    videoUrl?: string;
    eventId?: string; // Link to Event
    trackUrl?: string; // Spotify/SoundCloud link
  };
  timestamp: string;
  likes: number;
  likedByUser?: boolean;
}

// Highlight Videos (15-second venue moments)
export interface HighlightVideo {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  venueId: string;
  venueName: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  duration: number; // Max 15 seconds
  expiresAt: string; // 24 hours from creation
  viewCount: number;
  isActive: boolean;
  createdAt: string;
}

// Calendar Filters
export interface CalendarFilter {
  venueIds?: string[];
  performerIds?: string[];
  genres?: string[];
  dateRange: {
    start: string; // ISO date
    end: string; // ISO date
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

// ===== GROWTH FEATURES: MONETIZATION =====

export interface DynamicPricing {
  id: string;
  venueId: string;
  basePrice: number;
  currentPrice: number;
  discountPercentage: number;
  validUntil: string;
  reason: 'SLOW_HOUR' | 'EARLY_BIRD' | 'APP_EXCLUSIVE' | 'HAPPY_HOUR' | 'FLASH_SALE';
  description: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  venueId: string;
  targetDiscount: number; // Percentage
  isActive: boolean;
  createdAt: string;
  notifiedAt?: string;
}

// ===== GROWTH FEATURES: RETENTION =====

export interface Streak {
  id: string;
  userId: string;
  type: 'WEEKEND_WARRIOR' | 'VENUE_LOYALTY' | 'SOCIAL_BUTTERFLY' | 'EVENT_ENTHUSIAST';
  currentStreak: number; // Days or count
  longestStreak: number;
  lastActivityDate: string;
  rewards: {
    milestones: number[]; // e.g., [3, 7, 14, 30]
    nextMilestone?: number;
    currentRewards: StreakReward[];
  };
}

export interface StreakReward {
  type: 'DISCOUNT' | 'FREE_DRINK' | 'VIP_ACCESS' | 'BADGE' | 'POINTS';
  value: any;
  description: string;
  expiresAt?: string;
}

export interface Memory {
  id: string;
  userId: string;
  venueId: string;
  venueName: string;
  date: string;
  type: 'CHECK_IN' | 'VIDEO' | 'PHOTO' | 'MILESTONE' | 'EVENT';
  content: {
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
    eventId?: string;
    friendIds?: string[]; // Tagged friends
  };
  isPrivate: boolean;
  createdAt: string;
}

// ============================================================================
// BUSINESS PROFILES & VENUE MANAGEMENT
// ============================================================================

/**
 * Business Profile - Created by venue owners/managers
 */
export interface BusinessProfile {
  id: string;
  userId: string; // User who created the profile
  venueName: string;
  venueId?: string; // Linked venue after approval
  businessEmail: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  phone?: string;
  website?: string;
  description?: string;
  businessType: 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT' | 'OTHER';
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  verificationToken?: string;
  verificationTokenExpiry?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  documentsSubmitted: boolean;
  documentsApproved: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Venue Role - Permissions for managing a venue
 */
export interface VenueRole {
  id: string;
  venueId: string;
  userId: string;
  role: 'HEAD_MODERATOR' | 'MODERATOR' | 'STAFF' | 'VIEWER';
  permissions: VenuePermission[];
  assignedBy: string;
  assignedAt: string;
  isActive: boolean;
}

/**
 * Venue Permissions
 */
export type VenuePermission =
  | 'EDIT_VENUE_INFO' // Edit name, description, hours
  | 'EDIT_VENUE_DISPLAY' // Edit images, theme, styling
  | 'MANAGE_EVENTS' // Create/edit events
  | 'MANAGE_GUEST_LIST' // Add/remove guests
  | 'MANAGE_TICKETS' // Create/edit tickets
  | 'MANAGE_PRICING' // Set dynamic pricing
  | 'MANAGE_STAFF' // Add/remove moderators
  | 'VIEW_ANALYTICS' // View venue analytics
  | 'MANAGE_CONTENT' // Moderate videos/posts
  | 'MANAGE_CHALLENGES' // Create venue challenges
  | 'FULL_ACCESS'; // All permissions (HEAD_MODERATOR only)

/**
 * Email Verification Token
 */
export interface EmailVerificationToken {
  id: string;
  businessProfileId: string;
  email: string;
  token: string;
  expiresAt: string;
  verifiedAt?: string;
  createdAt: string;
}

/**
 * Venue Edit Request - For displaying what changed
 */
export interface VenueEditRequest {
  id: string;
  venueId: string;
  userId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

/**
 * Business Registration Form Data
 */
export interface BusinessRegistrationData {
  venueName: string;
  businessEmail: string;
  description?: string; // Added for business description
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone?: string;
  website?: string;
  businessType: 'BAR' | 'CLUB' | 'LOUNGE' | 'RESTAURANT' | 'OTHER';
}

// ============================================================================
// FILE UPLOADS
// ============================================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface UploadProgress {
  uploadId: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export type UploadType = 'profile-picture' | 'highlight' | 'memory' | 'venue' | 'business-document';

// ============================================================================
// MODERATION
// ============================================================================

export interface Report {
  id: string;
  reporterId: string;
  contentType: 'video' | 'comment' | 'user' | 'message';
  contentId: string;
  reason: 'inappropriate' | 'spam' | 'harassment' | 'violence' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
  blockedUserImageUrl?: string;
  createdAt: string;
}

export interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  blockedUsers: number;
}

// ============================================================================
// CHAT
// ============================================================================

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImageUrl?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'system';
  reactions?: ChatReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'venue';
  participantIds: string[];
  participants: {
    id: string;
    displayName: string;
    profileImageUrl?: string;
  }[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}
