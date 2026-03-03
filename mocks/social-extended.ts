import {
  Crew,
  CrewInvite,
  CrewNightPlan,
  Challenge,
  ChallengeProgress,
  ChallengeReward,
  VenueSocialProof,
  TrendingVenue,
} from '@/types';

// Mock Crews
export const mockCrews: Crew[] = [
  {
    id: 'crew-1',
    name: 'Night Owls',
    description: 'Late night techno lovers hitting the best underground spots',
    ownerId: 'user-me',
    memberIds: ['user-me', 'user-friend1', 'user-friend2', 'user-friend3'],
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    isPrivate: false,
    stats: {
      totalNightsOut: 23,
      totalSpent: 2450,
      favoriteVenueId: 'venue-2',
      streakDays: 4,
    },
    createdAt: '2025-11-15T20:00:00Z',
  },
  {
    id: 'crew-2',
    name: 'Weekend Warriors',
    description: 'Making the most of every weekend!',
    ownerId: 'user-friend1',
    memberIds: ['user-me', 'user-friend1', 'user-friend4', 'user-friend5', 'user-friend6'],
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    isPrivate: false,
    stats: {
      totalNightsOut: 16,
      totalSpent: 1850,
      favoriteVenueId: 'venue-1',
      streakDays: 2,
    },
    createdAt: '2025-12-01T18:00:00Z',
  },
  {
    id: 'crew-3',
    name: 'VIP Squad',
    description: 'Exclusive events and bottle service only',
    ownerId: 'user-friend2',
    memberIds: ['user-friend2', 'user-friend7', 'user-friend8'],
    imageUrl: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=400',
    isPrivate: true,
    stats: {
      totalNightsOut: 31,
      totalSpent: 8750,
      favoriteVenueId: 'venue-4',
      streakDays: 7,
    },
    createdAt: '2025-10-20T19:00:00Z',
  },
];

// Mock Crew Invites
export const mockCrewInvites: CrewInvite[] = [
  {
    id: 'invite-1',
    crewId: 'crew-1',
    inviterId: 'user-me',
    inviteeId: 'user-friend9',
    status: 'PENDING',
    sentAt: '2026-01-05T14:30:00Z',
  },
  {
    id: 'invite-2',
    crewId: 'crew-2',
    inviterId: 'user-friend1',
    inviteeId: 'user-me',
    status: 'ACCEPTED',
    sentAt: '2025-12-01T10:00:00Z',
    respondedAt: '2025-12-01T12:30:00Z',
  },
];

// Mock Crew Night Plans
export const mockCrewNightPlans: CrewNightPlan[] = [
  {
    id: 'plan-1',
    crewId: 'crew-1',
    plannerId: 'user-me',
    venueId: 'venue-2',
    eventId: 'event-2',
    date: '2026-01-11',
    time: '23:00',
    description: 'Underground Techno Night - Let\'s hit it early!',
    attendingMemberIds: ['user-me', 'user-friend1', 'user-friend3'],
    status: 'CONFIRMED',
    createdAt: '2026-01-03T16:00:00Z',
  },
  {
    id: 'plan-2',
    crewId: 'crew-2',
    plannerId: 'user-friend1',
    venueId: 'venue-1',
    date: '2026-01-17',
    time: '22:00',
    description: 'Saturday night vibes!',
    attendingMemberIds: ['user-friend1', 'user-friend4'],
    status: 'PLANNED',
    createdAt: '2026-01-06T11:00:00Z',
  },
];

