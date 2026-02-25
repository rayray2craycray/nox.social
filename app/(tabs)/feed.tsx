import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  TouchableOpacity,
  Text,
  Animated as RNAnimated,
  Alert,
  ScrollView,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Share2, Music, UserPlus, MapPin, Flag } from 'lucide-react-native';
import { Image } from 'expo-image';
import UserActionMenu from '@/components/UserActionMenu';
import { Video, ResizeMode } from 'expo-av';
import { mockVenues } from '@/mocks/venues';
import { mockPerformers } from '@/mocks/performers';
import { VibeVideo, FeedFilter } from '@/types';
import * as Haptics from 'expo-haptics';
import { useAppState } from '@/contexts/AppStateContext';
import { useFeed } from '@/contexts/FeedContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function to get filter styles
function getFilterStyle(filter: string) {
  switch (filter) {
    case 'neon-glitch':
      return {
        backgroundColor: 'rgba(255, 0, 128, 0.15)',
        mixBlendMode: 'screen' as any,
      };
    case 'afterhours-noir':
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        mixBlendMode: 'multiply' as any,
      };
    case 'vhs-retro':
      return {
        backgroundColor: 'rgba(255, 200, 100, 0.2)',
        mixBlendMode: 'overlay' as any,
      };
    case 'cyber-wave':
      return {
        backgroundColor: 'rgba(0, 255, 255, 0.15)',
        mixBlendMode: 'screen' as any,
      };
    case 'golden-hour':
      return {
        backgroundColor: 'rgba(255, 180, 0, 0.2)',
        mixBlendMode: 'overlay' as any,
      };
    default:
      return {};
  }
}

// Helper function to render stickers
function renderSticker(sticker: string, onPress?: () => void) {
  const stickerStyles = {
    container: {
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#ff0080',
    },
    text: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700' as const,
      textAlign: 'center' as const,
    },
  };

  let text = '';
  switch (sticker) {
    case 'get-tickets':
      text = '🎫 Get Tickets';
      break;
    case 'join-lobby':
      text = '💬 Join Lobby';
      break;
    case 'live-tonight':
      text = '🔥 Live Tonight';
      break;
    case 'swipe-up':
      text = '👆 Swipe Up';
      break;
    default:
      return null;
  }

  if (sticker === 'join-lobby' && onPress) {
    return (
      <TouchableOpacity style={stickerStyles.container} onPress={onPress}>
        <Text style={stickerStyles.text}>{text}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={stickerStyles.container}>
      <Text style={stickerStyles.text}>{text}</Text>
    </View>
  );
}

export default function FeedScreen() {
  const { videos, selectedFilter, setFilter, isEmpty, suggestedPerformers } = useFeed();
  const { followPerformer, isFollowing } = useAppState();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const isFocused = useIsFocused();

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleLike = useCallback((videoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  const renderVideo = useCallback(({ item, index }: { item: VibeVideo; index: number }) => {
    const venue = mockVenues.find(v => v.id === item.venueId);
    const performer = item.performerId
      ? mockPerformers.find(p => p.id === item.performerId)
      : null;
    const isLiked = likedVideos.has(item.id);

    return (
      <VideoCard
        video={item}
        venue={venue}
        performer={performer}
        isActive={index === currentIndex}
        isLiked={isLiked}
        onLike={handleLike}
        isFocused={isFocused}
      />
    );
  }, [currentIndex, likedVideos, handleLike, isFocused]);

  const handleFilterPress = useCallback((filter: FeedFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(filter);
    setCurrentIndex(0);
  }, [setFilter]);

  if (isEmpty) {
    return (
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'NEARBY' && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress('NEARBY')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'NEARBY' && styles.filterTextActive,
              ]}
            >
              Nearby
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'FOLLOWING' && styles.filterButtonActive,
            ]}
            onPress={() => handleFilterPress('FOLLOWING')}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === 'FOLLOWING' && styles.filterTextActive,
              ]}
            >
              Following
            </Text>
          </TouchableOpacity>
        </View>
        <EmptyState
          filter={selectedFilter}
          suggestedPerformers={suggestedPerformers}
          onFollowPerformer={followPerformer}
          isFollowing={isFollowing}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'NEARBY' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterPress('NEARBY')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'NEARBY' && styles.filterTextActive,
            ]}
          >
            Nearby
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'FOLLOWING' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterPress('FOLLOWING')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'FOLLOWING' && styles.filterTextActive,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
}

interface VideoCardProps {
  video: VibeVideo;
  venue?: typeof mockVenues[0];
  performer: typeof mockPerformers[0] | null | undefined;
  isActive: boolean;
  isLiked: boolean;
  onLike: (videoId: string) => void;
  isFocused: boolean;
}

