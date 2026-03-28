import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRetention } from '@/contexts/RetentionContext';
import { MemoryCard } from '@/components/MemoryCard';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Camera, Video, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type FilterType = 'ALL' | 'CHECK_IN' | 'VIDEO' | 'PHOTO' | 'MILESTONE' | 'EVENT';

export default function MemoriesTimelineScreen() {
  const { memories, isLoading } = useRetention();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');

  const filteredMemories = useMemo(() => {
    return memories.filter((memory) => {
      if (selectedFilter === 'ALL') return true;
      return memory.type === selectedFilter;
    });
  }, [memories, selectedFilter]);

  // Group memories by month
  const groupedMemories = useMemo(() => {
    return filteredMemories.reduce((acc, memory) => {
      const date = new Date(memory.date);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(memory);
      return acc;
    }, {} as Record<string, typeof memories>);
  }, [filteredMemories]);

  const filters: { type: FilterType; label: string; icon: any }[] = [
    { type: 'ALL', label: 'All', icon: Filter },
    { type: 'CHECK_IN', label: 'Check-ins', icon: MapPin },
    { type: 'PHOTO', label: 'Photos', icon: Camera },
    { type: 'VIDEO', label: 'Videos', icon: Video },
    { type: 'EVENT', label: 'Events', icon: Calendar },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.gradient}>
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
          <Text style={styles.title}>My Memories</Text>
          <View style={styles.headerRight}>
            <Text style={styles.countBadge}>{filteredMemories.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map((filter) => {
            const IconComponent = filter.icon;
            const isSelected = selectedFilter === filter.type;
            return (
              <TouchableOpacity
                key={filter.type}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFilter(filter.type);
                }}
              >
                <IconComponent size={16} color={isSelected ? '#ff0080' : '#999'} />
                <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff0080" />
              <Text style={styles.loadingText}>Loading memories...</Text>
            </View>
          ) : filteredMemories.length === 0 ? (
            <View style={styles.emptyState}>
              <Camera size={64} color="#666" />
              <Text style={styles.emptyTitle}>No memories yet</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'ALL'
                  ? 'Start capturing moments at venues to build your timeline'
                  : `No ${selectedFilter.toLowerCase()} memories found`}
              </Text>
            </View>
          ) : (
            Object.entries(groupedMemories).map(([monthYear, monthMemories]) => (
              <View key={monthYear} style={styles.monthGroup}>
                <View style={styles.monthHeader}>
                  <Calendar size={16} color="#ff0080" />
                  <Text style={styles.monthTitle}>{monthYear}</Text>
                  <View style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>{monthMemories.length}</Text>
                  </View>
                </View>
                <View style={styles.monthMemories}>
                  {monthMemories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      size="medium"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // Navigate to memory detail view
                      }}
                    />
                  ))}
                </View>
              </View>
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
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  countBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ff0080',
    backgroundColor: 'rgba(255,0,128,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,0,128,0.2)',
    borderColor: '#ff0080',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  filterLabelActive: {
    color: '#ff0080',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  monthGroup: {
    marginBottom: 32,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  monthBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
  },
  monthMemories: {
    gap: 12,
  },
});
