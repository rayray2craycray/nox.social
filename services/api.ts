/**
 * API Service Layer
 * Centralizes all API calls and abstracts data fetching logic
 * Makes it easy to swap mock data for real API calls
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '@/constants/app';
import { API_BASE_URL, API_ENDPOINTS } from './config';
import type {
  GroupPurchase,
  Referral,
  Event,
  Ticket,
  GuestListEntry,
  Crew,
  Challenge,
  Performer,
  PerformerPost,
  HighlightVideo,
  DynamicPricing,
  PriceAlert,
  Streak,
  Memory,
} from '../types';

// ============================================================================
// BASE API CLIENT
// ============================================================================

interface RequestConfig extends RequestInit {
  timeout?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base API client with timeout, retry logic, and error handling
 */
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API.REQUEST_TIMEOUT_MS) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
    this.loadAuthToken();
  }

  /**
   * Load authentication token from AsyncStorage
   */
  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  /**
   * Set authentication token
   */
  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem('authToken', token);
  }

  /**
   * Clear authentication token
   */
  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('authToken');
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestConfig = {}
  ): Promise<Response> {
    const { timeout = this.defaultTimeout, ...fetchConfig } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      throw error;
    }
  }

  private async retryFetch(
    url: string,
    config: RequestConfig = {},
    retries: number = API.MAX_RETRIES
  ): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, config);

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, API.RETRY_DELAY_MS * (attempt + 1))
          );
          continue;
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, API.RETRY_DELAY_MS * (attempt + 1))
          );
        }
      }
    }

    throw lastError || new ApiError('Max retries exceeded');
  }

  /**
   * Extract error message from API response
   */
  private async extractErrorMessage(response: Response, defaultMessage: string): Promise<string> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return errorData.error || errorData.message || defaultMessage;
      }
      const text = await response.text();
      return text || defaultMessage;
    } catch {
      return defaultMessage;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('[ApiClient] GET request:', url);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await this.retryFetch(url, {
      ...config,
      method: 'GET',
      headers,
    });

    console.log('[ApiClient] GET response status:', response.status, 'for', url);

    if (!response.ok) {
      throw new ApiError(
        `GET ${endpoint} failed: ${response.statusText}`,
        response.status,
        response
      );
    }

    const data = await response.json();
    console.log('[ApiClient] GET response data:', data);
    return data;
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('[ApiClient] POST request:', url, 'with data:', data);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await this.retryFetch(url, {
      ...config,
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log('[ApiClient] POST response status:', response.status, 'for', url);

    if (!response.ok) {
      const errorMessage = await this.extractErrorMessage(
        response.clone(),
        `POST ${endpoint} failed: ${response.statusText}`
      );
      console.log('[ApiClient] POST error:', errorMessage);
      throw new ApiError(errorMessage, response.status, response);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await this.retryFetch(url, {
      ...config,
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorMessage = await this.extractErrorMessage(
        response.clone(),
        `PUT ${endpoint} failed: ${response.statusText}`
      );
      throw new ApiError(errorMessage, response.status, response);
    }

    return response.json();
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await this.retryFetch(url, {
      ...config,
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorMessage = await this.extractErrorMessage(
        response.clone(),
        `PATCH ${endpoint} failed: ${response.statusText}`
      );
      throw new ApiError(errorMessage, response.status, response);
    }

    return response.json();
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await this.retryFetch(url, {
      ...config,
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new ApiError(
        `DELETE ${endpoint} failed: ${response.statusText}`,
        response.status,
        response
      );
    }

    return response.json();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export { apiClient, ApiClient, ApiError };

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) => apiClient.get<T>(endpoint, config),
  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => apiClient.post<T>(endpoint, data, config),
  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => apiClient.put<T>(endpoint, data, config),
  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => apiClient.patch<T>(endpoint, data, config),
  delete: <T>(endpoint: string, config?: RequestConfig) => apiClient.delete<T>(endpoint, config),
};

// ============================================================================
// SOCIAL SYNC API METHODS
// ============================================================================

export interface ContactSyncRequest {
  phoneNumbers: string[]; // Hashed phone numbers
  userId: string;
}

export interface ContactSyncResponse {
  matches: Array<{
    hashedPhone: string;
    userId: string;
    displayName: string;
    avatarUrl: string;
  }>;
  totalMatches: number;
}

export interface InstagramSyncRequest {
  accessToken: string;
  userId: string;
}

export interface InstagramSyncResponse {
  matches: Array<{
    instagramId: string;
    instagramUsername: string;
    userId: string;
    displayName: string;
    avatarUrl: string;
  }>;
  totalMatches: number;
}

/**
 * Sync phone contacts with backend to find matches
 * Backend will hash the phone numbers and compare with user database
 */
export async function syncContacts(request: ContactSyncRequest): Promise<ContactSyncResponse> {
  return apiClient.post<ContactSyncResponse>('/social/sync/contacts', request);
}

/**
 * Sync Instagram following with backend to find matches
 * Backend will fetch following list from Instagram API and match with users
 */
export async function syncInstagram(request: InstagramSyncRequest): Promise<InstagramSyncResponse> {
  return apiClient.post<InstagramSyncResponse>('/social/sync/instagram', request);
}

/**
 * Exchange Instagram authorization code for access token
 */
export async function exchangeInstagramCode(code: string): Promise<{
  accessToken: string;
  userId: string;
  username: string;
}> {
  return apiClient.post('/auth/instagram/token', { code });
}

// ============================================================================
// GROWTH FEATURES API METHODS
// ============================================================================

// Phase 1: Growth - Group Purchases & Referrals
export const growthApi = {
  // Group Purchases
  createGroupPurchase: async (data: {
    initiatorId: string;
    venueId: string;
    eventId?: string;
    ticketType: 'ENTRY' | 'TABLE' | 'BOTTLE_SERVICE';
    totalAmount: number;
    maxParticipants: number;
    expiresAt: string;
  }): Promise<ApiResponse<GroupPurchase>> => {
    return apiClient.post<ApiResponse<GroupPurchase>>(
      API_ENDPOINTS.growth.groupPurchases.create,
      data
    );
  },

  getGroupPurchasesByVenue: async (
    venueId: string
  ): Promise<ApiResponse<GroupPurchase[]>> => {
    return apiClient.get<ApiResponse<GroupPurchase[]>>(
      API_ENDPOINTS.growth.groupPurchases.venue(venueId)
    );
  },

  getGroupPurchasesByUser: async (
    userId: string
  ): Promise<ApiResponse<GroupPurchase[]>> => {
    return apiClient.get<ApiResponse<GroupPurchase[]>>(
      API_ENDPOINTS.growth.groupPurchases.user(userId)
    );
  },

  joinGroupPurchase: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<GroupPurchase>> => {
    return apiClient.post<ApiResponse<GroupPurchase>>(
      API_ENDPOINTS.growth.groupPurchases.join(id),
      { userId }
    );
  },

  completeGroupPurchase: async (
    id: string
  ): Promise<ApiResponse<GroupPurchase>> => {
    return apiClient.post<ApiResponse<GroupPurchase>>(
      API_ENDPOINTS.growth.groupPurchases.complete(id)
    );
  },

  // Referrals
  generateReferralCode: async (
    userId: string
  ): Promise<ApiResponse<Referral>> => {
    return apiClient.post<ApiResponse<Referral>>(API_ENDPOINTS.growth.referrals.generate, {
      userId,
    });
  },

  applyReferralCode: async (
    code: string,
    userId: string
  ): Promise<ApiResponse<Referral>> => {
    return apiClient.post<ApiResponse<Referral>>(API_ENDPOINTS.growth.referrals.apply, {
      referralCode: code,
      userId,
    });
  },

  getReferralStats: async (userId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.growth.referrals.stats(userId));
  },

  getReferralRewards: async (userId: string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.growth.referrals.rewards(userId));
  },
};

// Phase 2: Events & Ticketing
export const eventsApi = {
  // Events
  getEvents: async (filters?: {
    venueId?: string;
    performerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Event[]>> => {
    const params = new URLSearchParams(filters as any);
    return apiClient.get<ApiResponse<Event[]>>(
      `${API_ENDPOINTS.events.list}?${params.toString()}`
    );
  },

  getUpcomingEvents: async (): Promise<ApiResponse<Event[]>> => {
    return apiClient.get<ApiResponse<Event[]>>(API_ENDPOINTS.events.upcoming);
  },

  getEventDetails: async (id: string): Promise<ApiResponse<Event>> => {
    return apiClient.get<ApiResponse<Event>>(API_ENDPOINTS.events.detail(id));
  },

  getEventsByVenue: async (venueId: string): Promise<ApiResponse<Event[]>> => {
    return apiClient.get<ApiResponse<Event[]>>(API_ENDPOINTS.events.venue(venueId));
  },

  getEventsByPerformer: async (
    performerId: string
  ): Promise<ApiResponse<Event[]>> => {
    return apiClient.get<ApiResponse<Event[]>>(API_ENDPOINTS.events.performer(performerId));
  },

  // Tickets
  purchaseTicket: async (data: {
    eventId: string;
    userId: string;
    tierId: string;
    quantity?: number;
  }): Promise<ApiResponse<Ticket>> => {
    return apiClient.post<ApiResponse<Ticket>>(
      API_ENDPOINTS.events.tickets.purchase,
      data
    );
  },

  getUserTickets: async (userId: string): Promise<ApiResponse<Ticket[]>> => {
    return apiClient.get<ApiResponse<Ticket[]>>(API_ENDPOINTS.events.tickets.user(userId));
  },

  transferTicket: async (
    id: string,
    toUserId: string
  ): Promise<ApiResponse<Ticket>> => {
    return apiClient.post<ApiResponse<Ticket>>(API_ENDPOINTS.events.tickets.transfer(id), {
      toUserId,
    });
  },

  validateTicket: async (
    qrCode: string
  ): Promise<ApiResponse<{ valid: boolean; ticket?: Ticket }>> => {
    return apiClient.post<ApiResponse<{ valid: boolean; ticket?: Ticket }>>(
      API_ENDPOINTS.events.tickets.validate,
      { qrCode }
    );
  },

  checkInTicket: async (id: string): Promise<ApiResponse<Ticket>> => {
    return apiClient.post<ApiResponse<Ticket>>(API_ENDPOINTS.events.tickets.checkIn(id));
  },

  // Guest List
  addToGuestList: async (data: {
    venueId: string;
    eventId?: string;
    guestName: string;
    guestPhone?: string;
    addedBy: string;
    plusOnes?: number;
    listType?: 'STANDARD' | 'VIP' | 'MEDIA';
  }): Promise<ApiResponse<GuestListEntry>> => {
    return apiClient.post<ApiResponse<GuestListEntry>>(
      API_ENDPOINTS.events.guestList.add,
      data
    );
  },

  getVenueGuestList: async (
    venueId: string
  ): Promise<ApiResponse<GuestListEntry[]>> => {
    return apiClient.get<ApiResponse<GuestListEntry[]>>(
      API_ENDPOINTS.events.guestList.venue(venueId)
    );
  },

  getEventGuestList: async (
    eventId: string
  ): Promise<ApiResponse<GuestListEntry[]>> => {
    return apiClient.get<ApiResponse<GuestListEntry[]>>(
      API_ENDPOINTS.events.guestList.event(eventId)
    );
  },

  checkGuestList: async (data: {
    venueId: string;
    guestName: string;
    eventId?: string;
  }): Promise<ApiResponse<{ onList: boolean; entry?: GuestListEntry }>> => {
    return apiClient.post<ApiResponse<{ onList: boolean; entry?: GuestListEntry }>>(
      API_ENDPOINTS.events.guestList.check,
      data
    );
  },

  checkInGuest: async (id: string): Promise<ApiResponse<GuestListEntry>> => {
    return apiClient.post<ApiResponse<GuestListEntry>>(
      API_ENDPOINTS.events.guestList.checkIn(id)
    );
  },

  cancelGuestListEntry: async (
    id: string
  ): Promise<ApiResponse<GuestListEntry>> => {
    return apiClient.post<ApiResponse<GuestListEntry>>(
      API_ENDPOINTS.events.guestList.cancel(id)
    );
  },
};

// Phase 3: Social - Crews & Challenges
export const socialApi = {
  // Crews
  createCrew: async (data: {
    name: string;
    ownerId: string;
    description?: string;
    isPrivate?: boolean;
  }): Promise<ApiResponse<Crew>> => {
    return apiClient.post<ApiResponse<Crew>>(API_ENDPOINTS.social.crews.create, data);
  },

  getCrewDetails: async (id: string): Promise<ApiResponse<Crew>> => {
    return apiClient.get<ApiResponse<Crew>>(API_ENDPOINTS.social.crews.detail(id));
  },

  getUserCrews: async (userId: string): Promise<ApiResponse<Crew[]>> => {
    return apiClient.get<ApiResponse<Crew[]>>(API_ENDPOINTS.social.crews.user(userId));
  },

  searchCrews: async (query: string): Promise<ApiResponse<Crew[]>> => {
    return apiClient.get<ApiResponse<Crew[]>>(
      `${API_ENDPOINTS.social.crews.search}?q=${encodeURIComponent(query)}`
    );
  },

  getActiveCrews: async (): Promise<ApiResponse<Crew[]>> => {
    return apiClient.get<ApiResponse<Crew[]>>(API_ENDPOINTS.social.crews.active);
  },

  addCrewMember: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<Crew>> => {
    return apiClient.post<ApiResponse<Crew>>(API_ENDPOINTS.social.crews.addMember(id), {
      userId,
    });
  },

  removeCrewMember: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<Crew>> => {
    return apiClient.delete<ApiResponse<Crew>>(
      API_ENDPOINTS.social.crews.removeMember(id, userId)
    );
  },

  // Challenges
  getActiveChallenges: async (): Promise<ApiResponse<Challenge[]>> => {
    return apiClient.get<ApiResponse<Challenge[]>>(API_ENDPOINTS.social.challenges.active);
  },

  getChallengeDetails: async (id: string): Promise<ApiResponse<Challenge>> => {
    return apiClient.get<ApiResponse<Challenge>>(API_ENDPOINTS.social.challenges.detail(id));
  },

  getUserChallenges: async (
    userId: string
  ): Promise<ApiResponse<Challenge[]>> => {
    return apiClient.get<ApiResponse<Challenge[]>>(
      API_ENDPOINTS.social.challenges.user(userId)
    );
  },

  joinChallenge: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.social.challenges.join(id), {
      userId,
    });
  },

  getChallengeProgress: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.get<ApiResponse<any>>(API_ENDPOINTS.social.challenges.progress(id));
  },

  updateChallengeProgress: async (
    challengeId: string,
    userId: string,
    incrementBy: number
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.social.challenges.userProgress(challengeId, userId),
      { incrementBy }
    );
  },

  claimChallengeReward: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.social.challenges.claim(id), {
      userId,
    });
  },

  // Contact & Instagram Sync (existing features)
  syncContacts: async (data: {
    userId: string;
    contacts: Array<{ name: string; phoneNumber: string }>;
  }): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.social.sync.contacts, data);
  },

  syncInstagram: async (data: {
    userId: string;
    instagramToken: string;
  }): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.social.sync.instagram, data);
  },
};

