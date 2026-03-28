import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar as CalendarIcon, Filter, Music, DollarSign } from 'lucide-react-native';
import { useEvents } from '@/contexts/EventsContext';
import { EventCard } from '@/components/EventCard';
import * as Haptics from 'expo-haptics';

type TimeFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_WEEKEND' | 'THIS_MONTH';

export default function CalendarScreen() {
  const { events, upcomingEvents, isLoading } = useEvents();
  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    events.forEach(event => {
      if (event.genres) {
        event.genres.forEach(genre => genres.add(genre));
      }
    });
    return Array.from(genres).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Time filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);

    switch (timeFilter) {
      case 'TODAY':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate < endOfToday;
        });
        break;
      case 'THIS_WEEK':
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate < endOfWeek;
        });
        break;
      case 'THIS_WEEKEND':
        const friday = new Date(today);
        const daysUntilFriday = (5 - friday.getDay() + 7) % 7;
        friday.setDate(friday.getDate() + daysUntilFriday);
        const monday = new Date(friday);
        monday.setDate(monday.getDate() + 3);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= friday && eventDate < monday;
        });
        break;
      case 'THIS_MONTH':
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate < endOfMonth;
        });
        break;
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(event =>
        event.genres && event.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    // Price filter
    if (priceFilter === 'FREE') {
      filtered = filtered.filter(event => !event.ticketTiers || event.ticketTiers.length === 0);
    } else if (priceFilter === 'PAID') {
      filtered = filtered.filter(event => event.ticketTiers && event.ticketTiers.length > 0);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered;
  }, [events, timeFilter, selectedGenres, priceFilter]);

  const toggleGenre = (genre: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeFilter('ALL');
    setSelectedGenres([]);
    setPriceFilter('ALL');
  };

  const activeFiltersCount = [
    timeFilter !== 'ALL' ? 1 : 0,
    selectedGenres.length,
    priceFilter !== 'ALL' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const timeFilters: { type: TimeFilter; label: string }[] = [
    { type: 'ALL', label: 'All' },
    { type: 'TODAY', label: 'Today' },
    { type: 'THIS_WEEK', label: 'This Week' },
    { type: 'THIS_WEEKEND', label: 'Weekend' },
    { type: 'THIS_MONTH', label: 'This Month' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Events Calendar</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFilters(!showFilters);
            }}
          >
            <Filter size={20} color="#ff0080" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Time Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeFilterScroll}
          contentContainerStyle={styles.timeFilterContent}
        >
          {timeFilters.map(filter => {
            const isSelected = timeFilter === filter.type;
            return (
              <TouchableOpacity
                key={filter.type}
                style={[styles.timeFilterChip, isSelected && styles.timeFilterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTimeFilter(filter.type);
                }}
              >
                <Text style={[styles.timeFilterLabel, isSelected && styles.timeFilterLabelActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.filtersPanelGradient}
            >
              <View style={styles.filtersPanelHeader}>
                <Text style={styles.filtersPanelTitle}>Filters</Text>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity onPress={clearFilters}>
                    <Text style={styles.clearFiltersText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <DollarSign size={16} color="#ff0080" />
                  <Text style={styles.filterSectionTitle}>Price</Text>
                </View>
                <View style={styles.filterOptions}>
                  {(['ALL', 'FREE', 'PAID'] as const).map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOption,
                        priceFilter === option && styles.filterOptionActive,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPriceFilter(option);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          priceFilter === option && styles.filterOptionTextActive,
                        ]}
                      >
                        {option === 'ALL' ? 'All' : option === 'FREE' ? 'Free' : 'Paid'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {allGenres.length > 0 && (
                <View style={styles.filterSection}>
                  <View style={styles.filterSectionHeader}>
                    <Music size={16} color="#ff0080" />
                    <Text style={styles.filterSectionTitle}>Genres</Text>
                  </View>
                  <View style={styles.genreOptions}>
                    {allGenres.map(genre => {
                      const isSelected = selectedGenres.includes(genre);
                      return (
                        <TouchableOpacity
                          key={genre}
                          style={[
                            styles.genreChip,
                            isSelected && styles.genreChipActive,
                          ]}
                          onPress={() => toggleGenre(genre)}
                        >
                          <Text
                            style={[
                              styles.genreChipText,
                              isSelected && styles.genreChipTextActive,
                            ]}
                          >
                            {genre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Events List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff0080" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <CalendarIcon size={64} color="#666" />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFiltersCount > 0
                  ? 'Try adjusting your filters'
                  : 'Check back soon for upcoming events'}
              </Text>
              {activeFiltersCount > 0 && (
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                size="large"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/events/${event.id}` as any);
                }}
              />
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#00d4ff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  filterButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff0080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  timeFilterScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  timeFilterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  timeFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeFilterChipActive: {
    backgroundColor: 'rgba(255, 0, 128, 0.2)',
    borderColor: '#ff0080',
  },
  timeFilterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  timeFilterLabelActive: {
    color: '#ff0080',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: '#00d4ff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  filterButtonTextActive: {
    color: '#000',
  },
  filtersPanel: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filtersPanelGradient: {
    padding: 16,
    borderRadius: 12,
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersPanelTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff0080',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(255, 0, 128, 0.2)',
    borderColor: '#ff0080',
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  filterOptionTextActive: {
    color: '#ff0080',
  },
  genreOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtersSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  genreFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genreChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: '#00d4ff',
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  genreChipTextActive: {
    color: '#00d4ff',
  },
  clearFiltersButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ff0080',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#ff0080',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventGradient: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff0080',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  dateBadgeMonth: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    textTransform: 'uppercase',
  },
  dateBadgeDay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  eventInfo: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  eventMetaText: {
    flex: 1,
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  eventGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  eventGenreTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventGenreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a855f7',
  },
});
