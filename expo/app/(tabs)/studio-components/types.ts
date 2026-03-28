/**
 * Studio Screen Types
 * Shared types for promo video creation
 */

export type PromoStep = 'SELECT_METHOD' | 'RECORDING' | 'TRIM' | 'PREVIEW' | 'CUSTOMIZE' | 'SHARE';
export type SafeZoneType = 'instagram' | 'tiktok' | 'none';
export type VibeFilter = 'none' | 'neon-glitch' | 'afterhours-noir' | 'vhs-retro' | 'cyber-wave' | 'golden-hour';
export type StickerType = 'none' | 'get-tickets' | 'join-lobby' | 'live-tonight' | 'swipe-up';

export const COLORS = {
  background: '#000000',
  card: '#1a1a1a',
  accent: '#ff0080',
  purple: '#9d4edd',
  text: '#ffffff',
  textSecondary: '#999999',
  border: '#2a2a3a',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ef4444',
} as const;
