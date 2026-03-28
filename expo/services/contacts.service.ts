/**
 * Contacts Service — stub
 * expo-contacts is not linked. Contact sync is disabled (EXPO_PUBLIC_ENABLE_CONTACT_SYNC !== 'true').
 */

export interface ContactMatch {
  contactId: string;
  name: string;
  phoneNumber: string;
  userId?: string;
  avatarUrl?: string;
}

export interface ContactSyncResult {
  totalContacts: number;
  matchedContacts: ContactMatch[];
  syncedAt: string;
}

export async function requestContactsPermission(): Promise<boolean> {
  return false;
}

export async function getPhoneContacts(): Promise<[]> {
  return [];
}

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

export async function syncContactsWithBackend(): Promise<ContactSyncResult> {
  return { totalContacts: 0, matchedContacts: [], syncedAt: new Date().toISOString() };
}

export async function getContactSuggestions(): Promise<ContactMatch[]> {
  return [];
}