// Phase 4: Content - Performers & Highlights
export const contentApi = {
  // Performers
  searchPerformers: async (query: string): Promise<ApiResponse<Performer[]>> => {
    return apiClient.get<ApiResponse<Performer[]>>(
      `${API_ENDPOINTS.content.performers.search}?q=${encodeURIComponent(query)}`
    );
  },

  getPerformersByGenre: async (
    genre: string
  ): Promise<ApiResponse<Performer[]>> => {
    return apiClient.get<ApiResponse<Performer[]>>(
      API_ENDPOINTS.content.performers.genre(genre)
    );
  },

  getTrendingPerformers: async (): Promise<ApiResponse<Performer[]>> => {
    return apiClient.get<ApiResponse<Performer[]>>(
      API_ENDPOINTS.content.performers.trending
    );
  },

  getPerformerDetails: async (id: string): Promise<ApiResponse<Performer>> => {
    return apiClient.get<ApiResponse<Performer>>(API_ENDPOINTS.content.performers.detail(id));
  },

  followPerformer: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.content.performers.follow(id), {
      userId,
    });
  },

  unfollowPerformer: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.content.performers.unfollow(id), {
      userId,
    });
  },

  getPerformerPosts: async (
    id: string
  ): Promise<ApiResponse<PerformerPost[]>> => {
    return apiClient.get<ApiResponse<PerformerPost[]>>(
      API_ENDPOINTS.content.performers.posts(id)
    );
  },

  getPerformerFeed: async (
    userId: string
  ): Promise<ApiResponse<PerformerPost[]>> => {
    return apiClient.get<ApiResponse<PerformerPost[]>>(
      API_ENDPOINTS.content.performers.feed(userId)
    );
  },

  likePerformerPost: async (
    performerId: string,
    postId: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.content.performers.likePost(performerId, postId),
      { userId }
    );
  },

  // Alias for ContentContext compatibility
  likePost: async (
    postId: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    // This is a simplified version - in real usage, performerId should be passed
    // For now, we'll let the context handle the performerId lookup
    return apiClient.post<ApiResponse<any>>(
      `/api/content/posts/${postId}/like`,
      { userId }
    );
  },

  unlikePost: async (
    postId: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(
      `/api/content/posts/${postId}/unlike`,
      { userId }
    );
  },

  // Highlights
  uploadHighlight: async (data: {
    videoUrl: string;
    thumbnailUrl: string;
    venueId: string;
    userId: string;
    duration: number;
    eventId?: string;
  }): Promise<ApiResponse<HighlightVideo>> => {
    return apiClient.post<ApiResponse<HighlightVideo>>(
      API_ENDPOINTS.content.highlights.upload,
      data
    );
  },

  getVenueHighlights: async (
    venueId: string
  ): Promise<ApiResponse<HighlightVideo[]>> => {
    return apiClient.get<ApiResponse<HighlightVideo[]>>(
      API_ENDPOINTS.content.highlights.venue(venueId)
    );
  },

  getEventHighlights: async (
    eventId: string
  ): Promise<ApiResponse<HighlightVideo[]>> => {
    return apiClient.get<ApiResponse<HighlightVideo[]>>(
      API_ENDPOINTS.content.highlights.event(eventId)
    );
  },

  getUserHighlights: async (
    userId: string
  ): Promise<ApiResponse<HighlightVideo[]>> => {
    return apiClient.get<ApiResponse<HighlightVideo[]>>(
      API_ENDPOINTS.content.highlights.user(userId)
    );
  },

  getTrendingHighlights: async (): Promise<
    ApiResponse<HighlightVideo[]>
  > => {
    return apiClient.get<ApiResponse<HighlightVideo[]>>(
      API_ENDPOINTS.content.highlights.trending
    );
  },

  getHighlightsFeed: async (
    userId: string
  ): Promise<ApiResponse<HighlightVideo[]>> => {
    return apiClient.get<ApiResponse<HighlightVideo[]>>(
      API_ENDPOINTS.content.highlights.feed(userId)
    );
  },

  viewHighlight: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.content.highlights.view(id));
  },

  likeHighlight: async (
    id: string,
    userId: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.content.highlights.like(id), {
      userId,
    });
  },

  // Get all active highlights (not expired)
  getActiveHighlights: async (): Promise<ApiResponse<HighlightVideo[]>> => {
    return apiClient.get<ApiResponse<HighlightVideo[]>>(
      API_ENDPOINTS.content.highlights.trending // Use trending endpoint or create new one
    );
  },

  // Alias for viewHighlight - used by ContentContext as incrementHighlightViews
  incrementHighlightViews: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.content.highlights.view(id));
  },
};

