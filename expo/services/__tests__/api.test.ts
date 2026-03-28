/**
 * Tests for API service layer
 */

// Must mock modules before imports
jest.mock('@/services/config', () => ({
  API_BASE_URL: 'http://localhost:3000/api',
  API_ENDPOINTS: {
    growth: {
      groupPurchases: {
        create: '/growth/group-purchases',
        venue: (id: string) => `/growth/group-purchases/venue/${id}`,
        user: (id: string) => `/growth/group-purchases/user/${id}`,
        join: (id: string) => `/growth/group-purchases/${id}/join`,
        complete: (id: string) => `/growth/group-purchases/${id}/complete`,
      },
      referrals: {
        generate: '/growth/referrals/generate',
        apply: '/growth/referrals/apply',
        stats: (id: string) => `/growth/referrals/stats/${id}`,
        rewards: (id: string) => `/growth/referrals/rewards/${id}`,
      },
    },
    events: {
      list: '/events',
      upcoming: '/events/upcoming',
      detail: (id: string) => `/events/${id}`,
      venue: (id: string) => `/events/venue/${id}`,
      performer: (id: string) => `/events/performer/${id}`,
      tickets: {
        purchase: '/events/tickets/purchase',
        user: (id: string) => `/events/tickets/user/${id}`,
        transfer: (id: string) => `/events/tickets/${id}/transfer`,
        validate: '/events/tickets/validate',
        checkIn: (id: string) => `/events/tickets/${id}/checkin`,
      },
      guestList: {
        add: '/events/guestlist/add',
        venue: (id: string) => `/events/guestlist/venue/${id}`,
        event: (id: string) => `/events/guestlist/event/${id}`,
        check: '/events/guestlist/check',
        checkIn: (id: string) => `/events/guestlist/${id}/checkin`,
        cancel: (id: string) => `/events/guestlist/${id}/cancel`,
      },
    },
    social: {
      crews: {
        create: '/social/crews',
        detail: (id: string) => `/social/crews/${id}`,
        user: (id: string) => `/social/crews/user/${id}`,
        search: '/social/crews/search',
        active: '/social/crews/discover/active',
        addMember: (id: string) => `/social/crews/${id}/members/add`,
        removeMember: (id: string, uid: string) => `/social/crews/${id}/members/${uid}`,
      },
      challenges: {
        active: '/social/challenges/active',
        detail: (id: string) => `/social/challenges/${id}`,
        user: (id: string) => `/social/challenges/user/${id}`,
        join: (id: string) => `/social/challenges/${id}/join`,
        progress: (id: string) => `/social/challenges/${id}/progress`,
        userProgress: (cid: string, _uid: string) => `/social/challenges/${cid}/progress`,
        claim: (id: string) => `/social/challenges/${id}/claim`,
      },
      sync: {
        contacts: '/social/sync/contacts',
        instagram: '/social/sync/instagram',
      },
    },
    content: {
      performers: {
        search: '/content/performers/search',
        genre: (g: string) => `/content/performers/genre/${g}`,
        trending: '/content/performers/trending',
        detail: (id: string) => `/content/performers/${id}`,
        follow: (id: string) => `/content/performers/${id}/follow`,
        unfollow: (id: string) => `/content/performers/${id}/unfollow`,
        posts: (id: string) => `/content/performers/${id}/posts`,
        feed: (id: string) => `/content/performers/feed/${id}`,
        likePost: (pid: string, postId: string) => `/content/performers/${pid}/posts/${postId}/like`,
      },
      highlights: {
        upload: '/content/highlights',
        venue: (id: string) => `/content/highlights/venue/${id}`,
        event: (id: string) => `/content/highlights/event/${id}`,
        user: (id: string) => `/content/highlights/user/${id}`,
        trending: '/content/highlights/trending',
        feed: (id: string) => `/content/highlights/feed/${id}`,
        view: (id: string) => `/content/highlights/${id}/view`,
        like: (id: string) => `/content/highlights/${id}/like`,
      },
    },
    pricing: {
      dynamic: {
        current: (id: string) => `/pricing/dynamic/current/${id}`,
        calculate: '/pricing/dynamic/calculate',
        history: (id: string) => `/pricing/dynamic/history/${id}`,
      },
      alerts: {
        create: '/pricing/alerts',
        user: (id: string) => `/pricing/alerts/user/${id}`,
        venue: (id: string) => `/pricing/alerts/venue/${id}`,
        update: (id: string) => `/pricing/alerts/${id}`,
        deactivate: (id: string) => `/pricing/alerts/${id}/deactivate`,
        delete: (id: string) => `/pricing/alerts/${id}`,
      },
    },
    retention: {
      streaks: {
        user: (id: string) => `/retention/streaks/user/${id}`,
        increment: (id: string) => `/retention/streaks/${id}/increment`,
        claimMilestone: (id: string, m: number) => `/retention/streaks/${id}/milestone/${m}`,
        leaderboard: (t: string) => `/retention/streaks/leaderboard/${t}`,
        atRisk: '/retention/streaks/at-risk',
      },
      memories: {
        create: '/retention/memories',
        timeline: (id: string) => `/retention/memories/timeline/${id}`,
        venue: (id: string) => `/retention/memories/venue/${id}`,
        tagged: (id: string) => `/retention/memories/tagged/${id}`,
        onThisDay: (id: string) => `/retention/memories/on-this-day/${id}`,
        highlights: (id: string) => `/retention/memories/highlights/${id}`,
        like: (id: string) => `/retention/memories/${id}/like`,
        addComment: (id: string) => `/retention/memories/${id}/comments`,
      },
    },
    business: {
      register: '/business/register',
      verify: (t: string) => `/business/verify/${t}`,
      resendVerification: '/business/resend-verification',
      profile: '/business/profile',
      updateProfile: '/business/profile',
    },
    venueManagement: {
      roles: '/venue-management/roles',
      detail: (id: string) => `/venue-management/${id}`,
      updateInfo: (id: string) => `/venue-management/${id}/info`,
      updateDisplay: (id: string) => `/venue-management/${id}/display`,
      assignRole: (id: string) => `/venue-management/${id}/roles`,
      removeRole: (id: string, rid: string) => `/venue-management/${id}/roles/${rid}`,
      staff: (id: string) => `/venue-management/${id}/staff`,
    },
  },
}));

