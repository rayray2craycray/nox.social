/**
 * useVenueMemberCounts
 *
 * Fetches real member counts (badge-holders) for a set of venues from
 * POST /api/v1/venues/member-counts. Replaces the hardcoded "1 member"
 * placeholder on the servers screen. Returns a { [venueId]: number } map;
 * unknown venues read as 0.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/config';

export function useVenueMemberCounts(venueIds: string[]) {
  const key = [...venueIds].sort().join(',');

  const query = useQuery({
    queryKey: ['venue-member-counts', key],
    enabled: venueIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const resp = await apiClient.post<{ success: boolean; counts: Record<string, number> }>(
        '/v1/venues/member-counts',
        { venueIds },
      );
      return resp.data?.counts ?? {};
    },
  });

  const counts = query.data ?? {};
  return (venueId: string): number => counts[venueId] ?? 0;
}
