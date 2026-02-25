import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, Platform, Share, TextInput, PanResponder, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePerformer } from '@/contexts/PerformerContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useFeed } from '@/contexts/FeedContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpload } from '@/hooks/useUpload';
import { useNearbyVenues } from '@/hooks/useNearbyVenues';
import { mockVenues } from '@/mocks/venues';
import { Camera, Upload, Play, Pause, RotateCw, Zap, ZapOff, Check, Type, Music2, Share2, Instagram, ExternalLink, Video, Scissors, Sparkles, Sticker, X, MapPin, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import * as Haptics from 'expo-haptics';

// Import extracted components
import { StatsCard } from './studio-components/StatsCard';
import { GigCard } from './studio-components/GigCard';
import { FilterSelector } from './studio-components/FilterSelector';
import { StickerSelector } from './studio-components/StickerSelector';
import { VideoTrimmer } from './studio-components/VideoTrimmer';
import { COLORS, PromoStep, SafeZoneType, VibeFilter, StickerType } from './studio-components/types';

// Helper function to get filter preview styles
function getFilterPreviewStyle(filter: VibeFilter) {
  switch (filter) {
    case 'neon-glitch':
      return {
        backgroundColor: 'rgba(255, 0, 128, 0.15)',
      };
    case 'afterhours-noir':
      return {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      };
    case 'vhs-retro':
      return {
        backgroundColor: 'rgba(255, 200, 100, 0.2)',
      };
    case 'cyber-wave':
      return {
        backgroundColor: 'rgba(0, 255, 255, 0.15)',
      };
    case 'golden-hour':
      return {
        backgroundColor: 'rgba(255, 180, 0, 0.2)',
      };
    default:
      return {};
  }
}

// Helper function to render sticker preview
function renderStickerPreview(sticker: StickerType) {
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

  return (
    <View style={stickerStyles.container}>
      <Text style={stickerStyles.text}>{text}</Text>
    </View>
  );
}

// Draggable Sticker Component
interface DraggableStickerProps {
  sticker: StickerType;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  containerHeight: number;
}

function DraggableSticker({ sticker, position, onPositionChange, containerHeight }: DraggableStickerProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        // Calculate position relative to container, accounting for offset
        const touchX = gesture.moveX - containerOffset.x;
        const touchY = gesture.moveY - containerOffset.y;

        // Convert to percentage and clamp between 0-100
        const newX = Math.max(0, Math.min(100, (touchX / containerWidth) * 100));
        const newY = Math.max(0, Math.min(100, (touchY / containerHeight) * 100));

        onPositionChange({ x: newX, y: newY });
      },
      onPanResponderRelease: () => {
        // Position already updated during move
      },
    })
  ).current;

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

  return (
    <View
      ref={containerRef}
      style={styles.draggableStickerContainer}
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width);
        // Measure the container position after layout
        if (containerRef.current) {
          containerRef.current.measure((x, y, width, height, pageX, pageY) => {
            setContainerOffset({ x: pageX, y: pageY });
          });
        }
      }}
    >
      <View
        style={[
          styles.draggableSticker,
          {
            left: `${position.x}%`,
            top: `${position.y}%`,
          },
        ]}
      >
        {/* Larger invisible hitbox for easier grabbing */}
        <View
          {...panResponder.panHandlers}
          style={styles.draggableHitbox}
        >
          <View style={styles.draggableStickerBadge}>
            <Text style={styles.draggableStickerText}>{text}</Text>
          </View>
          <Text style={styles.dragHintText}>Drag to reposition</Text>
        </View>
      </View>
    </View>
  );
}