// Helper function to generate description from reason
function getDescriptionForReason(reason: string, discountPercentage: number): string {
  const descriptions: Record<string, string> = {
    'SLOW_HOUR': 'Fewer people out right now - perfect time to visit!',
    'EARLY_BIRD': 'Arrive early and save big!',
    'APP_EXCLUSIVE': 'Special discount for app users only',
    'HAPPY_HOUR': 'Happy hour special pricing',
    'FLASH_SALE': `Flash sale! ${discountPercentage}% off for limited time`,
    'HIGH_DEMAND': 'High demand pricing',
    'PEAK_HOUR': 'Peak hour pricing',
    'SPECIAL_EVENT': 'Special event pricing',
    'DEFAULT': 'Special pricing available',
  };
  return descriptions[reason] || descriptions['DEFAULT'];
}

// Phase 5: Monetization - Dynamic Pricing
export const pricingApi = {
  // Dynamic Pricing
  getCurrentPricing: async (
    venueId: string
  ): Promise<ApiResponse<DynamicPricing>> => {
    return apiClient.get<ApiResponse<DynamicPricing>>(
      API_ENDPOINTS.pricing.dynamic.current(venueId)
    );
  },

  calculateDynamicPrice: async (data: {
    venueId: string;
    basePrice: number;
    occupancyPercentage: number;
    dayOfWeek: number;
    hour: number;
  }): Promise<ApiResponse<DynamicPricing>> => {
    return apiClient.post<ApiResponse<DynamicPricing>>(
      API_ENDPOINTS.pricing.dynamic.calculate,
      data
    );
  },

  getPricingHistory: async (
    venueId: string,
    days?: number
  ): Promise<ApiResponse<DynamicPricing[]>> => {
    return apiClient.get<ApiResponse<DynamicPricing[]>>(
      `${API_ENDPOINTS.pricing.dynamic.history(venueId)}?days=${days || 7}`
    );
  },

  // Price Alerts
  createPriceAlert: async (data: {
    userId: string;
    venueId: string;
    targetDiscount: number;
    eventId?: string;
  }): Promise<ApiResponse<PriceAlert>> => {
    return apiClient.post<ApiResponse<PriceAlert>>(
      API_ENDPOINTS.pricing.alerts.create,
      data
    );
  },

  getUserPriceAlerts: async (
    userId: string
  ): Promise<ApiResponse<PriceAlert[]>> => {
    return apiClient.get<ApiResponse<PriceAlert[]>>(
      API_ENDPOINTS.pricing.alerts.user(userId)
    );
  },

  getVenuePriceAlerts: async (
    venueId: string
  ): Promise<ApiResponse<PriceAlert[]>> => {
    return apiClient.get<ApiResponse<PriceAlert[]>>(
      API_ENDPOINTS.pricing.alerts.venue(venueId)
    );
  },

  updatePriceAlert: async (
    id: string,
    data: { targetDiscount?: number; isActive?: boolean }
  ): Promise<ApiResponse<PriceAlert>> => {
    return apiClient.patch<ApiResponse<PriceAlert>>(
      API_ENDPOINTS.pricing.alerts.update(id),
      data
    );
  },

  deactivatePriceAlert: async (id: string): Promise<ApiResponse<PriceAlert>> => {
    return apiClient.post<ApiResponse<PriceAlert>>(
      API_ENDPOINTS.pricing.alerts.deactivate(id)
    );
  },

  deletePriceAlert: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(API_ENDPOINTS.pricing.alerts.delete(id));
  },

  // Get all active pricing across all venues
  getAllActivePricing: async (): Promise<ApiResponse<DynamicPricing[]>> => {
    // For now, fetch pricing for known venue IDs
    // TODO: Create a backend endpoint to fetch all active pricing
    const venueIds = ['venue-1', 'venue-2', 'venue-3', 'venue-4', 'venue-5'];
    const pricingPromises = venueIds.map(async (venueId) => {
      try {
        const response = await pricingApi.getCurrentPricing(venueId);
        if (response.success && response.data) {
          // Transform backend data to match frontend type
          const data = response.data as any;
          return {
            id: data._id || data.id,
            venueId: data.venueId,
            basePrice: data.basePrice,
            currentPrice: data.currentPrice,
            discountPercentage: data.discountPercentage,
            validUntil: data.validUntil,
            reason: data.reason,
            description: getDescriptionForReason(data.reason, data.discountPercentage),
          } as DynamicPricing;
        }
        return null;
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(pricingPromises);
    const pricing = results.filter((p): p is DynamicPricing => p !== null);

    return { success: true, data: pricing };
  },
};

// Phase 6: Retention - Streaks & Memories
export const retentionApi = {
  // Streaks
  getUserStreaks: async (userId: string): Promise<ApiResponse<Streak[]>> => {
    return apiClient.get<ApiResponse<Streak[]>>(
      API_ENDPOINTS.retention.streaks.user(userId)
    );
  },

  incrementStreak: async (
    id: string,
    activityType: string
  ): Promise<ApiResponse<Streak>> => {
    return apiClient.post<ApiResponse<Streak>>(
      API_ENDPOINTS.retention.streaks.increment(id),
      { activityType }
    );
  },

  claimStreakMilestone: async (
    id: string,
    milestone: number
  ): Promise<ApiResponse<Streak>> => {
    return apiClient.post<ApiResponse<Streak>>(
      API_ENDPOINTS.retention.streaks.claimMilestone(id, milestone)
    );
  },

  getStreakLeaderboard: async (
    type: string
  ): Promise<ApiResponse<any[]>> => {
    return apiClient.get<ApiResponse<any[]>>(
      API_ENDPOINTS.retention.streaks.leaderboard(type)
    );
  },

  getStreaksAtRisk: async (): Promise<ApiResponse<Streak[]>> => {
    return apiClient.get<ApiResponse<Streak[]>>(API_ENDPOINTS.retention.streaks.atRisk);
  },

  // Memories
  createMemory: async (data: {
    userId: string;
    venueId: string;
    date: string;
    type: 'CHECK_IN' | 'VIDEO' | 'PHOTO' | 'MILESTONE' | 'EVENT';
    content: {
      imageUrl?: string;
      videoUrl?: string;
      caption?: string;
    };
    isPrivate?: boolean;
    taggedUserIds?: string[];
  }): Promise<ApiResponse<Memory>> => {
    return apiClient.post<ApiResponse<Memory>>(
      API_ENDPOINTS.retention.memories.create,
      data
    );
  },

  getUserTimeline: async (userId: string): Promise<ApiResponse<Memory[]>> => {
    return apiClient.get<ApiResponse<Memory[]>>(
      API_ENDPOINTS.retention.memories.timeline(userId)
    );
  },

  getVenueMemories: async (venueId: string): Promise<ApiResponse<Memory[]>> => {
    return apiClient.get<ApiResponse<Memory[]>>(
      API_ENDPOINTS.retention.memories.venue(venueId)
    );
  },

  getTaggedMemories: async (userId: string): Promise<ApiResponse<Memory[]>> => {
    return apiClient.get<ApiResponse<Memory[]>>(
      API_ENDPOINTS.retention.memories.tagged(userId)
    );
  },

  getOnThisDayMemories: async (
    userId: string
  ): Promise<ApiResponse<Memory[]>> => {
    return apiClient.get<ApiResponse<Memory[]>>(
      API_ENDPOINTS.retention.memories.onThisDay(userId)
    );
  },

  getMemoryHighlights: async (
    userId: string
  ): Promise<ApiResponse<Memory[]>> => {
    return apiClient.get<ApiResponse<Memory[]>>(
      API_ENDPOINTS.retention.memories.highlights(userId)
    );
  },

  likeMemory: async (id: string, userId: string): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.retention.memories.like(id), {
      userId,
    });
  },

  addMemoryComment: async (
    id: string,
    userId: string,
    text: string
  ): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(API_ENDPOINTS.retention.memories.addComment(id), {
      userId,
      text,
    });
  },

  // Alias for getUserTimeline - used by RetentionContext
  getUserMemories: async (userId: string): Promise<ApiResponse<Memory[]>> => {
    return apiClient.get<ApiResponse<Memory[]>>(
      API_ENDPOINTS.retention.memories.timeline(userId)
    );
  },

  // Simplified alias for claimStreakMilestone - used by RetentionContext
  claimStreakReward: async (
    streakId: string,
    userId: string
  ): Promise<ApiResponse<Streak>> => {
    // For now, we'll call the backend with a generic milestone claim
    // The backend should determine which milestone to claim based on current progress
    return apiClient.post<ApiResponse<Streak>>(
      `/api/retention/streaks/${streakId}/claim`,
      { userId }
    );
  },

  // Update memory privacy setting
  updateMemoryPrivacy: async (
    memoryId: string,
    isPrivate: boolean
  ): Promise<ApiResponse<Memory>> => {
    return apiClient.patch<ApiResponse<Memory>>(
      `/api/retention/memories/${memoryId}`,
      { isPrivate }
    );
  },
};