import {
  ApiClient,
  ApiError,
  apiClient,
  api,
  syncContacts,
  syncInstagram,
  exchangeInstagramCode,
  growthApi,
  eventsApi,
  socialApi,
  contentApi,
  pricingApi,
  retentionApi,
  authApi,
  businessApi,
  venueManagementApi,
  fullApi,
} from '../api';

// Helper to create a mock response
function mockFetchResponse(body: any, status = 200, ok = true, contentType = 'application/json') {
  return Promise.resolve({
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    clone: function () {
      return {
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
        headers: new Headers({ 'content-type': contentType }),
      };
    },
    headers: new Headers({ 'content-type': contentType }),
  } as unknown as Response);
}

describe('ApiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ========================================================================
  // GET Requests
  // ========================================================================

  describe('GET requests', () => {
    it('should make a GET request and return data', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(mockData));

      const result = await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalled();
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/test');
      expect(config.method).toBe('GET');
      expect(result).toEqual(mockData);
    });

    it('should include Content-Type header', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({}));

      await apiClient.get('/test');

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.headers['Content-Type']).toBe('application/json');
    });

    it('should throw ApiError on non-ok response', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ error: 'Not found' }, 404, false)
      );

      await expect(apiClient.get('/notfound')).rejects.toThrow();
    });

    it('should merge custom headers with defaults', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({ ok: true }));

      await apiClient.get('/test', {
        headers: { 'X-Custom': 'value' } as any,
      });

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.headers['X-Custom']).toBe('value');
      expect(config.headers['Content-Type']).toBe('application/json');
    });
  });

  // ========================================================================
  // POST Requests
  // ========================================================================

  describe('POST requests', () => {
    it('should make a POST request with body', async () => {
      const requestBody = { name: 'Test' };
      const responseBody = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(responseBody));

      const result = await apiClient.post('/test', requestBody);

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.method).toBe('POST');
      expect(config.body).toBe(JSON.stringify(requestBody));
      expect(result).toEqual(responseBody);
    });

    it('should make a POST request without body', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({ ok: true }));

      await apiClient.post('/test');

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.body).toBeUndefined();
    });

    it('should throw ApiError with message from JSON error response', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ error: 'Validation failed' }, 400, false)
      );

      await expect(apiClient.post('/test', {})).rejects.toThrow();
    });

    it('should extract error message from response.message field', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ message: 'Custom error message' }, 422, false)
      );

      await expect(apiClient.post('/test', {})).rejects.toThrow('Custom error message');
    });

    it('should fall back to text body when content-type is not JSON', async () => {
      // Use 400 (4xx) so retry logic does not kick in
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse('Plain text error', 400, false, 'text/plain')
      );

      await expect(apiClient.post('/test', {})).rejects.toThrow('Plain text error');
    });
  });

  // ========================================================================
  // PUT Requests
  // ========================================================================

  describe('PUT requests', () => {
    it('should make a PUT request with body', async () => {
      const data = { name: 'Updated' };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(data));

      const result = await apiClient.put('/test/1', data);

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.method).toBe('PUT');
      expect(result).toEqual(data);
    });

    it('should throw ApiError on failed PUT', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ error: 'Conflict' }, 409, false)
      );

      await expect(apiClient.put('/test/1', {})).rejects.toThrow();
    });
  });

  // ========================================================================
  // DELETE Requests
  // ========================================================================

  describe('DELETE requests', () => {
    it('should make a DELETE request', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({ deleted: true }));

      const result = await apiClient.delete('/test/1');

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.method).toBe('DELETE');
      expect(result).toEqual({ deleted: true });
    });

    it('should throw ApiError on failure', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({}, 403, false)
      );

      await expect(apiClient.delete('/test/1')).rejects.toThrow();
    });
  });

  // ========================================================================
  // PATCH Requests
  // ========================================================================

  describe('PATCH requests', () => {
    it('should make a PATCH request with body', async () => {
      const data = { status: 'active' };
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse(data));

      const result = await apiClient.patch('/test/1', data);

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.method).toBe('PATCH');
      expect(result).toEqual(data);
    });

    it('should throw ApiError on failed PATCH with extracted error', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ error: 'Invalid data' }, 400, false)
      );

      await expect(apiClient.patch('/test/1', {})).rejects.toThrow('Invalid data');
    });
  });

  // ========================================================================
  // Auth Token
  // ========================================================================

  describe('Auth token management', () => {
    it('should set auth token and persist it', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await apiClient.setAuthToken('test-token-123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token-123');
    });

    it('should include auth token in request headers', async () => {
      await apiClient.setAuthToken('bearer-token');
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({}));

      await apiClient.get('/protected');

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.headers['Authorization']).toBe('Bearer bearer-token');
    });

    it('should clear auth token', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await apiClient.clearAuthToken();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should not include Authorization header after clearing token', async () => {
      await apiClient.setAuthToken('temp-token');
      await apiClient.clearAuthToken();
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({}));

      await apiClient.get('/public');

      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(config.headers['Authorization']).toBeUndefined();
    });
  });

  // ========================================================================
  // Timeout
  // ========================================================================

  describe('Timeout', () => {
    it('should throw ApiError on timeout (AbortError)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValue(abortError);

      await expect(apiClient.get('/slow')).rejects.toThrow('Request timeout');
    }, 30000);
  });

  // ========================================================================
  // Retry Logic
  // ========================================================================

  describe('Retry logic', () => {
    it('should not retry on 4xx errors', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({ error: 'Bad request' }, 400, false)
      );

      await expect(apiClient.post('/test', {})).rejects.toThrow();
      // Should only be called once (no retries for 4xx)
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should propagate non-AbortError network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      await expect(apiClient.get('/broken')).rejects.toThrow('Network failure');
    }, 30000);
  });

  // ========================================================================
  // ApiError
  // ========================================================================

  describe('ApiError', () => {
    it('should be an instance of Error', () => {
      const err = new ApiError('test error', 500);
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('ApiError');
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('test error');
    });

    it('should work with only a message', () => {
      const err = new ApiError('simple error');
      expect(err.statusCode).toBeUndefined();
      expect(err.response).toBeUndefined();
    });

    it('should store a response object', () => {
      const mockResp = { status: 404 } as Response;
      const err = new ApiError('not found', 404, mockResp);
      expect(err.response).toBe(mockResp);
    });
  });

  // ========================================================================
  // Convenience api export
  // ========================================================================

  describe('api convenience export', () => {
    it('should expose get, post, put, patch, delete methods', () => {
      expect(api.get).toBeDefined();
      expect(api.post).toBeDefined();
      expect(api.put).toBeDefined();
      expect(api.patch).toBeDefined();
      expect(api.delete).toBeDefined();
    });

    it('should delegate get to apiClient', async () => {
      (global.fetch as jest.Mock).mockReturnValue(mockFetchResponse({ delegated: true }));
      const result = await api.get('/delegate-test');
      expect(result).toEqual({ delegated: true });
    });
  });
});

