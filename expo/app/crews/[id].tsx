import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Users,
  Crown,
  Calendar,
  UserPlus,
  LogOut,
  TrendingUp,
} from 'lucide-react-native';
import { useSocial } from '@/contexts/SocialContext';
import * as Haptics from 'expo-haptics';

export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { crews, crewPlans, leaveCrew, inviteToCrew, getFriendProfile } = useSocial();
  const [selectedTab, setSelectedTab] = useState<'members' | 'plans'>('members');

  const crew = crews.find((c) => c.id === id);

  if (!crew) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Crew not found</Text>
      </View>
    );
  }

  const isOwner = crew.ownerId === 'user-me';
  const isMember = crew.memberIds.includes('user-me');
  const crewNightPlans = crewPlans.filter((p) => p.crewId === crew.id);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleInviteMember = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Open friend selector modal
    Alert.alert('Coming Soon', 'Friend selector will be available soon!');
  };

  const handleLeaveCrew = () => {
    Alert.alert(
      'Leave Crew',
      `Are you sure you want to leave ${crew.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveCrew(crew.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(10,10,15,0.95)', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Crew Info */}
        <View style={styles.crewInfo}>
          {crew.imageUrl ? (
            <Image source={{ uri: crew.imageUrl }} style={styles.crewImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Users size={48} color="#fff" />
            </View>
          )}
          <View style={styles.titleRow}>
            <Text style={styles.crewName}>{crew.name}</Text>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Crown size={18} color="#ffd700" />
              </View>
            )}
          </View>
          {crew.description && (
            <Text style={styles.description}>{crew.description}</Text>
          )}
          {crew.isPrivate && (
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>🔒 Private Crew</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#00d4ff" />
            <Text style={styles.statValue}>{crew.stats.totalNightsOut}</Text>
            <Text style={styles.statLabel}>Nights Out</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>${crew.stats.totalSpent}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{crew.stats.streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'members' && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTab('members');
            }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'members' && styles.activeTabText,
              ]}
            >
              Members ({crew.memberIds.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'plans' && styles.activeTab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTab('plans');
            }}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'plans' && styles.activeTabText,
              ]}
            >
              Plans ({crewNightPlans.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'members' && (
          <View style={styles.tabContent}>
            {crew.memberIds.map((memberId: string) => {
              const profile = getFriendProfile(memberId);
              const isCrewOwner = memberId === crew.ownerId;

              return (
                <View key={memberId} style={styles.memberCard}>
                  {profile?.avatarUrl ? (
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberInitial}>
                        {profile?.displayName?.[0] || memberId[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {profile?.displayName || `User ${memberId}`}
                    </Text>
                    {profile?.bio && (
                      <Text style={styles.memberBio} numberOfLines={1}>
                        {profile.bio}
                      </Text>
                    )}
                  </View>
                  {isCrewOwner && (
                    <View style={styles.ownerTag}>
                      <Crown size={14} color="#ffd700" />
                      <Text style={styles.ownerTagText}>Owner</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {selectedTab === 'plans' && (
          <View style={styles.tabContent}>
            {crewNightPlans.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#666" />
                <Text style={styles.emptyStateText}>No upcoming plans</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create a plan to coordinate with your crew!
                </Text>
              </View>
            ) : (
              crewNightPlans.map((plan) => (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planDate}>{plan.date}</Text>
                    <View
                      style={[
                        styles.planStatusBadge,
                        plan.status === 'CONFIRMED' && styles.confirmedBadge,
                      ]}
                    >
                      <Text style={styles.planStatusText}>{plan.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.planTime}>🕐 {plan.time}</Text>
                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}
                  <View style={styles.planFooter}>
                    <Users size={14} color="#999" />
                    <Text style={styles.planAttendees}>
                      {plan.attendingMemberIds.length} attending
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {isMember && (
        <View style={styles.actionButtons}>
          {/* Invite Members hidden until the friend-selector is built. */}
          {!isOwner && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveCrew}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#ff4444" />
              <Text style={styles.leaveButtonText}>Leave Crew</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
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
    justifyContent: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  crewInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  crewImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  crewName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  ownerBadge: {
    marginLeft: 8,
    padding: 4,
  },
  description: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  privateBadge: {
    backgroundColor: 'rgba(255, 166, 77, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  privateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffa64d',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#00d4ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  activeTabText: {
    color: '#000',
  },
  tabContent: {
    marginBottom: 100,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  memberBio: {
    fontSize: 12,
    color: '#999',
  },
  ownerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ownerTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffd700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
  planCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planDate: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  planStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 166, 77, 0.2)',
  },
  confirmedBadge: {
    backgroundColor: 'rgba(0, 255, 128, 0.2)',
  },
  planStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffa64d',
  },
  planTime: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
    marginBottom: 12,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planAttendees: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  actionButtons: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  inviteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ff4444',
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
});