export default function StudioScreen() {
  const { profile } = useAppState();
  const { accessToken } = useAuth();
  const { upcomingGigs, completedGigs, analytics, createPromoVideo } = usePerformer();
  const { uploadVideo } = useFeed();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'create'>('upcoming');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Upload hook for Cloudinary video uploads
  const upload = useUpload({
    onSuccess: (result) => {
      setUploadedVideoUrl(result.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert('Upload Failed', error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
  const [promoStep, setPromoStep] = useState<PromoStep>('SELECT_METHOD');
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [safeZone, setSafeZone] = useState<SafeZoneType>('instagram');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(15);
  const [videoDuration, setVideoDuration] = useState(15);
  const [selectedFilter, setSelectedFilter] = useState<VibeFilter>('neon-glitch');
  const [selectedSticker, setSelectedSticker] = useState<StickerType>('get-tickets');
  const [showTextOverlay, setShowTextOverlay] = useState(true);
  const [audioTrack, setAudioTrack] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [selectedVenueName, setSelectedVenueName] = useState<string>('');
  const [selectedVenueAddress, setSelectedVenueAddress] = useState<string>('');
  const [showVenueSelector, setShowVenueSelector] = useState(false);
  const [venueSearchQuery, setVenueSearchQuery] = useState<string>('');
  const [stickerPosition, setStickerPosition] = useState({ x: 50, y: 15 }); // Default center top, percentage-based
  const stickerPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cameraRef = useRef<any>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraPermission, requestCameraPermissions] = useCameraPermissions();

  // Venue search using Google Places API
  const {
    venues: searchedVenues,
    isLoading: isLoadingVenues,
    searchVenuesByQuery,
    userLocation,
  } = useNearbyVenues({
    radiusMiles: 50,
    maxResults: 50,
    autoFetch: false, // Don't auto-fetch, only search when user types
  });

  // Handle venue search with debounce
  useEffect(() => {
    if (venueSearchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchVenuesByQuery(venueSearchQuery);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [venueSearchQuery]);

  // Video refs for previews (expo-av)
  const previewRef = useRef<Video>(null);

  // Format helpers - memoized for performance
  const formatCurrency = useCallback((amount: number) => {
    return `$${amount.toLocaleString()}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Permission handling
  const handleRequestPermissions = async () => {
    const cameraStatus = await requestCameraPermissions();

    if (!cameraStatus.granted) {
      Alert.alert(
        'Permissions Required',
        'Camera and microphone access are needed to record promo videos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Recording functions
  const startCountdown = () => {
    setCountdown(3);
    let count = 3;

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        beginRecording();
      }
    }, 1000);
  };

  const beginRecording = async () => {
    if (!cameraRef.current) return;

    setIsRecording(true);
    setRecordingDuration(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        const newDuration = prev + 0.1;
        if (newDuration >= 15) {
          handleStopRecording();
          return 15;
        }
        return newDuration;
      });
    }, 100);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 15,
      });

      setRecordedVideo(video.uri);
      setVideoDuration(15);
      setTrimStart(0);
      setTrimEnd(15);
      setPromoStep('TRIM');
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Recording Error', 'Failed to record video. Please try again.');
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current) return;

    const hasPermissions = await handleRequestPermissions();
    if (!hasPermissions) return;

    startCountdown();
  };

  const handleStopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    setIsRecording(false);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const handleUploadVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 15,
      });

      if (!result.canceled && result.assets[0]) {
        const duration = result.assets[0].duration ? result.assets[0].duration / 1000 : 15;
        setRecordedVideo(result.assets[0].uri);
        setVideoDuration(duration);
        setTrimStart(0);
        setTrimEnd(Math.min(duration, 15));
        setPromoStep('TRIM');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'Failed to select video. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!recordedVideo) return;

    try {
      await Share.share({
        message: 'Check out my promo video!',
        url: recordedVideo,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handlePostToFeed = async () => {
    if (!recordedVideo) return;

    if (!videoTitle.trim()) {
      Alert.alert('Title Required', 'Please add a title for your video');
      return;
    }

    if (!accessToken) {
      Alert.alert('Authentication Required', 'Please sign in to upload videos');
      return;
    }

    try {
      // Step 1: Upload video to Cloudinary
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const cloudinaryResult = await upload.uploadHighlightFromUri(recordedVideo);

      if (!cloudinaryResult) {
        throw new Error('Video upload to Cloudinary failed');
      }

      // Step 2: Post to feed with Cloudinary URL
      await uploadVideo.mutateAsync({
        videoUrl: cloudinaryResult.url,
        venueId: selectedVenueId,
        title: videoTitle,
        duration: trimEnd - trimStart,
        filter: selectedFilter,
        sticker: selectedSticker,
        stickerPosition: selectedSticker !== 'none' ? stickerPosition : undefined,
      });

      Alert.alert(
        'Video Posted!',
        'Your video has been uploaded and posted to the feed successfully.',
        [
          {
            text: 'View Feed',
            onPress: () => {
              // Reset studio state
              setPromoStep('SELECT_METHOD');
              setRecordedVideo(null);
              setVideoTitle('');
              setUploadedVideoUrl(null);
              // Navigate to feed tab
              router.push('/(tabs)/feed');
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              setPromoStep('SELECT_METHOD');
              setRecordedVideo(null);
              setVideoTitle('');
              setUploadedVideoUrl(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Failed to upload video. Please try again.');
    }
  };

  // Memoized gig press handler
  const handleGigPress = useCallback((gig: any) => {
    if (gig.status === 'UPCOMING') {
      createPromoVideo(gig);
    }
  }, [createPromoVideo]);

  // Access denied screen for non-talent users
  if (profile.role !== 'TALENT') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <LinearGradient
            colors={['#ff006e', '#8338ec'] as [string, string, ...string[]]}
            style={styles.accessDeniedIconContainer}
          >
            <Video size={48} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>
          <Text style={styles.accessDeniedTitle}>Talent Access Only</Text>
          <Text style={styles.accessDeniedText}>
            The Promo Studio is exclusively for performers and DJs.
            Switch to a Talent account to create promotional videos and manage your gigs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Recording screen
  if (promoStep === 'RECORDING') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
            flash={flashMode}
          />

          {/* Countdown overlay */}
          {countdown !== null && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Camera controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setCameraType(prev => prev === 'back' ? 'front' : 'back')}
            >
              <RotateCw size={24} color={COLORS.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setFlashMode(prev => prev === 'off' ? 'on' : 'off')}
            >
              {flashMode === 'on' ? (
                <Zap size={24} color={COLORS.warning} />
              ) : (
                <ZapOff size={24} color={COLORS.text} />
              )}
            </TouchableOpacity>
          </View>

          {/* Recording button */}
          <View style={styles.recordButtonContainer}>
            {isRecording ? (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStopRecording}
              >
                <View style={styles.stopButtonInner} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={handleStartRecording}
              >
                <View style={styles.recordButtonInner} />
              </TouchableOpacity>
            )}
          </View>

          {/* Recording duration */}
          {isRecording && (
            <View style={styles.durationContainer}>
              <View style={styles.recordingIndicator} />
              <Text style={styles.durationText}>
                {recordingDuration.toFixed(1)}s / 15.0s
              </Text>
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setPromoStep('SELECT_METHOD')}
          >
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Trim screen
  if (promoStep === 'TRIM' && recordedVideo) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPromoStep('SELECT_METHOD')}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trim Video</Text>
          <TouchableOpacity onPress={() => setPromoStep('CUSTOMIZE')}>
            <Check size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoPreviewContainer}>
          <Video
            ref={previewRef}
            source={{ uri: recordedVideo || '' }}
            style={styles.videoPreview}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isLooping={true}
            useNativeControls={false}
          />

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause size={32} color={COLORS.text} />
            ) : (
              <Play size={32} color={COLORS.text} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.trimControlsContainer}>
          <VideoTrimmer
            trimStart={trimStart}
            trimEnd={trimEnd}
            videoDuration={videoDuration}
            onTrimStartChange={setTrimStart}
            onTrimEndChange={setTrimEnd}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Customize screen
  if (promoStep === 'CUSTOMIZE' && recordedVideo) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPromoStep('TRIM')}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customize</Text>
          <TouchableOpacity onPress={() => setPromoStep('SHARE')}>
            <Check size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.customizeScroll}>
          <View style={styles.videoPreviewSmall}>
            <Video
              source={{ uri: recordedVideo || '' }}
              style={styles.videoPreviewSmallVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              isLooping={true}
              useNativeControls={false}
            />

            {/* Filter Preview Overlay */}
            {selectedFilter !== 'none' && (
              <View style={[styles.filterPreviewOverlay, getFilterPreviewStyle(selectedFilter)]} />
            )}

            {/* Draggable Sticker Preview */}
            {selectedSticker !== 'none' && (
              <DraggableSticker
                sticker={selectedSticker}
                position={stickerPosition}
                onPositionChange={setStickerPosition}
                containerHeight={400}
              />
            )}
          </View>

          <FilterSelector
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
          />

          <StickerSelector
            selectedSticker={selectedSticker}
            onSelectSticker={setSelectedSticker}
          />

          <View style={styles.textOverlaySection}>
            <View style={styles.sectionHeader}>
              <Type size={20} color={COLORS.accent} />
              <Text style={styles.sectionTitle}>Text Overlay</Text>
            </View>
            <TouchableOpacity
              style={styles.textOverlayToggle}
              onPress={() => setShowTextOverlay(!showTextOverlay)}
            >
              <Text style={styles.textOverlayLabel}>Show Text</Text>
              <View style={[styles.toggle, showTextOverlay && styles.toggleActive]}>
                <View style={[styles.toggleKnob, showTextOverlay && styles.toggleKnobActive]} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Share screen
  if (promoStep === 'SHARE' && recordedVideo) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setPromoStep('CUSTOMIZE')}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Video</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.shareContainer}>
          <View style={styles.videoPreviewFinal}>
            <Video
              source={{ uri: recordedVideo || '' }}
              style={styles.videoPreviewFinalVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={true}
              isLooping={true}
              useNativeControls={false}
            />

            {/* Filter Preview Overlay */}
            {selectedFilter !== 'none' && (
              <View style={[styles.filterPreviewOverlay, getFilterPreviewStyle(selectedFilter)]} />
            )}

            {/* Sticker Preview (non-draggable on share screen) */}
            {selectedSticker !== 'none' && (
              <View style={[
                styles.stickerPreviewContainerFinal,
                {
                  top: `${stickerPosition.y}%`,
                  left: `${stickerPosition.x}%`,
                }
              ]}>
                {renderStickerPreview(selectedSticker)}
              </View>
            )}
          </View>

          {/* Video Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Add a catchy title..."
              placeholderTextColor="#666"
              value={videoTitle}
              onChangeText={setVideoTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{videoTitle.length}/100</Text>
          </View>

          {/* Venue Selector */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Venue *</Text>
            <TouchableOpacity
              style={styles.venueSelector}
              onPress={() => setShowVenueSelector(true)}
            >
              <MapPin size={20} color={COLORS.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.venueSelectorText}>
                  {selectedVenueName || 'Search for a venue'}
                </Text>
                {selectedVenueAddress && (
                  <Text style={styles.venueAddressSubtext}>
                    {selectedVenueAddress}
                  </Text>
                )}
              </View>
              <Text style={styles.venueSelectorArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Post to Feed Button */}
          <TouchableOpacity
            style={[
              styles.postToFeedButton,
              (upload.isUploading || uploadVideo.isPending) && styles.postToFeedButtonDisabled
            ]}
            onPress={handlePostToFeed}
            disabled={upload.isUploading || uploadVideo.isPending}
          >
            {upload.isUploading ? (
              <>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={styles.postToFeedButtonText}>
                  Uploading {upload.uploadProgress}%
                </Text>
              </>
            ) : uploadVideo.isPending ? (
              <>
                <ActivityIndicator size="small" color={COLORS.text} />
                <Text style={styles.postToFeedButtonText}>
                  Posting to Feed...
                </Text>
              </>
            ) : (
              <>
                <Check size={20} color={COLORS.text} />
                <Text style={styles.postToFeedButtonText}>
                  Post to Feed
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Share Options */}
          <View style={styles.shareOptionsContainer}>
            <Text style={styles.shareOptionsTitle}>Or Share Externally</Text>
            <View style={styles.shareOptions}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Instagram size={24} color={COLORS.text} />
                <Text style={styles.shareButtonText}>Instagram Story</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={24} color={COLORS.text} />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <ExternalLink size={24} color={COLORS.text} />
                <Text style={styles.shareButtonText}>More Options</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Venue Selector Modal */}
        <Modal
          visible={showVenueSelector}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowVenueSelector(false);
            setVenueSearchQuery('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Venue</Text>
                <TouchableOpacity onPress={() => {
                  setShowVenueSelector(false);
                  setVenueSearchQuery('');
                }}>
                  <X size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchInputContainer}>
                <Search size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search venues by name..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={venueSearchQuery}
                  onChangeText={setVenueSearchQuery}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {venueSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setVenueSearchQuery('')}>
                    <X size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Loading Indicator */}
              {isLoadingVenues && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Searching venues...</Text>
                </View>
              )}

              {/* Results */}
              <ScrollView style={styles.venueResultsScroll}>
                {venueSearchQuery.trim().length < 2 ? (
                  <View style={styles.searchPromptContainer}>
                    <Search size={48} color={COLORS.textSecondary} />
                    <Text style={styles.searchPromptText}>
                      Type at least 2 characters to search for venues
                    </Text>
                  </View>
                ) : searchedVenues.length === 0 && !isLoadingVenues ? (
                  <View style={styles.noResultsContainer}>
                    <MapPin size={48} color={COLORS.textSecondary} />
                    <Text style={styles.noResultsText}>
                      No venues found for &quot;{venueSearchQuery}&quot;
                    </Text>
                    <Text style={styles.noResultsSubtext}>
                      Try a different search term or check your spelling
                    </Text>
                  </View>
                ) : (
                  searchedVenues.map((venue) => (
                    <TouchableOpacity
                      key={venue.id}
                      style={styles.venueOption}
                      onPress={() => {
                        setSelectedVenueId(venue.id);
                        setSelectedVenueName(venue.name);
                        setSelectedVenueAddress(venue.location.address);
                        setShowVenueSelector(false);
                        setVenueSearchQuery('');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <MapPin
                        size={20}
                        color={selectedVenueId === venue.id ? COLORS.accent : COLORS.textSecondary}
                      />
                      <View style={styles.venueInfo}>
                        <Text style={[
                          styles.venueOptionText,
                          selectedVenueId === venue.id && styles.venueOptionTextActive
                        ]}>
                          {venue.name}
                        </Text>
                        <Text style={styles.venueAddressText}>
                          {venue.location.address}
                        </Text>
                        {venue.distance && (
                          <Text style={styles.venueDistanceText}>
                            {venue.distance.toFixed(1)} miles away
                          </Text>
                        )}
                      </View>
                      {selectedVenueId === venue.id && (
                        <Check size={20} color={COLORS.accent} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Main dashboard screen
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Studio</Text>
        <Text style={styles.headerSubtitle}>Manage your gigs & content</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Analytics Stats */}
        <View style={styles.statsGrid}>
          <StatsCard
            icon={<Video size={24} color={COLORS.accent} />}
            label="Total Earnings"
            value={formatCurrency(analytics.totalRevenue)}
            subtitle={`${analytics.totalGigs} completed gigs`}
          />
          <StatsCard
            icon={<Video size={24} color={COLORS.success} />}
            label="Bar Sales Generated"
            value={formatCurrency(analytics.totalBarSalesGenerated)}
            subtitle="Venue revenue"
          />
          <StatsCard
            icon={<Video size={24} color={COLORS.purple} />}
            label="Avg Ticket Clicks"
            value={Math.round(analytics.averageTicketClicks).toString()}
            subtitle="Per promo video"
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming ({upcomingGigs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              Completed ({completedGigs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.tabActive]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
              Create Video
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gigs List */}
        <View style={styles.gigsContainer}>
          {activeTab === 'upcoming' && upcomingGigs.map(gig => (
            <GigCard
              key={gig.id}
              gig={gig}
              onPress={() => handleGigPress(gig)}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          ))}

          {activeTab === 'completed' && completedGigs.map(gig => (
            <GigCard
              key={gig.id}
              gig={gig}
              onPress={() => handleGigPress(gig)}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          ))}

          {activeTab === 'create' && (
            <View style={styles.createVideoContainer}>
              <View style={styles.createVideoHeader}>
                <View style={styles.createVideoIconContainer}>
                  <Video size={32} color={COLORS.accent} />
                </View>
                <Text style={styles.createVideoTitle}>Promo Video Studio</Text>
                <Text style={styles.createVideoSubtitle}>
                  Create 10-15 second promotional videos for your upcoming gigs with professional templates and effects.
                </Text>
              </View>

              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Camera size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>9:16 Vertical Recording</Text>
                    <Text style={styles.featureDesc}>Perfect for Instagram Reels & TikTok</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Scissors size={20} color={COLORS.purple} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Smart Clip Trimmer</Text>
                    <Text style={styles.featureDesc}>Trim to exactly 10-15 seconds</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Sparkles size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Vibe Filters</Text>
                    <Text style={styles.featureDesc}>5 nightlife-themed filters</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Sticker size={20} color={COLORS.purple} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>Call-to-Action Stickers</Text>
                    <Text style={styles.featureDesc}>Drive engagement</Text>
                  </View>
                </View>
              </View>

              <View style={styles.createVideoActions}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setPromoStep('RECORDING')}
                >
                  <Camera size={20} color={COLORS.text} />
                  <Text style={styles.primaryButtonText}>Record Video</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleUploadVideo}
                >
                  <Upload size={20} color={COLORS.accent} />
                  <Text style={styles.secondaryButtonText}>Upload Existing</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    padding: 20,
    gap: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  gigsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  createVideoContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  createVideoHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  createVideoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createVideoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  createVideoSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresList: {
    gap: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  createVideoActions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  accessDeniedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  accessDeniedText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    gap: 16,
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.error,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.error,
  },
  durationContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '700',
    color: COLORS.text,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trimControlsContainer: {
    padding: 20,
  },
  customizeScroll: {
    flex: 1,
    padding: 20,
  },
  videoPreviewSmall: {
    aspectRatio: 9 / 16,
    maxHeight: 400,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  videoPreviewSmallVideo: {
    width: '100%',
    height: '100%',
  },
  filterPreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  stickerPreviewContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  draggableStickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  draggableSticker: {
    position: 'absolute',
    alignItems: 'center',
    marginLeft: '-50%',
    marginTop: '-50%',
  },
  draggableHitbox: {
    padding: 30, // Larger hitbox area
    marginTop: -30,
    marginLeft: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draggableStickerBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ff0080',
    shadowColor: '#ff0080',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  draggableStickerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  dragHintText: {
    color: '#ff0080',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textOverlaySection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  textOverlayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  textOverlayLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.accent,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.text,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  shareContainer: {
    flex: 1,
    padding: 20,
  },
  videoPreviewFinal: {
    aspectRatio: 9 / 16,
    maxHeight: 400,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  videoPreviewFinalVideo: {
    width: '100%',
    height: '100%',
  },
  stickerPreviewContainerFinal: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
    marginLeft: '-50%',
    marginTop: '-50%',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  venueSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  venueSelectorText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  venueSelectorArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  postToFeedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
  },
  postToFeedButtonDisabled: {
    opacity: 0.6,
  },
  postToFeedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  shareOptionsContainer: {
    marginTop: 12,
  },
  shareOptionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  shareOptions: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  venueOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  venueOptionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  venueOptionTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  venueInfo: {
    flex: 1,
  },
  venueAddressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  venueDistanceText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
  venueAddressSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  venueResultsScroll: {
    maxHeight: 400,
  },
  searchPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  searchPromptText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
