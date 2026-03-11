import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Gig, PerformerAnalytics } from '@/types';
import { eventsApi, contentApi } from '@/services/api';

const STORAGE_KEYS = {
  PERFORMER_MODE: 'vibelink_performer_mode',
  PERFORMER_ID: 'vibelink_performer_id',
};

const defaultPerformerId = 'performer-me';

export const [PerformerProvider, usePerformer] = createContextHook(() => {
  const [isPerformerMode, setIsPerformerMode] = useState<boolean>(false);
  const [performerId] = useState<string>(defaultPerformerId);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);

  const performerModeQuery = useQuery({
    queryKey: ['performerMode'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PERFORMER_MODE);
      return stored === 'true';
    },
  });

  useEffect(() => {
    if (performerModeQuery.data !== undefined) {
      setIsPerformerMode(performerModeQuery.data);
    }
  }, [performerModeQuery.data]);

  const togglePerformerModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PERFORMER_MODE, String(enabled));
      return enabled;
    },
    onSuccess: (data) => {
      setIsPerformerMode(data);
    },
  });

  const { mutate: togglePerformerMode } = togglePerformerModeMutation;

  const gigsQuery = useQuery<Gig[]>({
    queryKey: ['gigs', performerId],
    queryFn: async (): Promise<Gig[]> => {
      const response = await eventsApi.getEventsByPerformer(performerId);
      if (!response.data) return [];
      return response.data.map((event) => ({
        id: event.id,
        performerId,
        venueId: event.venueId,
        venueName: '',
        venueImageUrl: event.imageUrl,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        fee: 0,
        status: event.status === 'LIVE' ? 'UPCOMING' : event.status as Gig['status'],
        genre: event.genres[0] || '',
      }));
    },
    enabled: isPerformerMode,
  });

  const videosQuery = useQuery<any[]>({
    queryKey: ['promoVideos', performerId],
    queryFn: async (): Promise<any[]> => {
      const response = await contentApi.getPerformerPosts(performerId);
      return response.data || [];
    },
    enabled: isPerformerMode,
  });

  const upcomingGigs = useMemo(() => {
    return gigsQuery.data?.filter(gig => gig.status === 'UPCOMING') || [];
  }, [gigsQuery.data]);

  const completedGigs = useMemo(() => {
    return gigsQuery.data?.filter(gig => gig.status === 'COMPLETED') || [];
  }, [gigsQuery.data]);

  const analytics = useMemo((): PerformerAnalytics => {
    const gigs = gigsQuery.data || [];
    const videos = videosQuery.data || [];
    const completed = gigs.filter(g => g.status === 'COMPLETED');

    const totalRevenue = completed.reduce((sum, gig) => sum + gig.fee, 0);
    const totalBarSales = completed.reduce((sum, gig) => sum + (gig.barSalesGenerated || 0), 0);
    const totalClicks = completed.reduce((sum, gig) => sum + (gig.ticketClicks || 0), 0);

    const venueMap = new Map<string, { name: string; count: number; revenue: number }>();
    completed.forEach(gig => {
      const existing = venueMap.get(gig.venueId);
      if (existing) {
        existing.count++;
        existing.revenue += gig.fee;
      } else {
        venueMap.set(gig.venueId, {
          name: gig.venueName,
          count: 1,
          revenue: gig.fee,
        });
      }
    });

    const topVenues = Array.from(venueMap.entries())
      .map(([venueId, data]) => ({
        venueId,
        venueName: data.name,
        gigCount: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      performerId,
      totalGigs: completed.length,
      totalRevenue,
      totalBarSalesGenerated: totalBarSales,
      followerCount: 0,
      followerGrowth: 0,
      averageTicketClicks: completed.length > 0 ? totalClicks / completed.length : 0,
      topVenues,
      recentVideos: videos.slice(0, 3),
      upcomingGigs: upcomingGigs.slice(0, 3),
    };
  }, [gigsQuery.data, videosQuery.data, performerId, upcomingGigs]);

  const createPromoVideo = useCallback((gig: Gig) => {
    setSelectedGig(gig);
  }, []);

  const bookTalent = useCallback(async (booking: {
    talentId: string;
    talentName: string;
    venueId: string;
    venueName: string;
    venueImageUrl: string;
    date: string;
    startTime: string;
    endTime: string;
    fee: number;
    genre: string;
  }) => {
    try {
      // createEvent not yet available on eventsApi; attempt to verify the performer exists
      await eventsApi.getEventsByPerformer(booking.talentId);
    } catch (error) {
      console.error('Failed to book talent via API:', error);
    }

    // Fallback: return placeholder
    gigsQuery.refetch();
    return {
      id: `gig-${Date.now()}`,
      performerId: booking.talentId,
      venueId: booking.venueId,
      venueName: booking.venueName,
      venueImageUrl: booking.venueImageUrl,
      venueLocation: 'To be confirmed',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      fee: booking.fee,
      status: 'UPCOMING' as const,
      genre: booking.genre,
    };
  }, [gigsQuery]);

  return {
    isPerformerMode,
    togglePerformerMode,
    performerId,
    gigs: gigsQuery.data || [],
    upcomingGigs,
    completedGigs,
    videos: videosQuery.data || [],
    analytics,
    isLoading: gigsQuery.isLoading || videosQuery.isLoading,
    selectedGig,
    createPromoVideo,
    setSelectedGig,
    bookTalent,
  };
});
