/**
 * Videos Service
 * Handles all video feed related API calls
 */

import { api } from './api';
import type { VibeVideo } from '@/types';

// FeedVideo is an alias for VibeVideo in the feed context
type FeedVideo = VibeVideo;

export const videosService = {
  async getFeedVideos(filter?: 'nearby' | 'following'): Promise<FeedVideo[]> {
    const endpoint = filter ? `/videos/feed?filter=${filter}` : '/videos/feed';
    return api.get<FeedVideo[]>(endpoint);
  },

  async getVenueVideos(venueId: string): Promise<FeedVideo[]> {
    return api.get<FeedVideo[]>(`/venues/${venueId}/videos`);
  },

  async uploadVideo(videoData: FormData): Promise<{ videoId: string; url: string }> {
    return api.post<{ videoId: string; url: string }>('/videos/upload', videoData);
  },

  async likeVideo(videoId: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(`/videos/${videoId}/like`);
  },

  async unlikeVideo(videoId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/videos/${videoId}/like`);
  },
};