// Mock Challenges
export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    challengeId: 'challenge-1',
    venueId: 'venue-1',
    type: 'VISIT_COUNT',
    title: 'Regular Guest',
    description: 'Visit us 5 times this month',
    requirements: {
      type: 'VISITS',
      target: 5,
      timeframe: '30_DAYS',
    },
    reward: {
      type: 'DISCOUNT',
      value: 20,
      description: '20% off your next visit',
    },
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-31T23:59:59Z',
    isActive: true,
    status: 'ACTIVE',
    difficulty: 'EASY',
    participantCount: 234,
    completedCount: 67,
  },
  {
    id: 'challenge-2',
    challengeId: 'challenge-2',
    venueId: 'venue-2',
    type: 'SPEND_AMOUNT',
    title: 'Big Spender',
    description: 'Spend $500 across all visits this month',
    requirements: {
      type: 'SPEND',
      target: 500,
      timeframe: '30_DAYS',
    },
    reward: {
      type: 'VIP_ACCESS',
      value: 'VIP_LOUNGE_ACCESS',
      description: 'Free VIP lounge access for one night',
    },
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-31T23:59:59Z',
    isActive: true,
    status: 'ACTIVE',
    difficulty: 'MEDIUM',
    participantCount: 189,
    completedCount: 34,
  },
  {
    id: 'challenge-3',
    challengeId: 'challenge-3',
    type: 'STREAK',
    title: 'Weekend Warrior',
    description: 'Go out 4 weekends in a row',
    requirements: {
      type: 'WEEKEND_STREAK',
      target: 4,
      timeframe: '30_DAYS',
    },
    reward: {
      type: 'FREE_DRINK',
      value: 3,
      description: '3 free drinks at any venue',
    },
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-31T23:59:59Z',
    isActive: true,
    status: 'ACTIVE',
    difficulty: 'MEDIUM',
    participantCount: 512,
    completedCount: 89,
  },
  {
    id: 'challenge-4',
    challengeId: 'challenge-4',
    venueId: 'venue-3',
    type: 'SOCIAL',
    title: 'Social Butterfly',
    description: 'Bring 10 different friends to the venue',
    requirements: {
      type: 'UNIQUE_FRIENDS',
      target: 10,
      timeframe: 'ALL_TIME',
    },
    reward: {
      type: 'SKIP_LINE',
      value: 'PERMANENT',
      description: 'Permanent skip-the-line access',
    },
    startDate: '2025-12-01T00:00:00Z',
    endDate: '2026-03-31T23:59:59Z',
    isActive: true,
    status: 'ACTIVE',
    difficulty: 'HARD',
    participantCount: 156,
    completedCount: 12,
  },
  {
    id: 'challenge-5',
    challengeId: 'challenge-5',
    type: 'EVENT_ATTENDANCE',
    title: 'Event Enthusiast',
    description: 'Attend 3 ticketed events in January',
    requirements: {
      type: 'EVENT_TICKETS',
      target: 3,
      timeframe: '30_DAYS',
    },
    reward: {
      type: 'BADGE',
      value: 'EVENT_ENTHUSIAST',
      description: 'Special "Event Enthusiast" profile badge',
    },
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-01-31T23:59:59Z',
    isActive: true,
    status: 'ACTIVE',
    difficulty: 'EASY',
    participantCount: 387,
    completedCount: 145,
  },
  {
    id: 'challenge-6',
    challengeId: 'challenge-6',
    venueId: 'venue-4',
    type: 'VISIT_COUNT',
    title: 'Legendary Patron',
    description: 'Visit us 20 times and become a legend',
    requirements: {
      type: 'VISITS',
      target: 20,
      timeframe: 'ALL_TIME',
    },
    reward: {
      type: 'VIP_ACCESS',
      value: 'PERMANENT_VIP',
      description: 'Permanent VIP status with exclusive perks',
    },
    startDate: '2025-11-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
    status: 'ACTIVE',
    difficulty: 'LEGENDARY',
    participantCount: 89,
    completedCount: 5,
  },
];

// Mock Challenge Progress
export const mockChallengeProgress: ChallengeProgress[] = [
  {
    id: 'progress-1',
    userId: 'user-me',
    challengeId: 'challenge-1',
    currentProgress: 3,
    status: 'IN_PROGRESS',
    startedAt: '2026-01-02T20:00:00Z',
  },
  {
    id: 'progress-2',
    userId: 'user-me',
    challengeId: 'challenge-2',
    currentProgress: 275,
    status: 'IN_PROGRESS',
    startedAt: '2026-01-03T22:00:00Z',
  },
  {
    id: 'progress-3',
    userId: 'user-me',
    challengeId: 'challenge-3',
    currentProgress: 2,
    status: 'IN_PROGRESS',
    startedAt: '2025-12-28T21:00:00Z',
  },
  {
    id: 'progress-4',
    userId: 'user-me',
    challengeId: 'challenge-5',
    currentProgress: 2,
    status: 'IN_PROGRESS',
    startedAt: '2026-01-05T18:00:00Z',
  },
];

