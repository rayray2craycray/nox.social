import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  X,
  MapPin,
  Users,
  UserPlus,
  UserMinus,
  MessageCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react-native';
import { FriendProfile } from '@/types';
import { useSocial } from '@/contexts/SocialContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface UserProfileModalProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
  onMessage?: (userId: string) => void;
}

export default function UserProfileModal({
  visible,
  userId,
  onClose,
  onMessage,
}: UserProfileModalProps) {
  const {
    getFriendProfile,
    isFollowing,
    isMutual,
    followUser,
    unfollowUser,
    following,
    followers,
  } = useSocial();

  if (!userId) return null;

  const profile = getFriendProfile(userId);
  if (!profile) return null;

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isFollowing(userId)) {
      unfollowUser(userId);
    } else {
      followUser(userId);
    }
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    if (onMessage) {
      onMessage(userId);
    } else {
      // Navigate to servers tab and open DM
      router.push('/servers' as any);
    }
  };

  const isUserFollowing = isFollowing(userId);
  const isUserMutual = isMutual(userId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#ff0080', '#a855f7']}
                    style={styles.avatarGradient}
                  >
                    <Image
                      source={{ uri: profile.avatarUrl }}
                      style={styles.avatar}
                    />
                  </LinearGradient>
                </View>

                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>{profile.displayName}</Text>
                  {profile.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={20} color="#ff0080" />
                    </View>
                  )}
                </View>

                {profile.isVerified && profile.verifiedCategory && (
                  <View style={styles.categoryTag}>
                    <Shield size={12} color="#ff0080" />
                    <Text style={styles.categoryText}>{profile.verifiedCategory}</Text>
                  </View>
                )}

                {profile.bio && (
                  <Text style={styles.bio}>{profile.bio}</Text>
                )}

                {profile.currentVenueName && (
                  <View style={styles.locationCard}>
                    <LinearGradient
                      colors={['#1a1a2e', '#15151f']}
                      style={styles.locationGradient}
                    >
                      <MapPin size={18} color="#ff0080" />
                      <View style={styles.locationInfo}>
                        <Text style={styles.locationLabel}>Currently at</Text>
                        <Text style={styles.locationName}>{profile.currentVenueName}</Text>
                      </View>
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{followers.filter(f => f === userId).length}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{following.filter(f => f === userId).length}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{profile.mutualFriends || 0}</Text>
                    <Text style={styles.statLabel}>Mutual</Text>
                  </View>
                </View>

                {profile.mutualFriends > 0 && (
                  <View style={styles.mutualCard}>
                    <Users size={16} color="#ff0080" />
                    <Text style={styles.mutualText}>
                      {profile.mutualFriends} mutual {profile.mutualFriends === 1 ? 'friend' : 'friends'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.followButton,
                    isUserFollowing && styles.followingButton,
                  ]}
                  onPress={handleFollow}
                >
                  <LinearGradient
                    colors={isUserFollowing ? ['#1a1a2e', '#1a1a2e'] : ['#ff0080', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    {isUserFollowing ? (
                      <>
                        <UserMinus size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>
                          {isUserMutual ? 'Unfollow' : 'Following'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <UserPlus size={20} color="#000" />
                        <Text style={[styles.actionButtonText, { color: '#000' }]}>Follow</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={handleMessage}
                >
                  <View style={styles.messageButtonContent}>
                    <MessageCircle size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Message</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    borderRadius: 60,
    padding: 4,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#000000',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  displayName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    marginTop: 4,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff0080',
    textTransform: 'uppercase',
  },
  bio: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  locationCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  locationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 0, 128, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff0080',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ff0080',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  mutualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mutualText: {
    fontSize: 13,
    color: '#ff0080',
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  followButton: {
    // styles handled by gradient
  },
  followingButton: {
    // styles handled by gradient
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
