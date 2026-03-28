import { Streak, Memory } from '@/types';

// Mock Streaks
export const mockStreaks: Streak[] = [
  {
    id: 'streak-1',
    userId: 'user-me',
    type: 'WEEKEND_WARRIOR',
    currentStreak: 3,
    longestStreak: 5,
    lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    rewards: {
      milestones: [3, 5, 10, 20],
      nextMilestone: 5,
      currentRewards: [
        {
          type: 'BADGE',
          value: 'WEEKEND_WARRIOR_BRONZE',
          description: 'Weekend Warrior Bronze Badge',
        },
      ],
    },
  },
  {
    id: 'streak-2',
    userId: 'user-me',
    type: 'VENUE_LOYALTY',
    currentStreak: 7,
    longestStreak: 12,
    lastActivityDate: new Date().toISOString(),
    rewards: {
      milestones: [5, 10, 20, 30],
      nextMilestone: 10,
      currentRewards: [
        {
          type: 'DISCOUNT',
          value: 15,
          description: '15% off your next visit',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        },
        {
          type: 'BADGE',
          value: 'LOYAL_FAN',
          description: 'Loyal Fan Badge',
        },
      ],
    },
  },
  {
    id: 'streak-3',
    userId: 'user-me',
    type: 'SOCIAL_BUTTERFLY',
    currentStreak: 12,
    longestStreak: 15,
    lastActivityDate: new Date().toISOString(),
    rewards: {
      milestones: [5, 10, 15, 25],
      nextMilestone: 15,
      currentRewards: [
        {
          type: 'VIP_ACCESS',
          value: 'SKIP_LINE_PASS',
          description: 'Skip the line at any venue',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        },
      ],
    },
  },
];

// Mock Memories
export const mockMemories: Memory[] = [
  {
    id: 'memory-1',
    userId: 'user-me',
    venueId: 'venue-2',
    venueName: 'The Basement',
    date: '2026-01-04',
    type: 'VIDEO',
    content: {
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      caption: 'Epic night with the crew! 🔥',
      friendIds: ['user-friend1', 'user-friend2'],
    },
    isPrivate: false,
    createdAt: '2026-01-04T23:45:00Z',
  },
  {
    id: 'memory-2',
    userId: 'user-me',
    venueId: 'venue-1',
    venueName: 'Neon Nights',
    date: '2026-01-01',
    type: 'EVENT',
    content: {
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      caption: 'New Year\'s celebration!',
      eventId: 'event-1',
      friendIds: ['user-friend1', 'user-friend3', 'user-friend4'],
    },
    isPrivate: false,
    createdAt: '2026-01-02T01:30:00Z',
  },
  {
    id: 'memory-3',
    userId: 'user-me',
    venueId: 'venue-3',
    venueName: 'The Rooftop',
    date: '2025-12-28',
    type: 'PHOTO',
    content: {
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      caption: 'Sunset vibes 🌅',
    },
    isPrivate: false,
    createdAt: '2025-12-28T20:15:00Z',
  },
  {
    id: 'memory-4',
    userId: 'user-me',
    venueId: 'venue-2',
    venueName: 'The Basement',
    date: '2025-12-15',
    type: 'MILESTONE',
    content: {
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      caption: '10th visit to The Basement! 🎉',
    },
    isPrivate: false,
    createdAt: '2025-12-15T22:00:00Z',
  },
  {
    id: 'memory-5',
    userId: 'user-me',
    venueId: 'venue-4',
    venueName: 'Studio 54',
    date: '2025-12-01',
    type: 'CHECK_IN',
    content: {
      imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600',
      caption: 'First time at Studio 54!',
      friendIds: ['user-friend5'],
    },
    isPrivate: false,
    createdAt: '2025-12-01T21:30:00Z',
  },
];

// Helper Functions
export function getUserStreaks(userId: string): Streak[] {
  return mockStreaks.filter(streak => streak.userId === userId);
}

export function getActiveStreaks(userId: string): Streak[] {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  return mockStreaks.filter(streak => {
    const lastActivity = new Date(streak.lastActivityDate);
    return streak.userId === userId && lastActivity >= twoDaysAgo;
  });
}

export function getUserMemories(userId: string): Memory[] {
  return mockMemories
    .filter(memory => memory.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMemoriesByVenue(userId: string, venueId: string): Memory[] {
  return mockMemories
    .filter(memory => memory.userId === userId && memory.venueId === venueId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMemoryTimeline(userId: string, limit?: number): Memory[] {
  const memories = getUserMemories(userId);
  return limit ? memories.slice(0, limit) : memories;
}
