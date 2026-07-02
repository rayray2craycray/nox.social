import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Award, Eye, EyeOff, Settings, CreditCard, Users, BarChart3, Edit, X, CheckCircle2, Shield, UserPlus, UserMinus, Share2, ChevronRight, DollarSign, Camera, Image as ImageIcon, Plus, MapPin, Building2, MoreVertical } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import UserActionMenu from '@/components/UserActionMenu';
import { useSocial } from '@/contexts/SocialContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { useRetention } from '@/contexts/RetentionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVenueManagement } from '@/contexts/VenueManagementContext';
import { useUpload } from '@/hooks/useUpload';
import { router } from 'expo-router';
import { venuesService } from '@/services/venues.service';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import UserProfileModal from '@/components/UserProfileModal';
import { ReferralCard } from '@/components/ReferralCard';
import { ReferralRewardModal } from '@/components/modals/ReferralRewardModal';
import { StreakBadge } from '@/components/StreakBadge';
import { MemoryCard } from '@/components/MemoryCard';
import { CrewCard } from '@/components/CrewCard';

type SocialTab = 'FOLLOWERS' | 'FOLLOWING';

export default function ProfileScreen() {
  const { profile, toggleIncognito, updateProfileDetails } = useAppState();
  const { user } = useAuth();
  const {
    following,
    followers,
    getFriendProfile,
    isFollowing,
    followUser,
    unfollowUser,
    suggestedPeople,
    getSuggestionSourceLabel,
    getSuggestionSourceColor,
    userCrews,
  } = useSocial();
  const { referralStats, referralRewards, claimReferralReward, myGroupPurchases } = useGrowth();
  const { activeStreaks, stats: retentionStats, getTimeline, addMemory, memories } = useRetention();
  const { hasBusinessProfile, businessProfile, managedVenues } = useVenueManagement();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showSocialList, setShowSocialList] = useState(false);
  const [socialTab, setSocialTab] = useState<SocialTab>('FOLLOWING');
  const [showBadgesList, setShowBadgesList] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile.displayName);
  const [editBio, setEditBio] = useState(profile.bio || '');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || profile.profileImageUrl);
  const [showAddMemoryModal, setShowAddMemoryModal] = useState(false);
  const [memoryCaption, setMemoryCaption] = useState('');
  const [uploadedMemoryImageUrl, setUploadedMemoryImageUrl] = useState<string | null>(null);
  const [detectedVenue, setDetectedVenue] = useState<{ id: string; name: string; distance: number } | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<{ id: string; username: string }>({ id: '', username: '' });

  // Upload hook for profile picture
  const upload = useUpload({
    onSuccess: (result) => {
      setProfileImageUrl(result.url);
      // Update profile with new image URL
      // TODO: Add updateProfileImage to AppStateContext
      Alert.alert('Success', 'Profile picture updated!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert('Upload Failed', error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  // Upload hook for memory photos
  const memoryUpload = useUpload({
    onSuccess: (result) => {
      setUploadedMemoryImageUrl(result.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert('Upload Failed', error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleIncognitoToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleIncognito();
  };

  const handleSaveProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateProfileDetails(editDisplayName, editBio);
    setIsEditModalVisible(false);
  };

  const openEditModal = () => {
    setEditDisplayName(profile.displayName);
    setEditBio(profile.bio || '');
    setIsEditModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  const handleAddMemory = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Step 1: Request location permissions
      setIsDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setIsDetectingLocation(false);
        Alert.alert(
          'Location Permission Required',
          'We need your location to verify you\'re at a venue to capture this memory.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Step 2: Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Step 3: Find nearest venue
      let nearestVenue: { id: string; name: string; distance: number } | null = null;
      let minDistance = Infinity;

      const nearbyVenuesList = await venuesService.getNearbyVenues(latitude, longitude, 1);
      nearbyVenuesList.forEach((venue) => {
        const distance = calculateDistance(
          latitude,
          longitude,
          venue.location.latitude,
          venue.location.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestVenue = {
            id: venue.id,
            name: venue.name,
            distance: distance,
          };
        }
      });

      setIsDetectingLocation(false);

      // Step 4: Check if user is close enough to a venue (within 500 meters)
      if (!nearestVenue) {
        Alert.alert(
          'Not at a Venue',
          'No venues found nearby. Make sure you\'re at a nightlife venue to capture memories.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Type assertion to help TypeScript
      const venue = nearestVenue as { id: string; name: string; distance: number };

      if (venue.distance > 0.5) {
        Alert.alert(
          'Not at a Venue',
          `You're ${(venue.distance * 1000).toFixed(0)}m away from ${venue.name}. Get closer to capture this memory!`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Step 5: Set detected venue and open modal
      setDetectedVenue(venue);
      setShowAddMemoryModal(true);

      // Step 6: Open camera to take live photo
      const result = await memoryUpload.uploadProfileFromCamera();

      if (!result) {
        setShowAddMemoryModal(false);
        setDetectedVenue(null);
      }
    } catch (error) {
      console.error('Error adding memory:', error);
      setIsDetectingLocation(false);
      Alert.alert('Error', 'Failed to detect your location. Please try again.');
    }
  };

  const handleSaveMemory = () => {
    if (!uploadedMemoryImageUrl) {
      Alert.alert('Error', 'Please take a photo first');
      return;
    }

    if (!memoryCaption.trim()) {
      Alert.alert('Error', 'Please add a caption for your memory');
      return;
    }

    if (!detectedVenue) {
      Alert.alert('Error', 'Venue location not detected');
      return;
    }

    addMemory({
      venueId: detectedVenue.id,
      venueName: detectedVenue.name,
      date: new Date().toISOString(),
      type: 'PHOTO',
      content: {
        imageUrl: uploadedMemoryImageUrl,
        caption: memoryCaption,
      },
      isPrivate: false,
    });

    // Reset state
    setShowAddMemoryModal(false);
    setMemoryCaption('');
    setUploadedMemoryImageUrl(null);
    setDetectedVenue(null);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleChangeProfilePicture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Change Profile Picture',
      'Choose a photo source',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            upload.uploadProfileFromCamera();
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            upload.uploadProfileFromGallery();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const profileLink = `https://Nox.app/profile/${profile.id}`;
      const message = profile.bio
        ? `Check out ${profile.displayName} on Nox!\n\n${profile.bio}\n\n${profileLink}`
        : `Check out ${profile.displayName} on Nox!\n\n${profileLink}`;

      await Share.share({
        message,
        title: `${profile.displayName} on Nox`,
        url: profileLink,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  const handleOpenUserProfile = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleOpenDM = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowUserProfile(false);
    router.push(`/servers?openDM=${userId}`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.gradient}
      >
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Share2 size={24} color="#ff0080" />
        </TouchableOpacity>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleChangeProfilePicture}
            disabled={upload.isUploading}
          >
            <LinearGradient
              colors={['#ff0080', '#a855f7']}
              style={styles.avatarGradient}
            >
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile.displayName[0]}</Text>
                </View>
              )}
              {upload.isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.uploadingText}>
                    {upload.uploadProgress}%
                  </Text>
                </View>
              )}
              {!upload.isUploading && (
                <View style={styles.cameraIconContainer}>
                  <Camera size={20} color="#fff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.userStats}>Member since 2024</Text>
          )}
          <TouchableOpacity style={styles.editProfileButton} onPress={openEditModal}>
            <Edit size={16} color="#ff0080" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.incognitoCard}>
          <LinearGradient
            colors={['#1a1a2e', '#1a1a1a']}
            style={styles.incognitoGradient}
          >
            <View style={styles.incognitoLeft}>
              {profile.isIncognito ? (
                <EyeOff size={24} color="#ff0080" />
              ) : (
                <Eye size={24} color="#666" />
              )}
              <View>
                <Text style={styles.incognitoTitle}>Incognito Mode</Text>
                <Text style={styles.incognitoSubtitle}>
                  {profile.isIncognito ? 'You\'re invisible in servers' : 'Everyone can see you'}
                </Text>
              </View>
            </View>
            <Switch
              value={profile.isIncognito}
              onValueChange={handleIncognitoToggle}
              trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
              thumbColor={profile.isIncognito ? '#000000' : '#666'}
            />
          </LinearGradient>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowBadgesList(!showBadgesList);
              setShowSocialList(false);
            }}
          >
            <Award size={24} color="#ff0080" />
            <Text style={styles.statNumber}>{profile.badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (showSocialList && socialTab === 'FOLLOWERS') {
                setShowSocialList(false);
              } else {
                setSocialTab('FOLLOWERS');
                setShowSocialList(true);
                setShowBadgesList(false);
              }
            }}
          >
            <Users size={24} color="#ff0080" />
            <Text style={styles.statNumber}>{followers.length}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (showSocialList && socialTab === 'FOLLOWING') {
                setShowSocialList(false);
              } else {
                setSocialTab('FOLLOWING');
                setShowSocialList(true);
                setShowBadgesList(false);
              }
            }}
          >
            <Users size={24} color="#ff0080" />
            <Text style={styles.statNumber}>{following.length}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {showSocialList && (
          <View style={styles.section}>
            <View style={styles.socialHeaderContainer}>
              <View style={styles.socialTabHeader}>
                <TouchableOpacity
                  style={[styles.socialTab, socialTab === 'FOLLOWERS' && styles.socialTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSocialTab('FOLLOWERS');
                  }}
                >
                  <Text style={[styles.socialTabText, socialTab === 'FOLLOWERS' && styles.socialTabTextActive]}>
                    Followers
                  </Text>
                  {socialTab === 'FOLLOWERS' && <View style={styles.socialTabIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialTab, socialTab === 'FOLLOWING' && styles.socialTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSocialTab('FOLLOWING');
                  }}
                >
                  <Text style={[styles.socialTabText, socialTab === 'FOLLOWING' && styles.socialTabTextActive]}>
                    Following
                  </Text>
                  {socialTab === 'FOLLOWING' && <View style={styles.socialTabIndicator} />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSocialList(false);
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

          <View style={styles.socialList}>
            {socialTab === 'FOLLOWERS' && followers.length === 0 && (
              <View style={styles.emptyState}>
                <Users size={48} color="#666" />
                <Text style={styles.emptyStateTitle}>No followers yet</Text>
                <Text style={styles.emptyStateText}>
                  Connect with people at venues to build your network
                </Text>
              </View>
            )}
            {socialTab === 'FOLLOWING' && following.length === 0 && (
              <View style={styles.emptyState}>
                <Users size={48} color="#666" />
                <Text style={styles.emptyStateTitle}>Not following anyone</Text>
                <Text style={styles.emptyStateText}>
                  Start following friends to see where they&apos;re at
                </Text>
              </View>
            )}
            {socialTab === 'FOLLOWERS' && followers.map((userId) => {
              const userProfile = getFriendProfile(userId);
              if (!userProfile) return null;
              return (
                <View key={userId} style={styles.userCard}>
                  <LinearGradient
                    colors={['#1a1a2e', '#1a1a1a']}
                    style={styles.userCardGradient}
                  >
                    <TouchableOpacity
                      style={styles.userCardLeft}
                      onPress={() => handleOpenUserProfile(userId)}
                    >
                      <Image
                        source={{ uri: userProfile.avatarUrl }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userProfile.displayName}</Text>
                        {userProfile.bio && <Text style={styles.userBio}>{userProfile.bio}</Text>}
                        {userProfile.currentVenueName && (
                          <View style={styles.venueTag}>
                            <View style={styles.onlineIndicator} />
                            <Text style={styles.venueTagText}>{userProfile.currentVenueName}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.userCardActions}>
                      <TouchableOpacity
                        style={styles.moreButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedUserForAction({ id: userId, username: userProfile.displayName });
                          setShowReportMenu(true);
                        }}
                      >
                        <MoreVertical size={20} color="#999" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.followButton,
                          isFollowing(userId) && styles.followingButton
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          if (isFollowing(userId)) {
                            unfollowUser(userId);
                          } else {
                            followUser(userId);
                          }
                        }}
                      >
                        {isFollowing(userId) ? (
                          <UserMinus size={18} color="#fff" />
                        ) : (
                          <UserPlus size={18} color="#000000" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
            {socialTab === 'FOLLOWING' && following.map((userId) => {
              const userProfile = getFriendProfile(userId);
              if (!userProfile) return null;
              return (
                <View key={userId} style={styles.userCard}>
                  <LinearGradient
                    colors={['#1a1a2e', '#1a1a1a']}
                    style={styles.userCardGradient}
                  >
                    <TouchableOpacity
                      style={styles.userCardLeft}
                      onPress={() => handleOpenUserProfile(userId)}
                    >
                      <Image
                        source={{ uri: userProfile.avatarUrl }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userProfile.displayName}</Text>
                        {userProfile.bio && <Text style={styles.userBio}>{userProfile.bio}</Text>}
                        {userProfile.currentVenueName && (
                          <View style={styles.venueTag}>
                            <View style={styles.onlineIndicator} />
                            <Text style={styles.venueTagText}>{userProfile.currentVenueName}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.userCardActions}>
                      <TouchableOpacity
                        style={styles.moreButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedUserForAction({ id: userId, username: userProfile.displayName });
                          setShowReportMenu(true);
                        }}
                      >
                        <MoreVertical size={20} color="#999" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.followingButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          unfollowUser(userId);
                        }}
                      >
                        <UserMinus size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
          </View>
        )}

        {showBadgesList && (
          <View style={styles.section}>
            <View style={styles.badgesHeaderContainer}>
              <Text style={styles.sectionTitle}>All Badges</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBadgesList(false);
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {profile.badges.length === 0 ? (
              <View style={styles.emptyState}>
                <Award size={48} color="#666" />
                <Text style={styles.emptyStateTitle}>No badges yet</Text>
                <Text style={styles.emptyStateText}>
                  Visit venues and spend to unlock exclusive badges
                </Text>
              </View>
            ) : (
              <View style={styles.badgeList}>
                {profile.badges.map((badge) => {
                  const venueImage = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2';

                  return (
                    <View key={badge.id} style={styles.badgeCard}>
                      <LinearGradient
                        colors={['#1a1a2e', '#1a1a1a']}
                        style={styles.badgeGradient}
                      >
                        <Image
                          source={{ uri: venueImage }}
                          style={styles.badgeImage}
                        />
                        <View style={styles.badgeInfo}>
                          <Text style={styles.badgeName}>{badge.venueName}</Text>
                          <View style={styles.badgeTypeTag}>
                            <Text style={styles.badgeTypeText}>{badge.badgeType}</Text>
                          </View>
                          <Text style={styles.badgeDate}>
                            Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {!showBadgesList && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            {profile.badges.length === 0 ? (
              <View style={styles.emptyState}>
                <Award size={48} color="#666" />
                <Text style={styles.emptyStateTitle}>No badges yet</Text>
                <Text style={styles.emptyStateText}>
                  Visit venues and spend to unlock exclusive badges
                </Text>
              </View>
            ) : (
              profile.badges.slice(0, 3).map((badge) => {
                const venueImage = 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2';

                return (
                  <View key={badge.id} style={styles.badgeCard}>
                    <LinearGradient
                      colors={['#1a1a2e', '#1a1a1a']}
                      style={styles.badgeGradient}
                    >
                      <Image
                        source={{ uri: venueImage }}
                        style={styles.badgeImage}
                      />
                      <View style={styles.badgeInfo}>
                        <Text style={styles.badgeName}>{badge.venueName}</Text>
                        <View style={styles.badgeTypeTag}>
                          <Text style={styles.badgeTypeText}>{badge.badgeType}</Text>
                        </View>
                        <Text style={styles.badgeDate}>
                          Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Referrals Section */}
        {referralStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referrals</Text>
            <ReferralCard
              referralStats={referralStats}
              onViewRewards={() => setShowRewardsModal(true)}
            />
          </View>
        )}

        {/* Streaks Section */}
        {activeStreaks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Streaks 🔥</Text>
            <View style={styles.streaksContainer}>
              {activeStreaks.map((streak) => (
                <StreakBadge
                  key={streak.id}
                  streak={streak}
                  size="large"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Navigate to streak details or claim rewards
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Crews Section */}
        {userCrews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Crews</Text>
              <TouchableOpacity onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Navigate to crews list
              }}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            {userCrews.slice(0, 3).map((crew) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                isOwner={crew.ownerId === user?.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/crews/${crew.id}`);
                }}
              />
            ))}
          </View>
        )}

        {/* Memories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Memories</Text>
            <TouchableOpacity onPress={handleAddMemory}>
              <View style={styles.addButton}>
                <Plus size={16} color="#ff0080" />
                <Text style={styles.addButtonText}>Add</Text>
              </View>
            </TouchableOpacity>
          </View>

          {memories.length === 0 ? (
            <View style={styles.emptyMemories}>
              <Camera size={48} color="#666" />
              <Text style={styles.emptyMemoriesText}>No memories yet</Text>
              <Text style={styles.emptyMemoriesSubtext}>
                Visit a venue and capture live moments with your camera
              </Text>
              <TouchableOpacity
                style={styles.emptyMemoriesButton}
                onPress={handleAddMemory}
                disabled={isDetectingLocation}
              >
                {isDetectingLocation ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.emptyMemoriesButtonText}>Detecting Location...</Text>
                  </>
                ) : (
                  <>
                    <Camera size={20} color="#fff" />
                    <Text style={styles.emptyMemoriesButtonText}>Capture Memory</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.memoriesGrid}>
                {getTimeline(6).map((memory) => (
                  <View key={memory.id} style={styles.memoryCardWrapper}>
                    <MemoryCard
                      memory={memory}
                      size="small"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // Navigate to memory detail or full timeline
                        router.push('/memories/timeline');
                      }}
                    />
                  </View>
                ))}
              </View>
              {memories.length > 6 && (
                <TouchableOpacity
                  style={styles.viewAllMemoriesButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/memories/timeline');
                  }}
                >
                  <Text style={styles.viewAllMemoriesText}>View All Memories</Text>
                  <ChevronRight size={16} color="#ff0080" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Group Purchases Section */}
        {myGroupPurchases.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Group Purchases</Text>
              {myGroupPurchases.length > 3 && (
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Navigate to full group purchases list
                }}>
                  <Text style={styles.sectionLink}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            {myGroupPurchases.slice(0, 3).map((gp) => {
              const isInitiator = gp.initiatorId === 'user-me';
              const participantCount = gp.currentParticipants.length;
              const spotsLeft = gp.maxParticipants - participantCount;

              const getStatusColor = () => {
                if (gp.status === 'COMPLETED') return '#00ff80';
                if (gp.status === 'FULL') return '#00d4ff';
                if (gp.status === 'CANCELLED') return '#ff4444';
                return '#ffa64d';
              };

              const getStatusText = () => {
                if (gp.status === 'COMPLETED') return 'Completed';
                if (gp.status === 'FULL') return 'Full';
                if (gp.status === 'CANCELLED') return 'Cancelled';
                return `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`;
              };

              return (
                <View key={gp.id} style={styles.groupPurchaseItem}>
                  <View style={styles.groupPurchaseIcon}>
                    <Users size={20} color="#00d4ff" />
                  </View>
                  <View style={styles.groupPurchaseInfo}>
                    <Text style={styles.groupPurchaseName}>
                      {'Unknown Venue'}
                    </Text>
                    <View style={styles.groupPurchaseDetails}>
                      <View style={styles.groupPurchaseDetailItem}>
                        <DollarSign size={14} color="#999" />
                        <Text style={styles.groupPurchaseDetailText}>
                          ${gp.perPersonAmount.toFixed(2)} per person
                        </Text>
                      </View>
                      <View style={styles.groupPurchaseDetailItem}>
                        <Users size={14} color="#999" />
                        <Text style={styles.groupPurchaseDetailText}>
                          {participantCount}/{gp.maxParticipants} people
                        </Text>
                      </View>
                    </View>
                    <View style={styles.groupPurchaseMeta}>
                      {isInitiator && (
                        <View style={styles.initiatorBadge}>
                          <Text style={styles.initiatorBadgeText}>Organizer</Text>
                        </View>
                      )}
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
                          {getStatusText()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/challenges');
            }}
          >
            <Award size={20} color="#00d4ff" />
            <Text style={styles.quickLinkText}>View Challenges</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/calendar');
            }}
          >
            <BarChart3 size={20} color="#00d4ff" />
            <Text style={styles.quickLinkText}>Event Calendar</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLinkButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/tickets');
            }}
          >
            <CreditCard size={20} color="#00d4ff" />
            <Text style={styles.quickLinkText}>My Tickets</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {profile.isVenueManager && (
            <TouchableOpacity
              style={styles.managementButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/management');
              }}
            >
              <LinearGradient
                colors={['#ff0080', '#00d4ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.managementGradient}
              >
                <BarChart3 size={22} color="#000000" />
                <Text style={styles.managementButtonText}>Management Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Register Business Button */}
          {!hasBusinessProfile && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#ff0080' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/business/register');
              }}
            >
              <Building2 size={20} color="#ff0080" />
              <Text style={[styles.actionButtonText, { color: '#ff0080' }]}>Register Business</Text>
            </TouchableOpacity>
          )}

          {/* Show Business Profile Status if exists */}
          {hasBusinessProfile && businessProfile && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#1a1a2e' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (businessProfile.status === 'VERIFIED' && managedVenues.length > 0) {
                  router.push(`/venue/edit/${managedVenues[0]}`);
                } else if (businessProfile.status === 'PENDING_VERIFICATION') {
                  router.push('/business/verification-pending');
                }
              }}
            >
              <Building2 size={20} color={businessProfile.status === 'VERIFIED' ? '#00ff00' : '#ff9500'} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionButtonText}>{businessProfile.venueName}</Text>
                <Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                  {businessProfile.status === 'VERIFIED' ? '✓ Verified' : '⏱ Pending Verification'}
                </Text>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/settings');
            }}
          >
            <Settings size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Account Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People You May Know</Text>
          <Text style={styles.sectionSubtitle}>Based on your contacts and connections</Text>
          {suggestedPeople.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#666" />
              <Text style={styles.emptyStateTitle}>No suggestions</Text>
              <Text style={styles.emptyStateText}>
                We&apos;ll show people you may know here
              </Text>
            </View>
          ) : (
            <View style={styles.suggestedList}>
              {suggestedPeople.map((person) => (
                <View key={person.id} style={styles.userCard}>
                  <LinearGradient
                    colors={['#1a1a2e', '#1a1a1a']}
                    style={styles.userCardGradient}
                  >
                    <TouchableOpacity
                      style={styles.userCardLeft}
                      onPress={() => handleOpenUserProfile(person.id)}
                    >
                      <Image
                        source={{ uri: person.avatarUrl }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{person.displayName}</Text>
                        <View
                          style={[
                            styles.sourceBadge,
                            { backgroundColor: getSuggestionSourceColor(person) + '20' },
                          ]}
                        >
                          <View
                            style={[
                              styles.sourceBadgeDot,
                              { backgroundColor: getSuggestionSourceColor(person) },
                            ]}
                          />
                          <Text
                            style={[
                              styles.sourceBadgeText,
                              { color: getSuggestionSourceColor(person) },
                            ]}
                          >
                            {getSuggestionSourceLabel(person)}
                          </Text>
                        </View>
                        {person.bio && <Text style={styles.userBio}>{person.bio}</Text>}
                        {person.mutualFriends > 0 && person.source.type !== 'MUTUAL_FRIENDS' && (
                          <Text style={styles.mutualText}>
                            {person.mutualFriends} mutual {person.mutualFriends === 1 ? 'friend' : 'friends'}
                          </Text>
                        )}
                        {person.currentVenueName && (
                          <View style={styles.venueTag}>
                            <View style={styles.onlineIndicator} />
                            <Text style={styles.venueTagText}>{person.currentVenueName}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.followButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        followUser(person.id);
                      }}
                    >
                      <UserPlus size={18} color="#000000" />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsEditModalVisible(false);
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  placeholder="Enter your display name"
                  placeholderTextColor="#666"
                  maxLength={30}
                />
                <Text style={styles.inputHint}>{editDisplayName.length}/30</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  maxLength={150}
                />
                <Text style={styles.inputHint}>{editBio.length}/150</Text>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <LinearGradient
                  colors={['#ff0080', '#00d4ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>


      <UserProfileModal
        visible={showUserProfile}
        userId={selectedUserId}
        onClose={() => setShowUserProfile(false)}
        onMessage={handleOpenDM}
      />

      <ReferralRewardModal
        visible={showRewardsModal}
        rewards={referralRewards}
        onClose={() => setShowRewardsModal(false)}
        onClaimReward={claimReferralReward}
      />

      <UserActionMenu
        visible={showReportMenu}
        onClose={() => setShowReportMenu(false)}
        userId={selectedUserForAction.id}
        username={selectedUserForAction.username}
      />

      {/* Add Memory Modal */}
      <Modal
        visible={showAddMemoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMemoryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Memory</Text>
                <TouchableOpacity onPress={() => setShowAddMemoryModal(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Upload Preview */}
              {/* Detected Venue Display */}
              {detectedVenue && (
                <View style={styles.detectedVenueCard}>
                  <MapPin size={20} color="#ff0080" />
                  <View style={styles.detectedVenueInfo}>
                    <Text style={styles.detectedVenueLabel}>Captured at</Text>
                    <Text style={styles.detectedVenueName}>{detectedVenue.name}</Text>
                    <Text style={styles.detectedVenueDistance}>
                      {(detectedVenue.distance * 1000).toFixed(0)}m away
                    </Text>
                  </View>
                </View>
              )}

              {/* Upload Preview */}
              {uploadedMemoryImageUrl ? (
                <View style={styles.memoryUploadPreview}>
                  <Image
                    source={{ uri: uploadedMemoryImageUrl }}
                    style={styles.memoryPreviewImage}
                    contentFit="cover"
                  />
                  {memoryUpload.isUploading && (
                    <View style={styles.uploadingOverlayMemory}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.uploadingTextMemory}>
                        Uploading {memoryUpload.uploadProgress}%
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.memoryUploadPlaceholder}>
                  {memoryUpload.isUploading ? (
                    <>
                      <ActivityIndicator size="large" color="#ff0080" />
                      <Text style={styles.uploadingTextMemory}>
                        Uploading {memoryUpload.uploadProgress}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Camera size={48} color="#666" />
                      <Text style={styles.memoryUploadPlaceholderText}>
                        Opening camera...
                      </Text>
                    </>
                  )}
                </View>
              )}

              {/* Caption Input */}
              <View style={styles.memoryInputSection}>
                <Text style={styles.memoryInputLabel}>Caption</Text>
                <TextInput
                  style={styles.memoryTextInput}
                  placeholder="What made this moment special?"
                  placeholderTextColor="#666"
                  value={memoryCaption}
                  onChangeText={setMemoryCaption}
                  maxLength={200}
                  multiline
                />
                <Text style={styles.charCountMemory}>
                  {memoryCaption.length}/200
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveMemoryButton,
                  (!uploadedMemoryImageUrl || memoryUpload.isUploading) && styles.saveMemoryButtonDisabled,
                ]}
                onPress={handleSaveMemory}
                disabled={!uploadedMemoryImageUrl || memoryUpload.isUploading}
              >
                <CheckCircle2 size={20} color="#fff" />
                <Text style={styles.saveMemoryButtonText}>Save Memory</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    paddingBottom: 40,
  },
  shareButton: {
    position: 'absolute' as const,
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    borderRadius: 50,
    padding: 4,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#000000',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#000000',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  uploadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cameraIconContainer: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff0080',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 3,
    borderColor: '#000000',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  userStats: {
    fontSize: 14,
    color: '#999',
  },
  nameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  verifiedBadge: {
    marginTop: 2,
  },
  categoryTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center' as const,
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    marginTop: 8,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  incognitoCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  incognitoGradient: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  incognitoLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  incognitoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  incognitoSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center' as const,
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600' as const,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    maxWidth: 240,
  },
  badgeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  badgeGradient: {
    flexDirection: 'row' as const,
    padding: 12,
    gap: 12,
  },
  badgeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  badgeInfo: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  badgeTypeTag: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#ff0080',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeTypeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#000000',
  },
  badgeDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  managementButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  managementGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 18,
    gap: 12,
  },
  managementButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right' as const,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    padding: 18,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  socialHeaderContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  socialTabHeader: {
    flex: 1,
    flexDirection: 'row' as const,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  socialTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
    borderRadius: 8,
    position: 'relative' as const,
  },
  socialTabActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
  },
  socialTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  socialTabTextActive: {
    color: '#ff0080',
  },
  socialTabIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#ff0080',
    borderRadius: 1,
  },
  socialList: {
    gap: 12,
  },
  badgesHeaderContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  badgeList: {
    gap: 12,
  },
  userCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  userCardGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 12,
  },
  userCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  sourceBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  sourceBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  userBio: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  venueTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff0080',
  },
  venueTagText: {
    fontSize: 11,
    color: '#ff0080',
    fontWeight: '600' as const,
  },
  followButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff0080',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  followingButton: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  userCardActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  moreButton: {
    padding: 8,
    marginRight: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    marginTop: -8,
  },
  suggestedList: {
    gap: 12,
  },
  mutualText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  walletModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  walletCardsContainer: {
    padding: 20,
  },
  walletSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  walletCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  walletCardGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
  },
  walletCardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  walletCardIcon: {
    width: 50,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e40af',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  walletCardBrand: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  walletCardNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  walletCardName: {
    fontSize: 12,
    color: '#999',
  },
  // Streaks Styles
  streaksContainer: {
    gap: 12,
  },
  // Crews Styles
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#00d4ff',
  },
  crewItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  crewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  crewInfo: {
    flex: 1,
  },
  crewName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  crewMembers: {
    fontSize: 12,
    color: '#999',
  },
  groupPurchaseItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  groupPurchaseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  groupPurchaseInfo: {
    flex: 1,
    gap: 8,
  },
  groupPurchaseName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  groupPurchaseDetails: {
    gap: 6,
  },
  groupPurchaseDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  groupPurchaseDetailText: {
    fontSize: 13,
    color: '#999',
  },
  groupPurchaseMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  initiatorBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  initiatorBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#a855f7',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  // Quick Links Styles
  quickLinkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  // Memories Styles
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  emptyMemories: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyMemoriesText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
  },
  emptyMemoriesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    marginTop: 8,
    lineHeight: 20,
  },
  emptyMemoriesButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#ff0080',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 20,
  },
  emptyMemoriesButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  memoriesGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 12,
  },
  memoryCardWrapper: {
    width: '31.5%',
  },
  viewAllMemoriesButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  viewAllMemoriesText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  memoryUploadPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden' as const,
    backgroundColor: '#1a1a2e',
    marginBottom: 20,
    position: 'relative' as const,
  },
  memoryPreviewImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlayMemory: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  uploadingTextMemory: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  memoryUploadPlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
    marginBottom: 20,
  },
  memoryUploadPlaceholderText: {
    fontSize: 14,
    color: '#999',
  },
  memoryInputSection: {
    marginBottom: 20,
  },
  memoryInputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  memoryTextInput: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: 15,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  charCountMemory: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right' as const,
    marginTop: 4,
  },
  detectedVenueCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff0080',
    marginBottom: 20,
  },
  detectedVenueInfo: {
    flex: 1,
  },
  detectedVenueLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detectedVenueName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff0080',
    marginBottom: 2,
  },
  detectedVenueDistance: {
    fontSize: 12,
    color: '#999',
  },
  saveMemoryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#ff0080',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveMemoryButtonDisabled: {
    opacity: 0.5,
  },
  saveMemoryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