// Mock Challenge Rewards
export const mockChallengeRewards: ChallengeReward[] = [
  {
    id: 'reward-1',
    userId: 'user-me',
    challengeId: 'challenge-old-1',
    reward: {
      type: 'DISCOUNT',
      value: 15,
      description: '15% off your next visit',
    },
    isUsed: false,
    expiresAt: '2026-02-15T23:59:59Z',
    createdAt: '2025-12-20T15:00:00Z',
  },
];

// Mock Venue Social Proof
export const mockVenueSocialProof: VenueSocialProof[] = [
  {
    venueId: 'venue-1',
    friendsPresent: [], // Will be populated from friend locations
    trendingScore: 85,
    recentCheckIns: 47,
    popularityRank: 2,
    hypeFactors: [
      { type: 'TRENDING_UP', label: 'Trending Up' },
      { type: 'EVENT_TONIGHT', label: 'Special Event Tonight' },
      { type: 'CHALLENGE_ACTIVE', label: 'Active Challenge' },
    ],
  },
  {
    venueId: 'venue-2',
    friendsPresent: [],
    trendingScore: 92,
    recentCheckIns: 68,
    popularityRank: 1,
    hypeFactors: [
      { type: 'HOT_SPOT', label: 'Hot Spot' },
      { type: 'TRENDING_UP', label: 'Trending Up' },
      { type: 'EVENT_TONIGHT', label: 'Underground Night' },
    ],
  },
  {
    venueId: 'venue-3',
    friendsPresent: [],
    trendingScore: 73,
    recentCheckIns: 34,
    popularityRank: 4,
    hypeFactors: [
      { type: 'EVENT_TONIGHT', label: 'Latin Night' },
      { type: 'CHALLENGE_ACTIVE', label: 'Social Challenge' },
    ],
  },
  {
    venueId: 'venue-4',
    friendsPresent: [],
    trendingScore: 79,
    recentCheckIns: 41,
    popularityRank: 3,
    hypeFactors: [
      { type: 'CHALLENGE_ACTIVE', label: 'Legendary Challenge' },
    ],
  },
];

// Mock Trending Venues
export const mockTrendingVenues: TrendingVenue[] = [
  {
    venueId: 'venue-2',
    trendingScore: 92,
    trendingReason: 'Underground Techno Night sold out',
    timeframeHours: 6,
  },
  {
    venueId: 'venue-1',
    trendingScore: 85,
    trendingReason: 'Friday Night House Party gaining momentum',
    timeframeHours: 6,
  },
  {
    venueId: 'venue-4',
    trendingScore: 79,
    trendingReason: 'R&B Saturday drawing crowds',
    timeframeHours: 6,
  },
];

// Helper functions
export function getCrewById(crewId: string): Crew | undefined {
  return mockCrews.find(c => c.id === crewId);
}

export function getUserCrews(userId: string): Crew[] {
  return mockCrews.filter(c => c.memberIds.includes(userId));
}

export function getChallengeProgress(userId: string, challengeId: string): ChallengeProgress | undefined {
  return mockChallengeProgress.find(p => p.userId === userId && p.challengeId === challengeId);
}

export function getActiveChallenges(): Challenge[] {
  const now = new Date();
  return mockChallenges.filter(c => {
    if (!c.isActive) return false;
    const endDate = new Date(c.endDate);
    return endDate > now;
  });
}

export function getChallengesForVenue(venueId: string): Challenge[] {
  return getActiveChallenges().filter(c => c.venueId === venueId);
}

export function getVenueSocialProof(venueId: string): VenueSocialProof | undefined {
  return mockVenueSocialProof.find(sp => sp.venueId === venueId);
}

export function getTrendingVenues(): TrendingVenue[] {
  return mockTrendingVenues.sort((a, b) => b.trendingScore - a.trendingScore);
}
