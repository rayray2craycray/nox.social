/**
 * API Configuration
 * Defines API endpoints and base URL
 */

import Constants from 'expo-constants';

// Get API base URL from environment
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Google Maps API Key (from app.config.js)
export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  
  // Users
  USERS: {
    ME: '/users/me',
    BY_ID: (id: string) => `/users/${id}`,
    UPDATE: '/users/me',
  },
  
  // Venues
  VENUES: {
    LIST: '/venues',
    BY_ID: (id: string) => `/venues/${id}`,
    NEARBY: '/venues/nearby',
    SEARCH: '/venues/search',
  },
  
  // Events
  EVENTS: {
    LIST: '/events',
    BY_ID: (id: string) => `/events/${id}`,
    BY_VENUE: (venueId: string) => `/events/venue/${venueId}`,
    CREATE: '/events',
  },
  
  // Tickets
  TICKETS: {
    PURCHASE: '/events/tickets/purchase',
    USER: '/events/tickets/user',
    BY_QR: (qrCode: string) => `/events/tickets/qr/${qrCode}`,
    TRANSFER: (id: string) => `/events/tickets/${id}/transfer`,
    CHECKIN: '/events/tickets/checkin',
    CANCEL: (id: string) => `/events/tickets/${id}/cancel`,
  },
  
  // Guest List
  GUESTLIST: {
    ADD: '/events/guestlist/add',
    BY_VENUE: (venueId: string) => `/events/guestlist/venue/${venueId}`,
    BY_EVENT: (eventId: string) => `/events/guestlist/event/${eventId}`,
    CHECKIN: (id: string) => `/events/guestlist/${id}/checkin`,
    CONFIRM: (id: string) => `/events/guestlist/${id}/confirm`,
    NOSHOW: (id: string) => `/events/guestlist/${id}/noshow`,
    UPDATE: (id: string) => `/events/guestlist/${id}`,
    REMOVE: (id: string) => `/events/guestlist/${id}`,
    SEARCH: '/events/guestlist/search',
  },
  
  // Social
  SOCIAL: {
    FRIENDS: {
      REQUEST: '/social/friends/request',
      ACCEPT: (id: string) => `/social/friends/accept/${id}`,
      REJECT: (id: string) => `/social/friends/reject/${id}`,
      REMOVE: (id: string) => `/social/friends/${id}`,
      LIST: '/social/friends',
      PENDING: '/social/friends/requests/pending',
    },
    CREWS: {
      LIST: '/social/crews',
      BY_ID: (id: string) => `/social/crews/${id}`,
      USER_CREWS: (userId: string) => `/social/crews/user/${userId}`,
      SEARCH: '/social/crews/search',
      ACTIVE: '/social/crews/discover/active',
      JOIN: (id: string) => `/social/crews/${id}/join`,
      LEAVE: (id: string) => `/social/crews/${id}/leave`,
      UPDATE: (id: string) => `/social/crews/${id}`,
      DELETE: (id: string) => `/social/crews/${id}`,
      INVITE: (id: string) => `/social/crews/${id}/invite`,
    },
    CHALLENGES: {
      ACTIVE: '/social/challenges/active',
      BY_ID: (id: string) => `/social/challenges/${id}`,
      USER: (userId: string) => `/social/challenges/user/${userId}`,
      JOIN: (id: string) => `/social/challenges/${id}/join`,
      PROGRESS: '/social/challenges/progress',
      UPDATE_PROGRESS: (id: string) => `/social/challenges/${id}/progress`,
      CLAIM: (id: string) => `/social/challenges/${id}/claim`,
    },
  },
  
  // Chat
  CHAT: {
    CONVERSATIONS: {
      LIST: '/chat/conversations',
      BY_ID: (id: string) => `/chat/conversations/${id}`,
      CREATE: '/chat/conversations',
      MESSAGES: (id: string) => `/chat/conversations/${id}/messages`,
    },
    MESSAGES: {
      SEND: '/chat/messages',
      EDIT: (messageId: string) => `/chat/messages/${messageId}`,
      DELETE: (messageId: string) => `/chat/messages/${messageId}`,
      REACT: (messageId: string) => `/chat/messages/${messageId}/reactions`,
    },
  },
  
  // Videos
  VIDEOS: {
    FEED: '/videos/feed',
    BY_ID: (id: string) => `/videos/${id}`,
    UPLOAD: '/videos/upload',
  },
  
  // Upload
  UPLOAD: {
    PROFILE_PICTURE: '/upload/profile-picture',
    HIGHLIGHT: '/upload/highlight',
    MEMORY: '/upload/memory',
    VENUE: '/upload/venue',
    BUSINESS_DOCUMENT: '/upload/business-document',
  },

  // Moderation
  MODERATION: {
    REPORTS: {
      CREATE: '/moderation/reports',
      LIST: '/moderation/reports',
      BY_ID: (id: string) => `/moderation/reports/${id}`,
      MY_REPORTS: '/moderation/reports/my',
    },
    BLOCKING: {
      BLOCK: '/moderation/blocking/block',
      UNBLOCK: (userId: string) => `/moderation/blocking/unblock/${userId}`,
      BLOCKED_USERS: '/moderation/blocking/blocked',
      IS_BLOCKED: (userId: string) => `/moderation/blocking/is-blocked/${userId}`,
    },
    STATS: '/moderation/stats',
  },

  // Content - Performers & Highlights
  content: {
    performers: {
      search: '/content/performers/search',
      genre: (genre: string) => `/content/performers/genre/${genre}`,
      trending: '/content/performers/trending',
      detail: (id: string) => `/content/performers/${id}`,
      follow: (id: string) => `/content/performers/${id}/follow`,
      unfollow: (id: string) => `/content/performers/${id}/unfollow`,
      posts: (id: string) => `/content/performers/${id}/posts`,
      feed: (userId: string) => `/content/performers/feed/${userId}`,
      likePost: (performerId: string, postId: string) => `/content/performers/${performerId}/posts/${postId}/like`,
      rate: (id: string) => `/content/performers/${id}/rate`,
    },
    highlights: {
      upload: '/content/highlights',
      venue: (venueId: string) => `/content/highlights/venue/${venueId}`,
      event: (eventId: string) => `/content/highlights/event/${eventId}`,
      user: (userId: string) => `/content/highlights/user/${userId}`,
      trending: '/content/highlights/trending',
      feed: (userId: string) => `/content/highlights/feed/${userId}`,
      view: (id: string) => `/content/highlights/${id}/view`,
      like: (id: string) => `/content/highlights/${id}/like`,
      unlike: (id: string) => `/content/highlights/${id}/unlike`,
    },
  },

  // Growth Features
  growth: {
    groupPurchases: {
      create: '/growth/group-purchases',
      venue: (venueId: string) => `/growth/group-purchases/venue/${venueId}`,
      user: (userId: string) => `/growth/group-purchases/user/${userId}`,
      join: (id: string) => `/growth/group-purchases/${id}/join`,
      complete: (id: string) => `/growth/group-purchases/${id}/complete`,
    },
    referrals: {
      generate: '/growth/referrals/generate',
      apply: '/growth/referrals/apply',
      stats: (userId: string) => `/growth/referrals/stats/${userId}`,
      rewards: (userId: string) => `/growth/referrals/rewards/${userId}`,
    },
    share: '/growth/share',
    storyTemplates: '/growth/story-templates',
  },

  // Lowercase aliases for backward compatibility
  events: {
    list: '/events',
    byId: (id: string) => `/events/${id}`,
    byVenue: (venueId: string) => `/events/venue/${venueId}`,
    tickets: {
      purchase: '/events/tickets/purchase',
      user: '/events/tickets/user',
      byQr: (qrCode: string) => `/events/tickets/qr/${qrCode}`,
      transfer: (id: string) => `/events/tickets/${id}/transfer`,
      checkin: '/events/tickets/checkin',
      cancel: (id: string) => `/events/tickets/${id}/cancel`,
    },
    guestlist: {
      add: '/events/guestlist/add',
      byVenue: (venueId: string) => `/events/guestlist/venue/${venueId}`,
      byEvent: (eventId: string) => `/events/guestlist/event/${eventId}`,
      checkin: (id: string) => `/events/guestlist/${id}/checkin`,
      confirm: (id: string) => `/events/guestlist/${id}/confirm`,
      noshow: (id: string) => `/events/guestlist/${id}/noshow`,
      update: (id: string) => `/events/guestlist/${id}`,
      remove: (id: string) => `/events/guestlist/${id}`,
      search: '/events/guestlist/search',
    },
  },

  social: {
    friends: {
      request: '/social/friends/request',
      accept: (id: string) => `/social/friends/accept/${id}`,
      reject: (id: string) => `/social/friends/reject/${id}`,
      remove: (id: string) => `/social/friends/${id}`,
      list: '/social/friends',
      pending: '/social/friends/requests/pending',
    },
    crews: {
      list: '/social/crews',
      byId: (id: string) => `/social/crews/${id}`,
      userCrews: (userId: string) => `/social/crews/user/${userId}`,
      search: '/social/crews/search',
      active: '/social/crews/discover/active',
      join: (id: string) => `/social/crews/${id}/join`,
      leave: (id: string) => `/social/crews/${id}/leave`,
      update: (id: string) => `/social/crews/${id}`,
      delete: (id: string) => `/social/crews/${id}`,
      invite: (id: string) => `/social/crews/${id}/invite`,
    },
    challenges: {
      active: '/social/challenges/active',
      byId: (id: string) => `/social/challenges/${id}`,
      user: (userId: string) => `/social/challenges/user/${userId}`,
      join: (id: string) => `/social/challenges/${id}/join`,
      progress: '/social/challenges/progress',
      updateProgress: (id: string) => `/social/challenges/${id}/progress`,
      claim: (id: string) => `/social/challenges/${id}/claim`,
    },
  },
};