// Authentication
export const authApi = {
  setAuthToken: (token: string) => apiClient.setAuthToken(token),
  clearAuthToken: () => apiClient.clearAuthToken(),
};

// ============================================================================
// BUSINESS PROFILE API
// ============================================================================

export const businessApi = {
  /**
   * Register a new business profile
   */
  register: async (data: {
    venueName: string;
    businessEmail: string;
    location: {
      address: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    businessType: string;
  }): Promise<ApiResponse<{ businessProfile: any; message: string }>> => {
    return apiClient.post<ApiResponse<{ businessProfile: any; message: string }>>(
      API_ENDPOINTS.business.register,
      data
    );
  },

  /**
   * Verify business email with token
   */
  verifyEmail: async (
    token: string
  ): Promise<ApiResponse<{ businessProfile: any; venue: any; venueRole: any }>> => {
    return apiClient.get<
      ApiResponse<{ businessProfile: any; venue: any; venueRole: any }>
    >(API_ENDPOINTS.business.verify(token));
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>(
      API_ENDPOINTS.business.resendVerification
    );
  },

  /**
   * Get user's business profile
   */
  getProfile: async (): Promise<
    ApiResponse<{ businessProfile: any; venues: any[] }>
  > => {
    return apiClient.get<ApiResponse<{ businessProfile: any; venues: any[] }>>(
      API_ENDPOINTS.business.profile
    );
  },

  /**
   * Update business profile
   */
  updateProfile: async (updates: {
    venueName?: string;
    businessEmail?: string;
    location?: any;
  }): Promise<ApiResponse<{ businessProfile: any }>> => {
    return apiClient.patch<ApiResponse<{ businessProfile: any }>>(
      API_ENDPOINTS.business.updateProfile,
      updates
    );
  },
};

// ============================================================================
// VENUE MANAGEMENT API
// ============================================================================

export const venueManagementApi = {
  /**
   * Get user's venue roles
   */
  getUserRoles: async (): Promise<ApiResponse<{ roles: any[] }>> => {
    return apiClient.get<ApiResponse<{ roles: any[] }>>(
      API_ENDPOINTS.venueManagement.roles
    );
  },

  /**
   * Get venue details
   */
  getVenueDetails: async (
    venueId: string
  ): Promise<ApiResponse<{ venue: any; userRole: any }>> => {
    return apiClient.get<ApiResponse<{ venue: any; userRole: any }>>(
      API_ENDPOINTS.venueManagement.detail(venueId)
    );
  },

  /**
   * Update venue basic information
   */
  updateVenueInfo: async (
    venueId: string,
    updates: {
      name?: string;
      location?: any;
      coverCharge?: number;
      hours?: any;
      tags?: string[];
      capacity?: number;
      priceLevel?: number;
    }
  ): Promise<ApiResponse<{ venue: any }>> => {
    return apiClient.patch<ApiResponse<{ venue: any }>>(
      API_ENDPOINTS.venueManagement.updateInfo(venueId),
      updates
    );
  },

  /**
   * Update venue display (images, description, tags)
   */
  updateVenueDisplay: async (
    venueId: string,
    displayUpdates: {
      imageUrl?: string;
      description?: string;
      tags?: string[];
      genres?: string[];
    }
  ): Promise<ApiResponse<{ venue: any }>> => {
    return apiClient.patch<ApiResponse<{ venue: any }>>(
      API_ENDPOINTS.venueManagement.updateDisplay(venueId),
      displayUpdates
    );
  },

  /**
   * Assign role to user for venue
   */
  assignRole: async (
    venueId: string,
    data: {
      userId: string;
      role: string;
      permissions?: string[];
    }
  ): Promise<ApiResponse<{ venueRole: any }>> => {
    return apiClient.post<ApiResponse<{ venueRole: any }>>(
      API_ENDPOINTS.venueManagement.assignRole(venueId),
      data
    );
  },

  /**
   * Remove role from user
   */
  removeRole: async (venueId: string, roleId: string): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(
      API_ENDPOINTS.venueManagement.removeRole(venueId, roleId)
    );
  },

  /**
   * Get venue staff list
   */
  getVenueStaff: async (
    venueId: string
  ): Promise<ApiResponse<{ staff: any[] }>> => {
    return apiClient.get<ApiResponse<{ staff: any[] }>>(
      API_ENDPOINTS.venueManagement.staff(venueId)
    );
  },
};

// Export all APIs as a unified object
export const fullApi = {
  growth: growthApi,
  events: eventsApi,
  social: socialApi,
  content: contentApi,
  pricing: pricingApi,
  retention: retentionApi,
  auth: authApi,
  business: businessApi,
  venueManagement: venueManagementApi,
};