function VideoCard({ video, venue, performer, isActive, isLiked, onLike, isFocused }: VideoCardProps) {
  const likeScale = useRef(new RNAnimated.Value(1)).current;
  const { profile, updateProfile } = useAppState();
  const { shareToInstagram, generateStoryTemplate } = useGrowth();
  const [videoError, setVideoError] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);

  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (isActive && isFocused) {
      videoRef.current?.playAsync();
      videoRef.current?.setIsMutedAsync(false);
    } else {
      videoRef.current?.pauseAsync();
      videoRef.current?.setPositionAsync(0);
      videoRef.current?.setIsMutedAsync(true);
    }
  }, [isActive, isFocused]);

  const handleLikePress = useCallback(() => {
    onLike(video.id);
    RNAnimated.sequence([
      RNAnimated.timing(likeScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      RNAnimated.timing(likeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [video.id, onLike, likeScale]);

  const handleChatPress = useCallback(() => {
    if (!venue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const alreadyJoined = profile.badges.some(badge => badge.venueId === venue.id);

    if (alreadyJoined) {
      // Already in server, go to servers tab
      Alert.alert(
        'Open Chat',
        `Go to ${venue.name}'s server to chat?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Server', onPress: () => router.push('/(tabs)/servers') },
        ]
      );
    } else {
      // Not in server, ask to join
      Alert.alert(
        'Join Server',
        `Join ${venue.name}'s public lobby to chat about this video?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: () => {
              const newBadge = {
                id: `badge-${Date.now()}`,
                venueId: venue.id,
                venueName: venue.name,
                badgeType: 'GUEST' as const,
                unlockedAt: new Date().toISOString(),
              };

              updateProfile({
                badges: [...profile.badges, newBadge],
              });

              Alert.alert(
                'Joined!',
                `You've joined ${venue.name}'s public lobby. Opening server now.`,
                [
                  { text: 'OK', onPress: () => router.push('/(tabs)/servers') },
                ]
              );
            },
          },
        ]
      );
    }
  }, [venue, profile.badges, updateProfile]);

  const handleJoinLobby = useCallback(() => {
    if (!venue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const alreadyJoined = profile.badges.some(badge => badge.venueId === venue.id);

    if (alreadyJoined) {
      router.push('/(tabs)/servers');
    } else {
      const newBadge = {
        id: `badge-${Date.now()}`,
        venueId: venue.id,
        venueName: venue.name,
        badgeType: 'GUEST' as const,
        unlockedAt: new Date().toISOString(),
      };

      updateProfile({
        badges: [...profile.badges, newBadge],
      });

      Alert.alert(
        'Joined!',
        `You've joined ${venue.name}'s public lobby. Check the Servers tab to chat.`,
        [
          { text: 'OK', onPress: () => router.push('/(tabs)/servers') },
        ]
      );
    }
  }, [venue, profile.badges, updateProfile]);

  const handleShareToStory = useCallback(async () => {
    if (!venue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Show options: Instagram Story or Regular Share
      Alert.alert(
        'Share Video',
        'How would you like to share this content?',
        [
          {
            text: 'Instagram Story',
            onPress: async () => {
              try {
                // Generate story template with video data
                const result = await generateStoryTemplate({
                  templateId: 'story-venue',
                  userId: profile.id,
                  customData: {
                    venueName: venue.name,
                    videoTitle: video.title,
                    performerName: performer?.stageName,
                    venueId: venue.id,
                  },
                });

                // Share to Instagram
                if (result && typeof result === 'object' && 'template' in result) {
                  const resultWithTemplate = result as { template: { id: string } };
                  await shareToInstagram(resultWithTemplate.template.id);
                }

                Alert.alert(
                  'Success!',
                  'Opening Instagram to share your story...',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Instagram share error:', error);
                Alert.alert(
                  'Error',
                  'Unable to share to Instagram. Make sure Instagram is installed.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
          {
            text: 'Share Elsewhere',
            onPress: async () => {
              try {
                await Share.share({
                  message: `Check out this video from ${venue.name}!${
                    performer ? ` Featuring ${performer.stageName}` : ''
                  }`,
                  title: video.title,
                });
              } catch (error) {
                console.error('Share error:', error);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [venue, video, performer, profile.id, generateStoryTemplate, shareToInstagram]);

  return (
    <View style={styles.videoContainer}>
      {/* Only render Video component when active */}
      {isActive ? (
        <Video
          ref={videoRef}
          source={{ uri: video.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping={true}
          isMuted={!(isActive && isFocused)}
          useNativeControls={false}
        />
      ) : (
        <View style={styles.videoPlaceholder}>
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
          />
        </View>
      )}

      {/* Filter Overlay */}
      {video.filter && video.filter !== 'none' && (
        <View style={[styles.filterOverlay, getFilterStyle(video.filter)]} />
      )}

      {/* Sticker Overlay */}
      {video.sticker && video.sticker !== 'none' && (
        <View style={[
          styles.stickerContainer,
          video.stickerPosition && {
            top: `${video.stickerPosition.y}%`,
            left: `${video.stickerPosition.x}%`,
          }
        ]}>
          {renderSticker(video.sticker, handleJoinLobby)}
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
        style={styles.gradient}
      />

      <View style={styles.sideActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
          <RNAnimated.View style={{ transform: [{ scale: likeScale }] }}>
            <Heart
              size={32}
              color={isLiked ? '#ff006e' : '#fff'}
              fill={isLiked ? '#ff006e' : 'transparent'}
            />
          </RNAnimated.View>
          <Text style={styles.actionText}>{(video.likes + (isLiked ? 1 : 0)).toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleChatPress}
        >
          <MessageCircle size={32} color="#fff" />
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShareToStory}
        >
          <Share2 size={32} color="#fff" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowReportMenu(true);
          }}
        >
          <Flag size={28} color="#fff" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>

        <View style={styles.musicIcon}>
          <Music size={24} color="#ff0080" />
        </View>
      </View>

      <View style={styles.bottomInfo}>
        {performer && (
          <View style={styles.performerInfo}>
            <Image
              source={{ uri: performer.imageUrl }}
              style={styles.performerAvatar}
            />
            <Text style={styles.performerName}>{performer.stageName}</Text>
          </View>
        )}

        <Text style={styles.title}>{video.title}</Text>

        {venue && (
          <View style={styles.venueTag}>
            <View style={[styles.venueIndicator, venue.isOpen && styles.venueIndicatorLive]} />
            <Text style={styles.venueText}>{venue.name}</Text>
            {venue.isOpen && <Text style={styles.liveText}>LIVE</Text>}
          </View>
        )}

        <TouchableOpacity style={styles.joinButton} onPress={handleJoinLobby}>
          <Text style={styles.joinButtonText}>
            {venue && profile.badges.some(b => b.venueId === venue.id) ? 'Go to Server' : 'Join Lobby'}
          </Text>
        </TouchableOpacity>
      </View>

      <UserActionMenu
        visible={showReportMenu}
        onClose={() => setShowReportMenu(false)}
        userId={performer?.id || video.venueId}
        username={performer?.stageName || venue?.name || 'user'}
        contentId={video.id}
        contentType="video"
      />
    </View>
  );
}

interface EmptyStateProps {
  filter: FeedFilter;
  suggestedPerformers: typeof mockPerformers;
  onFollowPerformer: (id: string) => void;
  isFollowing: (id: string) => boolean;
}

function EmptyState({ filter, suggestedPerformers, onFollowPerformer, isFollowing }: EmptyStateProps) {
  if (filter === 'NEARBY') {
    return (
      <View style={styles.emptyContainer}>
        <MapPin size={64} color="#666" />
        <Text style={styles.emptyTitle}>No nearby content</Text>
        <Text style={styles.emptyText}>
          There are no videos from venues in your area right now.
        </Text>
        <Text style={styles.emptySubtext}>Check back later for fresh content!</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.emptyScrollContainer} contentContainerStyle={styles.emptyContainer}>
      <UserPlus size={64} color="#666" />
      <Text style={styles.emptyTitle}>No content from people you follow</Text>
      <Text style={styles.emptyText}>
        Follow performers to see their latest videos here.
      </Text>
      
      {suggestedPerformers.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Trending Local Performers</Text>
          {suggestedPerformers.map((performer) => (
            <View key={performer.id} style={styles.suggestionCard}>
              <Image
                source={{ uri: performer.imageUrl }}
                style={styles.suggestionAvatar}
              />
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionName}>{performer.stageName}</Text>
                <Text style={styles.suggestionGenres}>{performer.genres.join(', ')}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing(performer.id) && styles.followButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onFollowPerformer(performer.id);
                }}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing(performer.id) && styles.followButtonTextActive,
                  ]}
                >
                  {isFollowing(performer.id) ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  filterContainer: {
    position: 'absolute' as const,
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 12,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#ff0080',
    borderColor: '#ff0080',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  filterTextActive: {
    color: '#000000',
    fontWeight: '700' as const,
  },
  emptyScrollContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    paddingTop: 140,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 24,
    textAlign: 'center' as const,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  suggestionsContainer: {
    marginTop: 40,
    width: '100%',
  },
  suggestionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  suggestionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  suggestionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  suggestionGenres: {
    color: '#999',
    fontSize: 13,
    marginTop: 2,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#ff0080',
  },
  followButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#ff0080',
  },
  followButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  followButtonTextActive: {
    color: '#ff0080',
  },
  videoContainer: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative' as const,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  stickerContainer: {
    position: 'absolute' as const,
    top: 100,
    alignItems: 'center',
    zIndex: 10,
    marginLeft: '-50%',
    marginTop: '-50%',
  },
  gradient: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  sideActions: {
    position: 'absolute' as const,
    right: 12,
    bottom: 120,
    gap: 24,
    alignItems: 'center' as const,
  },
  actionButton: {
    alignItems: 'center' as const,
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  musicIcon: {
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(0, 255, 204, 0.2)',
    borderRadius: 20,
  },
  bottomInfo: {
    position: 'absolute' as const,
    bottom: 100,
    left: 16,
    right: 80,
  },
  performerInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  performerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ff0080',
  },
  performerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 20,
  },
  venueTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 16,
  },
  venueIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  venueIndicatorLive: {
    backgroundColor: '#a855f7',
  },
  venueText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  liveText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700' as const,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  joinButton: {
    backgroundColor: '#ff0080',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'flex-start' as const,
  },
  joinButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
