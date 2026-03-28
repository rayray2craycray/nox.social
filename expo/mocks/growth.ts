import {
  GroupPurchase,
  GroupPurchaseInvite,
  Referral,
  ReferralReward,
  UserReferralStats,
  StoryTemplate,
  ShareableContent,
} from '@/types';

// ===== GROUP PURCHASES =====

export const mockGroupPurchases: GroupPurchase[] = [
  {
    id: 'gp-1',
    initiatorId: 'user-friend-1',
    venueId: 'venue-1',
    ticketType: 'TABLE',
    totalAmount: 500,
    perPersonAmount: 125,
    maxParticipants: 4,
    currentParticipants: ['user-friend-1', 'user-friend-2'],
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notes: 'VIP table for Friday night! 2 spots left',
  },
  {
    id: 'gp-2',
    initiatorId: 'user-friend-3',
    venueId: 'venue-2',
    ticketType: 'BOTTLE_SERVICE',
    totalAmount: 800,
    perPersonAmount: 200,
    maxParticipants: 4,
    currentParticipants: ['user-friend-3', 'user-friend-4', 'user-friend-6'],
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    notes: 'Bottle service at Velvet - need 1 more!',
  },
  {
    id: 'gp-3',
    initiatorId: 'user-me',
    venueId: 'venue-3',
    ticketType: 'ENTRY',
    totalAmount: 120,
    perPersonAmount: 30,
    maxParticipants: 4,
    currentParticipants: ['user-me', 'user-friend-1', 'user-friend-2', 'user-friend-8'],
    status: 'FULL',
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    notes: 'Saturday at Neon Pulse - Group complete!',
  },
  {
    id: 'gp-4',
    initiatorId: 'user-friend-6',
    venueId: 'venue-4',
    ticketType: 'TABLE',
    totalAmount: 400,
    perPersonAmount: 100,
    maxParticipants: 4,
    currentParticipants: ['user-friend-6'],
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    notes: 'Electric Ballroom next weekend - who\'s in?',
  },
  {
    id: 'gp-5',
    initiatorId: 'user-friend-2',
    venueId: 'venue-1',
    ticketType: 'ENTRY',
    totalAmount: 80,
    perPersonAmount: 20,
    maxParticipants: 4,
    currentParticipants: ['user-friend-2', 'user-me', 'user-friend-5', 'user-friend-7'],
    status: 'COMPLETED',
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    notes: 'Last Friday - had a blast!',
  },
];