// ============================================================================
// Social sync functions
// ============================================================================

describe('Social sync functions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockReturnValue(mockFetchResponse({ matches: [], totalMatches: 0 }));
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('should sync contacts via POST', async () => {
    const result = await syncContacts({ phoneNumbers: ['h1', 'h2'], userId: 'u1' });
    const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('social/sync/contacts');
    expect(config.method).toBe('POST');
    expect(result.totalMatches).toBe(0);
  });

  it('should sync Instagram via POST', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetchResponse({ matches: [{ instagramId: 'ig1' }], totalMatches: 1 })
    );
    const result = await syncInstagram({ accessToken: 'ig-tok', userId: 'u1' });
    expect(result.totalMatches).toBe(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('social/sync/instagram');
  });

  it('should exchange Instagram code for token', async () => {
    (global.fetch as jest.Mock).mockReturnValue(
      mockFetchResponse({ accessToken: 'tok', userId: 'ig-u', username: 'user1' })
    );
    const result = await exchangeInstagramCode('code-xyz');
    expect(result.accessToken).toBe('tok');
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('auth/instagram/token');
  });
});

// ============================================================================
// API Groups
// ============================================================================

describe('API Groups', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockReturnValue(mockFetchResponse({ success: true, data: {} }));
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  // ========================================================================
  // growthApi
  // ========================================================================

  describe('growthApi', () => {
    it('should create a group purchase', async () => {
      await growthApi.createGroupPurchase({
        initiatorId: 'user1',
        venueId: 'venue1',
        ticketType: 'ENTRY',
        totalAmount: 100,
        maxParticipants: 5,
        expiresAt: '2025-12-31T00:00:00Z',
      });
      expect(global.fetch).toHaveBeenCalled();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('group-purchases');
    });

    it('should get group purchases by venue', async () => {
      await growthApi.getGroupPurchasesByVenue('venue-123');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue/venue-123');
    });

    it('should get group purchases by user', async () => {
      await growthApi.getGroupPurchasesByUser('user-123');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('user/user-123');
    });

    it('should join a group purchase', async () => {
      await growthApi.joinGroupPurchase('gp-1', 'user-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('gp-1/join');
      expect(JSON.parse(config.body)).toEqual({ userId: 'user-1' });
    });

    it('should complete a group purchase', async () => {
      await growthApi.completeGroupPurchase('gp-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('gp-1/complete');
    });

    it('should generate a referral code', async () => {
      await growthApi.generateReferralCode('user-123');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('referrals/generate');
      expect(config.method).toBe('POST');
    });

    it('should apply a referral code', async () => {
      await growthApi.applyReferralCode('REF123', 'user-456');
      const [, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(JSON.parse(config.body)).toEqual({
        referralCode: 'REF123',
        userId: 'user-456',
      });
    });

    it('should get referral stats', async () => {
      await growthApi.getReferralStats('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('referrals/stats/user-1');
    });

    it('should get referral rewards', async () => {
      await growthApi.getReferralRewards('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('referrals/rewards/user-1');
    });
  });

  // ========================================================================
  // eventsApi
  // ========================================================================

  describe('eventsApi', () => {
    it('should get upcoming events', async () => {
      await eventsApi.getUpcomingEvents();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('events/upcoming');
    });

    it('should get event details', async () => {
      await eventsApi.getEventDetails('evt-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('events/evt-1');
    });

    it('should get events with filters', async () => {
      await eventsApi.getEvents({ venueId: 'v1', startDate: '2025-01-01' });
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venueId=v1');
    });

    it('should get events by venue', async () => {
      await eventsApi.getEventsByVenue('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('events/venue/v1');
    });

    it('should get events by performer', async () => {
      await eventsApi.getEventsByPerformer('perf-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('events/performer/perf-1');
    });

    it('should purchase a ticket', async () => {
      await eventsApi.purchaseTicket({
        eventId: 'evt-1',
        userId: 'user-1',
        tierId: 'tier-1',
      });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('tickets/purchase');
      expect(config.method).toBe('POST');
    });

    it('should get user tickets', async () => {
      await eventsApi.getUserTickets('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('tickets/user/user-1');
    });

    it('should transfer a ticket', async () => {
      await eventsApi.transferTicket('t1', 'user-2');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('tickets/t1/transfer');
      expect(JSON.parse(config.body)).toEqual({ toUserId: 'user-2' });
    });

    it('should validate a ticket', async () => {
      await eventsApi.validateTicket('qr-code-123');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('tickets/validate');
    });

    it('should check in a ticket', async () => {
      await eventsApi.checkInTicket('t1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('tickets/t1/checkin');
    });

    it('should add to guest list', async () => {
      await eventsApi.addToGuestList({
        venueId: 'v1',
        guestName: 'John Doe',
        addedBy: 'staff1',
      });
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('guestlist/add');
    });

    it('should get venue guest list', async () => {
      await eventsApi.getVenueGuestList('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('guestlist/venue/v1');
    });

    it('should check guest list', async () => {
      await eventsApi.checkGuestList({ venueId: 'v1', guestName: 'John' });
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('guestlist/check');
    });

    it('should check in a guest', async () => {
      await eventsApi.checkInGuest('gl-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('guestlist/gl-1/checkin');
    });

    it('should cancel a guest list entry', async () => {
      await eventsApi.cancelGuestListEntry('gl-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('guestlist/gl-1/cancel');
    });
  });

  // ========================================================================
  // socialApi
  // ========================================================================

  describe('socialApi', () => {
    it('should create a crew', async () => {
      await socialApi.createCrew({ name: 'Test Crew', ownerId: 'user1' });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('social/crews');
      expect(config.method).toBe('POST');
    });

    it('should get crew details', async () => {
      await socialApi.getCrewDetails('crew-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('social/crews/crew-1');
    });

    it('should get user crews', async () => {
      await socialApi.getUserCrews('user-123');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('crews/user/user-123');
    });

    it('should search crews', async () => {
      await socialApi.searchCrews('night owls');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('crews/search');
      expect(url).toContain('q=night%20owls');
    });

    it('should get active crews', async () => {
      await socialApi.getActiveCrews();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('crews/discover/active');
    });

    it('should add a crew member', async () => {
      await socialApi.addCrewMember('crew-1', 'user-2');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('crew-1/members/add');
      expect(JSON.parse(config.body)).toEqual({ userId: 'user-2' });
    });

    it('should remove a crew member', async () => {
      await socialApi.removeCrewMember('crew-1', 'user-2');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('crew-1/members/user-2');
      expect(config.method).toBe('DELETE');
    });

    it('should join a challenge', async () => {
      await socialApi.joinChallenge('ch-1', 'user-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/ch-1/join');
      expect(JSON.parse(config.body)).toEqual({ userId: 'user-1' });
    });

    it('should get active challenges', async () => {
      await socialApi.getActiveChallenges();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/active');
    });

    it('should get challenge details', async () => {
      await socialApi.getChallengeDetails('ch-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/ch-1');
    });

    it('should get user challenges', async () => {
      await socialApi.getUserChallenges('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/user/user-1');
    });

    it('should get challenge progress', async () => {
      await socialApi.getChallengeProgress('ch-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/ch-1/progress');
    });

    it('should update challenge progress', async () => {
      await socialApi.updateChallengeProgress('ch-1', 'user-1', 5);
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/ch-1/progress');
      expect(JSON.parse(config.body)).toEqual({ incrementBy: 5 });
    });

    it('should claim challenge reward', async () => {
      await socialApi.claimChallengeReward('ch-1', 'user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('challenges/ch-1/claim');
    });

    it('should sync contacts via socialApi', async () => {
      await socialApi.syncContacts({
        userId: 'u1',
        contacts: [{ name: 'John', phoneNumber: '+1234567890' }],
      });
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('social/sync/contacts');
    });

    it('should sync Instagram via socialApi', async () => {
      await socialApi.syncInstagram({ userId: 'u1', instagramToken: 'ig-tok' });
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('social/sync/instagram');
    });
  });

  // ========================================================================
  // contentApi
  // ========================================================================

  describe('contentApi', () => {
    it('should search performers', async () => {
      await contentApi.searchPerformers('DJ');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/search');
      expect(url).toContain('q=DJ');
    });

    it('should get performers by genre', async () => {
      await contentApi.getPerformersByGenre('house');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/genre/house');
    });

    it('should get trending performers', async () => {
      await contentApi.getTrendingPerformers();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/trending');
    });

    it('should get performer details', async () => {
      await contentApi.getPerformerDetails('perf-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/perf-1');
    });

    it('should follow a performer', async () => {
      await contentApi.followPerformer('perf-1', 'user-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/perf-1/follow');
      expect(config.method).toBe('POST');
    });

    it('should unfollow a performer', async () => {
      await contentApi.unfollowPerformer('perf-1', 'user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/perf-1/unfollow');
    });

    it('should get performer posts', async () => {
      await contentApi.getPerformerPosts('perf-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/perf-1/posts');
    });

    it('should get performer feed', async () => {
      await contentApi.getPerformerFeed('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/feed/user-1');
    });

    it('should like a performer post', async () => {
      await contentApi.likePerformerPost('perf-1', 'post-1', 'user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('performers/perf-1/posts/post-1/like');
    });

    it('should like a post via alias', async () => {
      await contentApi.likePost('post-1', 'user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('posts/post-1/like');
    });

    it('should unlike a post', async () => {
      await contentApi.unlikePost('post-1', 'user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('posts/post-1/unlike');
    });

    it('should upload a highlight', async () => {
      await contentApi.uploadHighlight({
        videoUrl: 'https://example.com/v.mp4',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        venueId: 'v1',
        userId: 'u1',
        duration: 15,
      });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('content/highlights');
      expect(config.method).toBe('POST');
    });

    it('should get venue highlights', async () => {
      await contentApi.getVenueHighlights('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/venue/v1');
    });

    it('should get event highlights', async () => {
      await contentApi.getEventHighlights('evt-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/event/evt-1');
    });

    it('should get user highlights', async () => {
      await contentApi.getUserHighlights('u1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/user/u1');
    });

    it('should get trending highlights', async () => {
      await contentApi.getTrendingHighlights();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/trending');
    });

    it('should get highlights feed', async () => {
      await contentApi.getHighlightsFeed('u1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/feed/u1');
    });

    it('should view a highlight', async () => {
      await contentApi.viewHighlight('h1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/h1/view');
    });

    it('should like a highlight', async () => {
      await contentApi.likeHighlight('h1', 'u1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/h1/like');
    });

    it('should get active highlights', async () => {
      await contentApi.getActiveHighlights();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/trending');
    });

    it('should increment highlight views', async () => {
      await contentApi.incrementHighlightViews('h1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('highlights/h1/view');
    });
  });

  // ========================================================================
  // pricingApi
  // ========================================================================

  describe('pricingApi', () => {
    it('should get current pricing for a venue', async () => {
      await pricingApi.getCurrentPricing('venue-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/dynamic/current/venue-1');
    });

    it('should calculate dynamic price', async () => {
      await pricingApi.calculateDynamicPrice({
        venueId: 'v1',
        basePrice: 20,
        occupancyPercentage: 75,
        dayOfWeek: 5,
        hour: 22,
      });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/dynamic/calculate');
      expect(config.method).toBe('POST');
    });

    it('should get pricing history', async () => {
      await pricingApi.getPricingHistory('v1', 14);
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/dynamic/history/v1');
      expect(url).toContain('days=14');
    });

    it('should default to 7 days for pricing history', async () => {
      await pricingApi.getPricingHistory('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('days=7');
    });

    it('should create a price alert', async () => {
      await pricingApi.createPriceAlert({
        userId: 'u1',
        venueId: 'v1',
        targetDiscount: 20,
      });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/alerts');
      expect(config.method).toBe('POST');
    });

    it('should get user price alerts', async () => {
      await pricingApi.getUserPriceAlerts('u1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/alerts/user/u1');
    });

    it('should get venue price alerts', async () => {
      await pricingApi.getVenuePriceAlerts('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/alerts/venue/v1');
    });

    it('should update a price alert', async () => {
      await pricingApi.updatePriceAlert('alert-1', { targetDiscount: 30 });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/alerts/alert-1');
      expect(config.method).toBe('PATCH');
    });

    it('should deactivate a price alert', async () => {
      await pricingApi.deactivatePriceAlert('alert-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/alerts/alert-1/deactivate');
    });

    it('should delete a price alert', async () => {
      await pricingApi.deletePriceAlert('alert-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('pricing/alerts/alert-1');
      expect(config.method).toBe('DELETE');
    });

    it('should get all active pricing across venues', async () => {
      (global.fetch as jest.Mock).mockReturnValue(
        mockFetchResponse({
          success: true,
          data: {
            _id: 'dp-1',
            venueId: 'venue-1',
            basePrice: 20,
            currentPrice: 15,
            discountPercentage: 25,
            validUntil: '2027-01-01T00:00:00Z',
            reason: 'HAPPY_HOUR',
          },
        })
      );

      const result = await pricingApi.getAllActivePricing();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle errors gracefully in getAllActivePricing', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await pricingApi.getAllActivePricing();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    }, 120000);
  });

  // ========================================================================
  // retentionApi
  // ========================================================================

  describe('retentionApi', () => {
    it('should get user streaks', async () => {
      await retentionApi.getUserStreaks('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('retention/streaks/user/user-1');
    });

    it('should increment a streak', async () => {
      await retentionApi.incrementStreak('streak-1', 'CHECK_IN');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('streaks/streak-1/increment');
      expect(JSON.parse(config.body)).toEqual({ activityType: 'CHECK_IN' });
    });

    it('should claim a streak milestone', async () => {
      await retentionApi.claimStreakMilestone('streak-1', 7);
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('streaks/streak-1/milestone/7');
    });

    it('should get streak leaderboard', async () => {
      await retentionApi.getStreakLeaderboard('weekly');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('streaks/leaderboard/weekly');
    });

    it('should get streaks at risk', async () => {
      await retentionApi.getStreaksAtRisk();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('streaks/at-risk');
    });

    it('should create a memory', async () => {
      await retentionApi.createMemory({
        userId: 'u1',
        venueId: 'v1',
        date: '2025-01-15',
        type: 'CHECK_IN',
        content: { caption: 'Great night!' },
      });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('retention/memories');
      expect(config.method).toBe('POST');
    });

    it('should get user timeline', async () => {
      await retentionApi.getUserTimeline('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/timeline/user-1');
    });

    it('should get venue memories', async () => {
      await retentionApi.getVenueMemories('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/venue/v1');
    });

    it('should get tagged memories', async () => {
      await retentionApi.getTaggedMemories('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/tagged/user-1');
    });

    it('should get on-this-day memories', async () => {
      await retentionApi.getOnThisDayMemories('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/on-this-day/user-1');
    });

    it('should get memory highlights', async () => {
      await retentionApi.getMemoryHighlights('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/highlights/user-1');
    });

    it('should like a memory', async () => {
      await retentionApi.likeMemory('mem-1', 'user-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/mem-1/like');
      expect(config.method).toBe('POST');
    });

    it('should add a memory comment', async () => {
      await retentionApi.addMemoryComment('mem-1', 'user-1', 'Nice!');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/mem-1/comments');
      expect(JSON.parse(config.body)).toEqual({ userId: 'user-1', text: 'Nice!' });
    });

    it('should get user memories (alias)', async () => {
      await retentionApi.getUserMemories('user-1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/timeline/user-1');
    });

    it('should claim streak reward', async () => {
      await retentionApi.claimStreakReward('streak-1', 'user-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('streaks/streak-1/claim');
      expect(JSON.parse(config.body)).toEqual({ userId: 'user-1' });
    });

    it('should update memory privacy', async () => {
      await retentionApi.updateMemoryPrivacy('mem-1', true);
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('memories/mem-1');
      expect(config.method).toBe('PATCH');
    });
  });

  // ========================================================================
  // authApi
  // ========================================================================

  describe('authApi', () => {
    it('should delegate setAuthToken', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await authApi.setAuthToken('tok');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('authToken', 'tok');
    });

    it('should delegate clearAuthToken', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      await authApi.clearAuthToken();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  // ========================================================================
  // businessApi
  // ========================================================================

  describe('businessApi', () => {
    it('should register a business', async () => {
      await businessApi.register({
        venueName: 'Club X',
        businessEmail: 'info@clubx.com',
        location: { address: '123 Main', city: 'SF', state: 'CA', zipCode: '94101', country: 'US' },
        businessType: 'nightclub',
      });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('business/register');
      expect(config.method).toBe('POST');
    });

    it('should verify business email', async () => {
      await businessApi.verifyEmail('verify-token-123');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('business/verify/verify-token-123');
    });

    it('should resend verification email', async () => {
      await businessApi.resendVerificationEmail();
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('business/resend-verification');
      expect(config.method).toBe('POST');
    });

    it('should get business profile', async () => {
      await businessApi.getProfile();
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('business/profile');
      expect(config.method).toBe('GET');
    });

    it('should update business profile', async () => {
      await businessApi.updateProfile({ venueName: 'Club Y' });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('business/profile');
      expect(config.method).toBe('PATCH');
    });
  });

  // ========================================================================
  // venueManagementApi
  // ========================================================================

  describe('venueManagementApi', () => {
    it('should get user roles', async () => {
      await venueManagementApi.getUserRoles();
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/roles');
    });

    it('should get venue details', async () => {
      await venueManagementApi.getVenueDetails('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/v1');
    });

    it('should update venue info', async () => {
      await venueManagementApi.updateVenueInfo('v1', { name: 'Updated Club' });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/v1/info');
      expect(config.method).toBe('PATCH');
    });

    it('should update venue display', async () => {
      await venueManagementApi.updateVenueDisplay('v1', { description: 'New desc' });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/v1/display');
      expect(config.method).toBe('PATCH');
    });

    it('should assign a role', async () => {
      await venueManagementApi.assignRole('v1', { userId: 'u1', role: 'manager' });
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/v1/roles');
      expect(config.method).toBe('POST');
    });

    it('should remove a role', async () => {
      await venueManagementApi.removeRole('v1', 'role-1');
      const [url, config] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/v1/roles/role-1');
      expect(config.method).toBe('DELETE');
    });

    it('should get venue staff', async () => {
      await venueManagementApi.getVenueStaff('v1');
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('venue-management/v1/staff');
    });
  });

  // ========================================================================
  // fullApi
  // ========================================================================

  describe('fullApi', () => {
    it('should bundle all API modules', () => {
      expect(fullApi.growth).toBe(growthApi);
      expect(fullApi.events).toBe(eventsApi);
      expect(fullApi.social).toBe(socialApi);
      expect(fullApi.content).toBe(contentApi);
      expect(fullApi.pricing).toBe(pricingApi);
      expect(fullApi.retention).toBe(retentionApi);
      expect(fullApi.auth).toBe(authApi);
      expect(fullApi.business).toBe(businessApi);
      expect(fullApi.venueManagement).toBe(venueManagementApi);
    });
  });
});
