import { API_BASE_URL, GOOGLE_MAPS_API_KEY, API_ENDPOINTS } from '../config';

describe('API Configuration', () => {
  // ========================================================================
  // API_BASE_URL
  // ========================================================================

  describe('API_BASE_URL', () => {
    it('should be defined', () => {
      expect(API_BASE_URL).toBeDefined();
    });

    it('should be a string', () => {
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('should contain a valid URL format', () => {
      expect(API_BASE_URL).toMatch(/^https?:\/\//);
    });
  });

  // ========================================================================
  // GOOGLE_MAPS_API_KEY
  // ========================================================================

  describe('GOOGLE_MAPS_API_KEY', () => {
    it('should be defined as a string', () => {
      expect(typeof GOOGLE_MAPS_API_KEY).toBe('string');
    });
  });

  // ========================================================================
  // AUTH Endpoints
  // ========================================================================

  describe('AUTH endpoints', () => {
    it('should have login endpoint', () => {
      expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    });

    it('should have register endpoint', () => {
      expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
    });

    it('should have refresh endpoint', () => {
      expect(API_ENDPOINTS.AUTH.REFRESH).toBe('/auth/refresh');
    });

    it('should have logout endpoint', () => {
      expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
    });
  });

  // ========================================================================
  // USERS Endpoints
  // ========================================================================

  describe('USERS endpoints', () => {
    it('should have ME endpoint', () => {
      expect(API_ENDPOINTS.USERS.ME).toBe('/users/me');
    });

    it('should generate user by ID endpoint', () => {
      expect(API_ENDPOINTS.USERS.BY_ID('user-123')).toBe('/users/user-123');
    });

    it('should have UPDATE endpoint', () => {
      expect(API_ENDPOINTS.USERS.UPDATE).toBe('/users/me');
    });
  });

  // ========================================================================
  // VENUES Endpoints
  // ========================================================================

  describe('VENUES endpoints', () => {
    it('should have list endpoint', () => {
      expect(API_ENDPOINTS.VENUES.LIST).toBe('/venues');
    });

    it('should generate venue by ID endpoint', () => {
      expect(API_ENDPOINTS.VENUES.BY_ID('v1')).toBe('/venues/v1');
    });

    it('should have nearby endpoint', () => {
      expect(API_ENDPOINTS.VENUES.NEARBY).toBe('/venues/nearby');
    });

    it('should have search endpoint', () => {
      expect(API_ENDPOINTS.VENUES.SEARCH).toBe('/venues/search');
    });
  });

  // ========================================================================
  // EVENTS Endpoints (uppercase)
  // ========================================================================

  describe('EVENTS endpoints', () => {
    it('should have list endpoint', () => {
      expect(API_ENDPOINTS.EVENTS.LIST).toBe('/events');
    });

    it('should generate event by ID endpoint', () => {
      expect(API_ENDPOINTS.EVENTS.BY_ID('evt-1')).toBe('/events/evt-1');
    });

    it('should generate venue events endpoint', () => {
      expect(API_ENDPOINTS.EVENTS.BY_VENUE('v1')).toBe('/events/venue/v1');
    });

    it('should have create endpoint', () => {
      expect(API_ENDPOINTS.EVENTS.CREATE).toBe('/events');
    });
  });

  // ========================================================================
  // TICKETS Endpoints
  // ========================================================================

  describe('TICKETS endpoints', () => {
    it('should have purchase endpoint', () => {
      expect(API_ENDPOINTS.TICKETS.PURCHASE).toBe('/events/tickets/purchase');
    });

    it('should have user tickets endpoint', () => {
      expect(API_ENDPOINTS.TICKETS.USER).toBe('/events/tickets/user');
    });

    it('should generate transfer endpoint', () => {
      expect(API_ENDPOINTS.TICKETS.TRANSFER('t1')).toBe('/events/tickets/t1/transfer');
    });

    it('should generate by QR endpoint', () => {
      expect(API_ENDPOINTS.TICKETS.BY_QR('qr-abc')).toBe('/events/tickets/qr/qr-abc');
    });

    it('should have checkin endpoint', () => {
      expect(API_ENDPOINTS.TICKETS.CHECKIN).toBe('/events/tickets/checkin');
    });

    it('should generate cancel endpoint', () => {
      expect(API_ENDPOINTS.TICKETS.CANCEL('t1')).toBe('/events/tickets/t1/cancel');
    });
  });

  // ========================================================================
  // GUESTLIST Endpoints
  // ========================================================================

  describe('GUESTLIST endpoints', () => {
    it('should have add endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.ADD).toBe('/events/guestlist/add');
    });

    it('should generate by venue endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.BY_VENUE('v1')).toBe('/events/guestlist/venue/v1');
    });

    it('should generate by event endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.BY_EVENT('evt-1')).toBe('/events/guestlist/event/evt-1');
    });

    it('should generate checkin endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.CHECKIN('gl-1')).toBe('/events/guestlist/gl-1/checkin');
    });

    it('should generate confirm endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.CONFIRM('gl-1')).toBe('/events/guestlist/gl-1/confirm');
    });

    it('should generate noshow endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.NOSHOW('gl-1')).toBe('/events/guestlist/gl-1/noshow');
    });

    it('should generate update endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.UPDATE('gl-1')).toBe('/events/guestlist/gl-1');
    });

    it('should generate remove endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.REMOVE('gl-1')).toBe('/events/guestlist/gl-1');
    });

    it('should have search endpoint', () => {
      expect(API_ENDPOINTS.GUESTLIST.SEARCH).toBe('/events/guestlist/search');
    });
  });

  // ========================================================================
  // SOCIAL Endpoints (uppercase)
  // ========================================================================

  describe('SOCIAL endpoints', () => {
    it('should have friend request endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.FRIENDS.REQUEST).toBe('/social/friends/request');
    });

    it('should generate accept friend endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.FRIENDS.ACCEPT('f1')).toBe('/social/friends/accept/f1');
    });

    it('should generate reject friend endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.FRIENDS.REJECT('f1')).toBe('/social/friends/reject/f1');
    });

    it('should generate remove friend endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.FRIENDS.REMOVE('f1')).toBe('/social/friends/f1');
    });

    it('should have friends list endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.FRIENDS.LIST).toBe('/social/friends');
    });

    it('should have pending requests endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.FRIENDS.PENDING).toBe('/social/friends/requests/pending');
    });

    it('should generate crew by ID endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.BY_ID('crew-1')).toBe('/social/crews/crew-1');
    });

    it('should have crew list endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.LIST).toBe('/social/crews');
    });

    it('should generate user crews endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.USER_CREWS('u1')).toBe('/social/crews/user/u1');
    });

    it('should have crew search endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.SEARCH).toBe('/social/crews/search');
    });

    it('should have crew active endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.ACTIVE).toBe('/social/crews/discover/active');
    });

    it('should generate crew join endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.JOIN('c1')).toBe('/social/crews/c1/join');
    });

    it('should generate crew leave endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.LEAVE('c1')).toBe('/social/crews/c1/leave');
    });

    it('should generate crew update endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.UPDATE('c1')).toBe('/social/crews/c1');
    });

    it('should generate crew delete endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.DELETE('c1')).toBe('/social/crews/c1');
    });

    it('should generate crew invite endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CREWS.INVITE('c1')).toBe('/social/crews/c1/invite');
    });

    it('should generate challenge join endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CHALLENGES.JOIN('ch-1')).toBe(
        '/social/challenges/ch-1/join'
      );
    });

    it('should have challenges active endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CHALLENGES.ACTIVE).toBe('/social/challenges/active');
    });

    it('should generate challenge by ID endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CHALLENGES.BY_ID('ch-1')).toBe('/social/challenges/ch-1');
    });

    it('should generate user challenges endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CHALLENGES.USER('u1')).toBe('/social/challenges/user/u1');
    });

    it('should have challenges progress endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CHALLENGES.PROGRESS).toBe('/social/challenges/progress');
    });

    it('should generate challenge claim endpoint', () => {
      expect(API_ENDPOINTS.SOCIAL.CHALLENGES.CLAIM('ch-1')).toBe('/social/challenges/ch-1/claim');
    });
  });

  // ========================================================================
  // CHAT Endpoints
  // ========================================================================

  describe('CHAT endpoints', () => {
    it('should have conversations list endpoint', () => {
      expect(API_ENDPOINTS.CHAT.CONVERSATIONS.LIST).toBe('/chat/conversations');
    });

    it('should generate conversation by ID endpoint', () => {
      expect(API_ENDPOINTS.CHAT.CONVERSATIONS.BY_ID('conv-1')).toBe('/chat/conversations/conv-1');
    });

    it('should have conversation create endpoint', () => {
      expect(API_ENDPOINTS.CHAT.CONVERSATIONS.CREATE).toBe('/chat/conversations');
    });

    it('should generate conversation messages endpoint', () => {
      expect(API_ENDPOINTS.CHAT.CONVERSATIONS.MESSAGES('conv-1')).toBe('/chat/conversations/conv-1/messages');
    });

    it('should have messages send endpoint', () => {
      expect(API_ENDPOINTS.CHAT.MESSAGES.SEND).toBe('/chat/messages');
    });

    it('should generate message edit endpoint', () => {
      expect(API_ENDPOINTS.CHAT.MESSAGES.EDIT('msg-1')).toBe('/chat/messages/msg-1');
    });

    it('should generate message delete endpoint', () => {
      expect(API_ENDPOINTS.CHAT.MESSAGES.DELETE('msg-1')).toBe('/chat/messages/msg-1');
    });

    it('should generate message react endpoint', () => {
      expect(API_ENDPOINTS.CHAT.MESSAGES.REACT('msg-1')).toBe('/chat/messages/msg-1/reactions');
    });
  });

  // ========================================================================
  // VIDEOS Endpoints
  // ========================================================================

  describe('VIDEOS endpoints', () => {
    it('should have feed endpoint', () => {
      expect(API_ENDPOINTS.VIDEOS.FEED).toBe('/videos/feed');
    });

    it('should generate video by ID endpoint', () => {
      expect(API_ENDPOINTS.VIDEOS.BY_ID('vid-1')).toBe('/videos/vid-1');
    });

    it('should have upload endpoint', () => {
      expect(API_ENDPOINTS.VIDEOS.UPLOAD).toBe('/videos/upload');
    });
  });

  // ========================================================================
  // UPLOAD Endpoints
  // ========================================================================

  describe('UPLOAD endpoints', () => {
    it('should have profile picture endpoint', () => {
      expect(API_ENDPOINTS.UPLOAD.PROFILE_PICTURE).toBe('/upload/profile-picture');
    });

    it('should have highlight endpoint', () => {
      expect(API_ENDPOINTS.UPLOAD.HIGHLIGHT).toBe('/upload/highlight');
    });

    it('should have memory endpoint', () => {
      expect(API_ENDPOINTS.UPLOAD.MEMORY).toBe('/upload/memory');
    });

    it('should have venue endpoint', () => {
      expect(API_ENDPOINTS.UPLOAD.VENUE).toBe('/upload/venue');
    });

    it('should have business document endpoint', () => {
      expect(API_ENDPOINTS.UPLOAD.BUSINESS_DOCUMENT).toBe('/upload/business-document');
    });
  });

  // ========================================================================
  // MODERATION Endpoints
  // ========================================================================

  describe('MODERATION endpoints', () => {
    it('should have reports create endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.REPORTS.CREATE).toBe('/moderation/reports');
    });

    it('should have reports list endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.REPORTS.LIST).toBe('/moderation/reports');
    });

    it('should generate report by ID endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.REPORTS.BY_ID('rpt-1')).toBe('/moderation/reports/rpt-1');
    });

    it('should have my reports endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.REPORTS.MY_REPORTS).toBe('/moderation/reports/my');
    });

    it('should have block endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.BLOCKING.BLOCK).toBe('/moderation/blocking/block');
    });

    it('should generate unblock endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.BLOCKING.UNBLOCK('u1')).toBe('/moderation/blocking/unblock/u1');
    });

    it('should have blocked users endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.BLOCKING.BLOCKED_USERS).toBe('/moderation/blocking/blocked');
    });

    it('should generate is-blocked endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.BLOCKING.IS_BLOCKED('u1')).toBe('/moderation/blocking/is-blocked/u1');
    });

    it('should have stats endpoint', () => {
      expect(API_ENDPOINTS.MODERATION.STATS).toBe('/moderation/stats');
    });
  });

  // ========================================================================
  // Growth Endpoints (lowercase)
  // ========================================================================

  describe('growth endpoints', () => {
    it('should have group purchases create endpoint', () => {
      expect(API_ENDPOINTS.growth.groupPurchases.create).toBe('/growth/group-purchases');
    });

    it('should generate group purchases venue endpoint', () => {
      expect(API_ENDPOINTS.growth.groupPurchases.venue('v1')).toBe(
        '/growth/group-purchases/venue/v1'
      );
    });

    it('should generate group purchases user endpoint', () => {
      expect(API_ENDPOINTS.growth.groupPurchases.user('u1')).toBe(
        '/growth/group-purchases/user/u1'
      );
    });

    it('should generate group purchases join endpoint', () => {
      expect(API_ENDPOINTS.growth.groupPurchases.join('gp-1')).toBe(
        '/growth/group-purchases/gp-1/join'
      );
    });

    it('should generate group purchases complete endpoint', () => {
      expect(API_ENDPOINTS.growth.groupPurchases.complete('gp-1')).toBe(
        '/growth/group-purchases/gp-1/complete'
      );
    });

    it('should have referrals generate endpoint', () => {
      expect(API_ENDPOINTS.growth.referrals.generate).toBe('/growth/referrals/generate');
    });

    it('should have referrals apply endpoint', () => {
      expect(API_ENDPOINTS.growth.referrals.apply).toBe('/growth/referrals/apply');
    });

    it('should generate referrals stats endpoint', () => {
      expect(API_ENDPOINTS.growth.referrals.stats('u1')).toBe('/growth/referrals/stats/u1');
    });

    it('should generate referrals rewards endpoint', () => {
      expect(API_ENDPOINTS.growth.referrals.rewards('u1')).toBe('/growth/referrals/rewards/u1');
    });

    it('should have share endpoint', () => {
      expect(API_ENDPOINTS.growth.share).toBe('/growth/share');
    });

    it('should have story templates endpoint', () => {
      expect(API_ENDPOINTS.growth.storyTemplates).toBe('/growth/story-templates');
    });
  });

  // ========================================================================
  // Content Endpoints (lowercase)
  // ========================================================================

  describe('content endpoints', () => {
    it('should have performers search endpoint', () => {
      expect(API_ENDPOINTS.content.performers.search).toBe('/content/performers/search');
    });

    it('should generate performer genre endpoint', () => {
      expect(API_ENDPOINTS.content.performers.genre('house')).toBe('/content/performers/genre/house');
    });

    it('should have performers trending endpoint', () => {
      expect(API_ENDPOINTS.content.performers.trending).toBe('/content/performers/trending');
    });

    it('should generate performer detail endpoint', () => {
      expect(API_ENDPOINTS.content.performers.detail('p1')).toBe('/content/performers/p1');
    });

    it('should generate performer follow endpoint', () => {
      expect(API_ENDPOINTS.content.performers.follow('p1')).toBe('/content/performers/p1/follow');
    });

    it('should generate performer unfollow endpoint', () => {
      expect(API_ENDPOINTS.content.performers.unfollow('p1')).toBe('/content/performers/p1/unfollow');
    });

    it('should generate performer posts endpoint', () => {
      expect(API_ENDPOINTS.content.performers.posts('p1')).toBe('/content/performers/p1/posts');
    });

    it('should generate performer feed endpoint', () => {
      expect(API_ENDPOINTS.content.performers.feed('u1')).toBe('/content/performers/feed/u1');
    });

    it('should generate performer likePost endpoint', () => {
      expect(API_ENDPOINTS.content.performers.likePost('p1', 'post-1')).toBe(
        '/content/performers/p1/posts/post-1/like'
      );
    });

    it('should generate performer rate endpoint', () => {
      expect(API_ENDPOINTS.content.performers.rate('p1')).toBe('/content/performers/p1/rate');
    });

    it('should have highlights upload endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.upload).toBe('/content/highlights');
    });

    it('should generate highlight venue endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.venue('v1')).toBe(
        '/content/highlights/venue/v1'
      );
    });

    it('should generate highlight event endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.event('evt-1')).toBe(
        '/content/highlights/event/evt-1'
      );
    });

    it('should generate highlight user endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.user('u1')).toBe(
        '/content/highlights/user/u1'
      );
    });

    it('should have highlights trending endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.trending).toBe('/content/highlights/trending');
    });

    it('should generate highlights feed endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.feed('u1')).toBe(
        '/content/highlights/feed/u1'
      );
    });

    it('should generate highlight view endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.view('h1')).toBe(
        '/content/highlights/h1/view'
      );
    });

    it('should generate highlight like endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.like('h1')).toBe(
        '/content/highlights/h1/like'
      );
    });

    it('should generate highlight unlike endpoint', () => {
      expect(API_ENDPOINTS.content.highlights.unlike('h1')).toBe(
        '/content/highlights/h1/unlike'
      );
    });
  });

  // ========================================================================
  // Lowercase events endpoints (aliases)
  // ========================================================================

  describe('events lowercase endpoints', () => {
    it('should have list endpoint', () => {
      expect(API_ENDPOINTS.events.list).toBe('/events');
    });

    it('should have upcoming endpoint', () => {
      expect(API_ENDPOINTS.events.upcoming).toBe('/events/upcoming');
    });

    it('should generate detail endpoint', () => {
      expect(API_ENDPOINTS.events.detail('e1')).toBe('/events/e1');
    });

    it('should generate venue endpoint', () => {
      expect(API_ENDPOINTS.events.venue('v1')).toBe('/events/venue/v1');
    });

    it('should generate performer endpoint', () => {
      expect(API_ENDPOINTS.events.performer('p1')).toBe('/events/performer/p1');
    });

    it('should have tickets purchase endpoint', () => {
      expect(API_ENDPOINTS.events.tickets.purchase).toBe('/events/tickets/purchase');
    });

    it('should have tickets validate endpoint', () => {
      expect(API_ENDPOINTS.events.tickets.validate).toBe('/events/tickets/validate');
    });

    it('should generate guestList venue endpoint', () => {
      expect(API_ENDPOINTS.events.guestList.venue('v1')).toBe('/events/guestlist/venue/v1');
    });

    it('should have guestList check endpoint', () => {
      expect(API_ENDPOINTS.events.guestList.check).toBe('/events/guestlist/check');
    });
  });

  // ========================================================================
  // Lowercase social endpoints (aliases)
  // ========================================================================

  describe('social lowercase endpoints', () => {
    it('should have friends request endpoint', () => {
      expect(API_ENDPOINTS.social.friends.request).toBe('/social/friends/request');
    });

    it('should have friends list endpoint', () => {
      expect(API_ENDPOINTS.social.friends.list).toBe('/social/friends');
    });

    it('should generate crews detail endpoint', () => {
      expect(API_ENDPOINTS.social.crews.detail('c1')).toBe('/social/crews/c1');
    });

    it('should generate crews addMember endpoint', () => {
      expect(API_ENDPOINTS.social.crews.addMember('c1')).toBe('/social/crews/c1/members/add');
    });

    it('should generate crews removeMember endpoint', () => {
      expect(API_ENDPOINTS.social.crews.removeMember('c1', 'u1')).toBe('/social/crews/c1/members/u1');
    });

    it('should have sync contacts endpoint', () => {
      expect(API_ENDPOINTS.social.sync.contacts).toBe('/social/sync/contacts');
    });

    it('should have sync instagram endpoint', () => {
      expect(API_ENDPOINTS.social.sync.instagram).toBe('/social/sync/instagram');
    });

    it('should generate challenges userProgress endpoint', () => {
      expect(API_ENDPOINTS.social.challenges.userProgress('ch-1', 'u1')).toBe(
        '/social/challenges/ch-1/progress'
      );
    });
  });

  // ========================================================================
  // Pricing Endpoints
  // ========================================================================

  describe('pricing endpoints', () => {
    it('should generate current pricing endpoint', () => {
      expect(API_ENDPOINTS.pricing.dynamic.current('v1')).toBe(
        '/pricing/dynamic/current/v1'
      );
    });

    it('should have calculate endpoint', () => {
      expect(API_ENDPOINTS.pricing.dynamic.calculate).toBe('/pricing/dynamic/calculate');
    });

    it('should generate history endpoint', () => {
      expect(API_ENDPOINTS.pricing.dynamic.history('v1')).toBe('/pricing/dynamic/history/v1');
    });

    it('should have alerts create endpoint', () => {
      expect(API_ENDPOINTS.pricing.alerts.create).toBe('/pricing/alerts');
    });

    it('should generate alerts user endpoint', () => {
      expect(API_ENDPOINTS.pricing.alerts.user('u1')).toBe('/pricing/alerts/user/u1');
    });

    it('should generate alerts venue endpoint', () => {
      expect(API_ENDPOINTS.pricing.alerts.venue('v1')).toBe('/pricing/alerts/venue/v1');
    });

    it('should generate alerts update endpoint', () => {
      expect(API_ENDPOINTS.pricing.alerts.update('a1')).toBe('/pricing/alerts/a1');
    });

    it('should generate alerts deactivate endpoint', () => {
      expect(API_ENDPOINTS.pricing.alerts.deactivate('a1')).toBe('/pricing/alerts/a1/deactivate');
    });

    it('should generate alerts delete endpoint', () => {
      expect(API_ENDPOINTS.pricing.alerts.delete('a1')).toBe('/pricing/alerts/a1');
    });
  });

  // ========================================================================
  // Retention Endpoints
  // ========================================================================

  describe('retention endpoints', () => {
    it('should generate user streaks endpoint', () => {
      expect(API_ENDPOINTS.retention.streaks.user('u1')).toBe(
        '/retention/streaks/user/u1'
      );
    });

    it('should generate increment streak endpoint', () => {
      expect(API_ENDPOINTS.retention.streaks.increment('s1')).toBe(
        '/retention/streaks/s1/increment'
      );
    });

    it('should generate claim milestone endpoint', () => {
      expect(API_ENDPOINTS.retention.streaks.claimMilestone('s1', 7)).toBe(
        '/retention/streaks/s1/milestone/7'
      );
    });

    it('should generate leaderboard endpoint', () => {
      expect(API_ENDPOINTS.retention.streaks.leaderboard('weekly')).toBe(
        '/retention/streaks/leaderboard/weekly'
      );
    });

    it('should have at-risk streaks endpoint', () => {
      expect(API_ENDPOINTS.retention.streaks.atRisk).toBe('/retention/streaks/at-risk');
    });

    it('should have memories create endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.create).toBe('/retention/memories');
    });

    it('should generate memories timeline endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.timeline('u1')).toBe(
        '/retention/memories/timeline/u1'
      );
    });

    it('should generate memories venue endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.venue('v1')).toBe(
        '/retention/memories/venue/v1'
      );
    });

    it('should generate memories tagged endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.tagged('u1')).toBe(
        '/retention/memories/tagged/u1'
      );
    });

    it('should generate memories onThisDay endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.onThisDay('u1')).toBe(
        '/retention/memories/on-this-day/u1'
      );
    });

    it('should generate memories highlights endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.highlights('u1')).toBe(
        '/retention/memories/highlights/u1'
      );
    });

    it('should generate memories like endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.like('m1')).toBe(
        '/retention/memories/m1/like'
      );
    });

    it('should generate memories addComment endpoint', () => {
      expect(API_ENDPOINTS.retention.memories.addComment('m1')).toBe(
        '/retention/memories/m1/comments'
      );
    });
  });

  // ========================================================================
  // Business Endpoints
  // ========================================================================

  describe('business endpoints', () => {
    it('should have register endpoint', () => {
      expect(API_ENDPOINTS.business.register).toBe('/business/register');
    });

    it('should generate verify endpoint', () => {
      expect(API_ENDPOINTS.business.verify('tok-123')).toBe('/business/verify/tok-123');
    });

    it('should have resendVerification endpoint', () => {
      expect(API_ENDPOINTS.business.resendVerification).toBe('/business/resend-verification');
    });

    it('should have profile endpoint', () => {
      expect(API_ENDPOINTS.business.profile).toBe('/business/profile');
    });

    it('should have updateProfile endpoint', () => {
      expect(API_ENDPOINTS.business.updateProfile).toBe('/business/profile');
    });
  });

  // ========================================================================
  // Venue Management Endpoints
  // ========================================================================

  describe('venueManagement endpoints', () => {
    it('should have roles endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.roles).toBe('/venue-management/roles');
    });

    it('should generate detail endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.detail('v1')).toBe('/venue-management/v1');
    });

    it('should generate updateInfo endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.updateInfo('v1')).toBe('/venue-management/v1/info');
    });

    it('should generate updateDisplay endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.updateDisplay('v1')).toBe('/venue-management/v1/display');
    });

    it('should generate assignRole endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.assignRole('v1')).toBe('/venue-management/v1/roles');
    });

    it('should generate removeRole endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.removeRole('v1', 'r1')).toBe(
        '/venue-management/v1/roles/r1'
      );
    });

    it('should generate staff endpoint', () => {
      expect(API_ENDPOINTS.venueManagement.staff('v1')).toBe('/venue-management/v1/staff');
    });
  });
});