export const mockGroupPurchaseInvites: GroupPurchaseInvite[] = [
  {
    id: 'gpi-1',
    groupPurchaseId: 'gp-1',
    inviterId: 'user-friend-1',
    inviteeId: 'user-me',
    status: 'PENDING',
    sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'gpi-2',
    groupPurchaseId: 'gp-2',
    inviterId: 'user-friend-3',
    inviteeId: 'user-me',
    status: 'PENDING',
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'gpi-3',
    groupPurchaseId: 'gp-3',
    inviterId: 'user-me',
    inviteeId: 'user-friend-8',
    status: 'ACCEPTED',
    sentAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    respondedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
];

// ===== REFERRALS =====

export const mockReferrals: Referral[] = [
  {
    id: 'ref-1',
    referrerId: 'user-me',
    refereeId: 'user-friend-5',
    referralCode: 'RORK-ALEX-2025',
    status: 'COMPLETED',
    rewardType: 'DISCOUNT',
    rewardValue: 10,
    usedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ref-2',
    referrerId: 'user-me',
    refereeId: 'user-friend-7',
    referralCode: 'RORK-ALEX-2025',
    status: 'COMPLETED',
    rewardType: 'DISCOUNT',
    rewardValue: 10,
    usedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ref-3',
    referrerId: 'user-friend-1',
    refereeId: 'user-me',
    referralCode: 'RORK-SARAH-2025',
    status: 'REWARDED',
    rewardType: 'FREE_DRINK',
    rewardValue: 1,
    usedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ref-4',
    referrerId: 'user-me',
    refereeId: 'suggested-2',
    referralCode: 'RORK-ALEX-2025',
    status: 'PENDING',
    rewardType: 'DISCOUNT',
    rewardValue: 10,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockReferralRewards: ReferralReward[] = [
  {
    id: 'reward-1',
    userId: 'user-me',
    referralId: 'ref-1',
    type: 'REFERRER',
    reward: {
      type: 'DISCOUNT',
      value: 10,
      description: '$10 off your next visit',
    },
    isUsed: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'reward-2',
    userId: 'user-me',
    referralId: 'ref-2',
    type: 'REFERRER',
    reward: {
      type: 'SKIP_LINE',
      value: 1,
      description: 'Skip the line once',
    },
    isUsed: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    usedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'reward-3',
    userId: 'user-me',
    referralId: 'ref-3',
    type: 'REFEREE',
    reward: {
      type: 'FREE_DRINK',
      value: 1,
      description: 'Free welcome drink',
    },
    isUsed: true,
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    usedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockUserReferralStats: UserReferralStats = {
  userId: 'user-me',
  referralCode: 'RORK-ALEX-2025',
  totalReferrals: 3,
  successfulReferrals: 2,
  totalRewardsEarned: 25, // $10 + $10 + $5 bonus
  pendingRewards: [mockReferralRewards[0]],
  lifetimeValue: 150, // Total value generated by referrals
};

// ===== STORY TEMPLATES =====

export const mockStoryTemplates: StoryTemplate[] = [
  {
    id: 'template-1',
    name: 'Venue Visit',
    type: 'VENUE',
    backgroundUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    overlayElements: [
      {
        type: 'TEXT',
        content: 'I\'m at {{venueName}}!',
        position: { x: 50, y: 20 },
        style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
      },
      {
        type: 'TEXT',
        content: 'Join me 👇',
        position: { x: 50, y: 85 },
        style: { fontSize: 24, color: '#ff0080' },
      },
      {
        type: 'STICKER',
        content: '🔥',
        position: { x: 80, y: 15 },
      },
    ],
    deepLink: 'nox://venue/{{venueId}}',
  },
  {
    id: 'template-2',
    name: 'Group Purchase',
    type: 'GROUP_INVITE',
    backgroundUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
    overlayElements: [
      {
        type: 'TEXT',
        content: 'Splitting tickets!',
        position: { x: 50, y: 25 },
        style: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
      },
      {
        type: 'TEXT',
        content: '{{spotsLeft}} spots left',
        position: { x: 50, y: 40 },
        style: { fontSize: 20, color: '#00d4ff' },
      },
      {
        type: 'TEXT',
        content: '${{pricePerPerson}} per person',
        position: { x: 50, y: 50 },
        style: { fontSize: 22, color: '#a855f7' },
      },
      {
        type: 'STICKER',
        content: '💰',
        position: { x: 10, y: 40 },
      },
      {
        type: 'QR_CODE',
        content: '{{deepLink}}',
        position: { x: 50, y: 75 },
      },
    ],
    deepLink: 'nox://group-purchase/{{groupPurchaseId}}',
  },
  {
    id: 'template-3',
    name: 'Referral Code',
    type: 'ACHIEVEMENT',
    backgroundUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    overlayElements: [
      {
        type: 'TEXT',
        content: 'Get $10 off Nox!',
        position: { x: 50, y: 30 },
        style: { fontSize: 30, fontWeight: 'bold', color: '#ffffff' },
      },
      {
        type: 'TEXT',
        content: 'Use my code:',
        position: { x: 50, y: 45 },
        style: { fontSize: 18, color: '#cccccc' },
      },
      {
        type: 'TEXT',
        content: '{{referralCode}}',
        position: { x: 50, y: 55 },
        style: { fontSize: 36, fontWeight: 'bold', color: '#ff0080', backgroundColor: 'rgba(0,0,0,0.7)', padding: 10 },
      },
      {
        type: 'STICKER',
        content: '🎉',
        position: { x: 15, y: 55 },
      },
      {
        type: 'STICKER',
        content: '🎉',
        position: { x: 85, y: 55 },
      },
    ],
    deepLink: 'nox://referral/{{referralCode}}',
  },
  {
    id: 'template-4',
    name: 'Event Announcement',
    type: 'EVENT',
    backgroundUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    overlayElements: [
      {
        type: 'TEXT',
        content: '{{eventName}}',
        position: { x: 50, y: 25 },
        style: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' },
      },
      {
        type: 'TEXT',
        content: '{{venueName}}',
        position: { x: 50, y: 40 },
        style: { fontSize: 20, color: '#00d4ff' },
      },
      {
        type: 'TEXT',
        content: '{{eventDate}} at {{eventTime}}',
        position: { x: 50, y: 50 },
        style: { fontSize: 18, color: '#ffffff' },
      },
      {
        type: 'TEXT',
        content: 'Get tickets 👇',
        position: { x: 50, y: 85 },
        style: { fontSize: 22, color: '#ff0080' },
      },
    ],
    deepLink: 'nox://event/{{eventId}}',
  },
];

export const mockShareableContent: ShareableContent[] = [
  {
    id: 'share-1',
    userId: 'user-me',
    type: 'EVENT',
    templateId: 'template-1',
    customData: {
      venueName: 'The Nox Room',
      venueId: 'venue-1',
    },
    deepLink: 'nox://venue/venue-1',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    shareCount: 5,
    clickCount: 2,
  },
  {
    id: 'share-2',
    userId: 'user-me',
    type: 'REFERRAL',
    templateId: 'template-3',
    customData: {
      referralCode: 'NOX-ALEX-2026',
    },
    deepLink: 'nox://referral/NOX-ALEX-2026',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    shareCount: 12,
    clickCount: 3,
  },
  {
    id: 'share-3',
    userId: 'user-friend-1',
    type: 'GROUP_PURCHASE',
    templateId: 'template-2',
    customData: {
      groupPurchaseId: 'gp-1',
      spotsLeft: 2,
      pricePerPerson: 125,
    },
    deepLink: 'nox://group-purchase/gp-1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    shareCount: 8,
    clickCount: 4,
  },
];
