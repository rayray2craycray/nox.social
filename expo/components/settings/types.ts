/**
 * Settings Screen Types
 * Shared types for settings components
 */

export interface LinkedCard {
  id: string;
  last4: string;
  brand: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  venueId: string;
  venueName: string;
  amount: number;
  pointsEarned: number;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

export const COLORS = {
  background: '#000000',
  card: '#1a1a1a',
  cardSecondary: '#2a2a2a',
  accent: '#ff0080',
  purple: '#9d4edd',
  text: '#ffffff',
  textSecondary: '#999999',
  border: '#2a2a3a',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ef4444',
} as const;
