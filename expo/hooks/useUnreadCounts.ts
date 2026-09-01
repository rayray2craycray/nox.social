/**
 * useUnreadCounts
 *
 * Real unread message counts per channel for the current user, from
 * POST /api/chat/unread-counts. Returns a getter `(channelId) => number` and a
 * `markRead(channelId)` that clears the badge (POST /chat/channels/:id/read)
 * and refreshes the counts. Replaces the hardcoded unreadCount: 0 placeholder.
 */
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/api/config';

export function useUnreadCounts(channelIds: string[]) {
  const queryClient = useQueryClient();
  const key = [...channelIds].sort().join(',');

  const query = useQuery({
    queryKey: ['chat-unread-counts', key],
    enabled: channelIds.length > 0,
    staleTime: 20_000,
    refetchInterval: 30_000, // keep badges roughly live while the screen is open
    queryFn: async () => {
      const resp = await apiClient.post<{ success: boolean; counts: Record<string, number> }>(
        '/chat/unread-counts',
        { channelIds },
      );
      return resp.data?.counts ?? {};
    },
  });

  const counts = query.data ?? {};

  const getUnread = useCallback(
    (channelId: string): number => counts[channelId] ?? 0,
    [counts],
  );

  const markRead = useCallback(
    async (channelId: string) => {
      try {
        await apiClient.post(`/chat/channels/${encodeURIComponent(channelId)}/read`);
      } catch {
        // Non-fatal — the badge will simply re-clear on the next refetch.
      }
      // Optimistically clear this channel's badge, then refetch to confirm.
      queryClient.setQueryData<Record<string, number>>(['chat-unread-counts', key], (prev) =>
        prev ? { ...prev, [channelId]: 0 } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['chat-unread-counts'] });
    },
    [queryClient, key],
  );

  return { getUnread, markRead };
}
