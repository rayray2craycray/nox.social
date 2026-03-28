import { Performer, PerformerPost, HighlightVideo } from '@/types';

// Mock Performers
export const mockPerformers: Performer[] = [
  {
    id: 'performer-1',
    name: 'Marcus Silva',
    stageName: 'DJ Nova',
    bio: 'House & Techno DJ spinning the best underground sounds',
    genres: ['House', 'Techno', 'Electronic'],
    imageUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400',
    followerCount: 12450,
    followersCount: 12450,
    totalRevenueGenerated: 85000,
    baseCity: 'Los Angeles',
    epkVideoUrl: 'https://example.com/djnova-epk',
    verified: true,
    socialLinks: {
      instagram: '@djnova',
      spotify: 'djnova',
      soundcloud: 'djnova',
    },
  },
  {
    id: 'performer-2',
    name: 'Sarah Chen',
    stageName: 'Luna Beats',
    bio: 'Progressive House • Melodic Techno • Peak Time Vibes',
    genres: ['Progressive House', 'Melodic Techno'],
    imageUrl: 'https://images.unsplash.com/photo-1598387181032-a3103a2db5b3?w=400',
    followerCount: 8920,
    followersCount: 8920,
    totalRevenueGenerated: 62000,
    baseCity: 'Miami',
    epkVideoUrl: 'https://example.com/lunabeats-epk',
    verified: true,
    socialLinks: {
      instagram: '@lunabeats',
      spotify: 'lunabeats',
    },
  },
  {
    id: 'performer-3',
    name: 'James Rodriguez',
    stageName: 'Vibe Tribe',
    bio: 'Reggaeton & Latin House fusion',
    genres: ['Reggaeton', 'Latin', 'House'],
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    followerCount: 15300,
    followersCount: 15300,
    totalRevenueGenerated: 120000,
    baseCity: 'New York',
    epkVideoUrl: 'https://example.com/vibetribe-epk',
    verified: true,
    socialLinks: {
      instagram: '@vibetribe',
      spotify: 'vibetribe',
    },
  },
  {
    id: 'performer-4',
    name: 'Emma Washington',
    stageName: 'DJ Ember',
    bio: 'Deep House & Nu-Disco curator',
    genres: ['Deep House', 'Nu-Disco', 'Funk'],
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
    followerCount: 6780,
    followersCount: 6780,
    totalRevenueGenerated: 45000,
    baseCity: 'Chicago',
    epkVideoUrl: 'https://example.com/djember-epk',
    verified: false,
    socialLinks: {
      instagram: '@djember',
      soundcloud: 'djember',
    },
  },
];

// Mock Performer Posts
export const mockPerformerPosts: PerformerPost[] = [
  {
    id: 'post-1',
    performerId: 'performer-1',
    type: 'GIG_ANNOUNCEMENT',
    content: {
      text: 'THIS SATURDAY! Bringing my new underground set to The Basement. Doors at 11pm. Early bird tickets available now! 🔥',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      eventId: 'event-2',
    },
    timestamp: '2026-01-05T14:30:00Z',
    likes: 342,
    likedByUser: false,
  },
  {
    id: 'post-2',
    performerId: 'performer-2',
    type: 'TRACK_DROP',
    content: {
      text: 'New track "Midnight Drive" out now on all platforms! Been working on this one for months. Link in bio 🎵',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600',
      trackUrl: 'https://open.spotify.com/track/example',
    },
    timestamp: '2026-01-04T18:00:00Z',
    likes: 589,
    likedByUser: true,
  },
  {
    id: 'post-3',
    performerId: 'performer-3',
    type: 'BEHIND_SCENES',
    content: {
      text: 'Studio vibes today. Working on something special for next weekend\'s show at The Rooftop 🎹',
      videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    },
    timestamp: '2026-01-03T20:15:00Z',
    likes: 234,
    likedByUser: false,
  },
  {
    id: 'post-4',
    performerId: 'performer-1',
    type: 'UPDATE',
    content: {
      text: 'Thank you NYC for an incredible night! Over 500 of you came out and made it unforgettable. Can\'t wait to be back! 🙏',
      imageUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600',
    },
    timestamp: '2026-01-02T10:30:00Z',
    likes: 892,
    likedByUser: true,
  },
  {
    id: 'post-5',
    performerId: 'performer-4',
    type: 'GIG_ANNOUNCEMENT',
    content: {
      text: 'Excited to announce my residency at Neon Nights! Every Friday starting next month. Let\'s make it legendary! 💫',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      eventId: 'event-1',
    },
    timestamp: '2026-01-01T16:45:00Z',
    likes: 445,
    likedByUser: false,
  },
];

// Mock Highlight Videos
export const mockHighlightVideos: HighlightVideo[] = [
  {
    id: 'highlight-1',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    venueId: 'venue-2',
    venueName: 'The Basement',
    userId: 'user-friend1',
    userName: 'Alex Turner',
    userAvatar: 'https://i.pravatar.cc/150?img=12',
    duration: 14,
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
    viewCount: 342,
    isActive: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: 'highlight-2',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400',
    venueId: 'venue-1',
    venueName: 'Neon Nights',
    userId: 'user-friend2',
    userName: 'Jessica Park',
    userAvatar: 'https://i.pravatar.cc/150?img=45',
    duration: 15,
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // 22 hours from now
    viewCount: 567,
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'highlight-3',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
    venueId: 'venue-3',
    venueName: 'The Rooftop',
    userId: 'user-friend3',
    userName: 'Mike Chen',
    userAvatar: 'https://i.pravatar.cc/150?img=33',
    duration: 12,
    expiresAt: new Date(Date.now() + 15 * 60 * 60 * 1000).toISOString(), // 15 hours from now
    viewCount: 189,
    isActive: true,
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // 9 hours ago
  },
  {
    id: 'highlight-4',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400',
    venueId: 'venue-4',
    venueName: 'Studio 54',
    userId: 'user-me',
    userName: 'You',
    userAvatar: 'https://i.pravatar.cc/150?img=68',
    duration: 13,
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // 20 hours from now
    viewCount: 423,
    isActive: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
];

// Helper Functions
export function getPerformerById(performerId: string): Performer | undefined {
  return mockPerformers.find(p => p.id === performerId);
}

export function getPerformerPosts(performerId: string): PerformerPost[] {
  return mockPerformerPosts
    .filter(post => post.performerId === performerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getFeedPosts(): PerformerPost[] {
  // Get all posts sorted by timestamp
  return mockPerformerPosts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getActiveHighlights(): HighlightVideo[] {
  const now = new Date();
  return mockHighlightVideos
    .filter(highlight => {
      const expiresAt = new Date(highlight.expiresAt);
      return highlight.isActive && expiresAt > now;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getVenueHighlights(venueId: string): HighlightVideo[] {
  return getActiveHighlights().filter(h => h.venueId === venueId);
}

export function getFollowedPerformers(userFollowingIds: string[]): Performer[] {
  // In a real app, this would filter based on user's followed performers
  // For now, return all performers
  return mockPerformers;
}
