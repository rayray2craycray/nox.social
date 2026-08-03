import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { X, MapPin, Users, DollarSign, Navigation, Ghost, ChevronUp, ChevronDown, RefreshCw, Info, List, Map as MapIcon, Star } from 'lucide-react-native';
import { Venue, FriendLocation, GroupPurchase } from '@/types';
import { useDiscovery, useAppState } from '@/contexts/AppStateContext';
import { useSocial } from '@/contexts/SocialContext';
import { useGrowth } from '@/contexts/GrowthContext';
import { useGlow } from '@/contexts/GlowContext';
import { useMonetization } from '@/contexts/MonetizationContext';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import UserProfileModal from '@/components/UserProfileModal';
import { GroupPurchaseCard } from '@/components/GroupPurchaseCard';
import { GroupPurchaseModal } from '@/components/modals/GroupPurchaseModal';
import VenueDetailsModal from '@/components/VenueDetailsModal';
import { PricingBadge } from '@/components/PricingBadge';
import { useNearbyVenues } from '@/hooks/useNearbyVenues';
import { DiscoveredVenue } from '@/services/places.service';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DiscoveryScreen() {
  const { selectedVenueId, setSelectedVenueId } = useDiscovery();
  const { friendLocations, getFriendsByVenue, locationSettings, toggleGhostMode, getLargestFriendCluster, getVenueSocialProofData } = useSocial();
  const { openGroupPurchases, joinGroupPurchase, createGroupPurchase } = useGrowth();
  const { getDynamicPricing } = useMonetization();
  const [locationPermission, setLocationPermission] = useState(false);
  const [showFriendDrawer, setShowFriendDrawer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showGroupPurchaseModal, setShowGroupPurchaseModal] = useState(false);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const mapRef = useRef<MapView>(null);

  // Use Google Places API to fetch real venues within 50-mile radius
  const {
    venues: discoveredVenues,
    isLoading: isLoadingVenues,
    error: venuesError,
    userLocation,
    refreshVenues,
  } = useNearbyVenues({
    radiusMiles: 50,
    maxResults: 100,
    autoFetch: true,
  });

  const handleOpenDM = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowUserProfile(false);
    router.push(`/servers?openDM=${userId}`);
  };

  useEffect(() => {
    requestLocationAccess();
  }, []);

  const requestLocationAccess = async () => {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.status === 'granted') {
      setLocationPermission(true);
      return;
    }

    if (existing.canAskAgain) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status !== 'granted') {
        showLocationDeniedAlert();
      }
      return;
    }

    setLocationPermission(false);
    showLocationDeniedAlert();
  };

  const showLocationDeniedAlert = () => {
    Alert.alert(
      'Location Access Needed',
      'Nox uses your location to show nearby venues. Enable location access in Settings to see the map.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const recenterMap = () => {
    if (userLocation && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 1000);
    }
  };

  const findMyGroup = () => {
    const cluster = getLargestFriendCluster();
    if (cluster && mapRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      mapRef.current.animateToRegion({
        latitude: cluster.location.latitude,
        longitude: cluster.location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000);
    } else {
      Alert.alert('No Friends Online', 'None of your friends are currently at any venues.');
    }
  };

  // Convert discovered venues to match Venue type for compatibility
  const convertedVenues = useMemo(() => {
    return discoveredVenues.map((venue): Venue => ({
      id: venue.id,
      name: venue.name,
      type: venue.type,
      location: {
        latitude: venue.location.latitude,
        longitude: venue.location.longitude,
        address: venue.location.address,
        city: venue.location.city || '',
        state: venue.location.state || '',
        country: 'USA',
      },
      rating: venue.rating || 0,
      priceLevel: venue.priceLevel || 2,
      hours: {
        monday: '6:00 PM - 2:00 AM',
        tuesday: '6:00 PM - 2:00 AM',
        wednesday: '6:00 PM - 2:00 AM',
        thursday: '6:00 PM - 2:00 AM',
        friday: '6:00 PM - 4:00 AM',
        saturday: '6:00 PM - 4:00 AM',
        sunday: '6:00 PM - 2:00 AM',
      },
      imageUrl: venue.photoUrl || 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2',
      tags: [venue.type.toLowerCase()],
      genres: [], // Google Maps venues don't have genre data
      capacity: 200,
      features: [],
      isOpen: venue.isOpen || false,
      distance: venue.distance,
      // Add required fields for venue joining
      hasPublicLobby: true, // All real venues have public lobby access
      vipThreshold: 0, // No VIP threshold for public venues
      currentVibeLevel: 75, // Default vibe level
      description: '', // No description from Google Places
      phoneNumber: '', // Would need separate API call to get this
      website: '', // Would need separate API call to get this
    }));
  }, [discoveredVenues]);

  const nearbyVenues = useMemo(() => {
    return convertedVenues;
  }, [convertedVenues]);

  const friendsByVenue = useMemo(() => {
    return nearbyVenues.reduce((acc, venue) => {
      const friends = getFriendsByVenue(venue.id);
      if (friends.length > 0) {
        acc[venue.id] = friends;
      }
      return acc;
    }, {} as Record<string, typeof friendLocations>);
  }, [nearbyVenues, getFriendsByVenue]);

  const selectedVenue = nearbyVenues.find(v => v.id === selectedVenueId);

  // Filter group purchases for selected venue
  const venueGroupPurchases = useMemo(() => {
    if (!selectedVenueId) return [];
    return openGroupPurchases.filter((gp: GroupPurchase) => gp.venueId === selectedVenueId);
  }, [selectedVenueId, openGroupPurchases]);

  if (isLoadingVenues && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0080" />
        <Text style={styles.loadingText}>
          {userLocation ? 'Finding nearby venues...' : 'Getting your location...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          Searching within 50 miles
        </Text>
      </View>
    );
  }

  if (venuesError && !isLoadingVenues) {
    return (
      <View style={styles.loadingContainer}>
        <MapPin size={48} color="#ff0080" />
        <Text style={styles.loadingText}>Unable to load venues</Text>
        <Text style={styles.loadingSubtext}>{venuesError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            refreshVenues();
          }}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
        {!locationPermission && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: '#1a1a2e', marginTop: 12 }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.retryButtonText}>Open Settings</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {viewMode === 'list' ? (
        <VenueListView
          venues={nearbyVenues}
          friendsByVenue={friendsByVenue}
          onVenuePress={(venueId) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedVenueId(venueId);
          }}
        />
      ) : (
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: 40.7489,
          longitude: -73.9680,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={locationPermission}
        showsMyLocationButton={false}
      >
        {nearbyVenues.map(venue => {
          const venueFriends = friendsByVenue[venue.id] || [];
          const venuePricing = getDynamicPricing(venue.id);
          return (
            <Marker
              key={venue.id}
              coordinate={{
                latitude: venue.location.latitude,
                longitude: venue.location.longitude,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedVenueId(venue.id);
              }}
            >
              <View style={styles.markerWrapper}>
                <View style={[styles.markerContainer, venue.isOpen && styles.markerLive]}>
                  <Text style={styles.markerText}>🎵</Text>
                  {venue.isOpen && <View style={styles.pulseDot} />}
                  {venueFriends.length > 0 && (
                    <View style={styles.friendCountBadge}>
                      <Text style={styles.friendCountText}>{venueFriends.length}</Text>
                    </View>
                  )}
                </View>
                {venuePricing && (
                  <View style={styles.markerPricingBadge}>
                    <PricingBadge pricing={venuePricing} size="small" />
                  </View>
                )}
              </View>
            </Marker>
          );
        })}

        {friendLocations.map(friend => (
          <Marker
            key={friend.userId}
            coordinate={friend.location}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedUserId(friend.userId);
              setShowUserProfile(true);
            }}
          >
            <View style={styles.friendAvatarContainer}>
              <View style={[
                styles.friendAvatarRing,
                friend.venueId ? styles.friendAvatarRingVenue : styles.friendAvatarRingActive
              ]}>
                <Image
                  source={{ uri: friend.avatarUrl }}
                  style={styles.friendAvatar}
                />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>
      )}

      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(10,10,15,0.95)', 'rgba(10,10,15,0.7)', 'transparent']}
          style={styles.headerGradient}
        />
        <Text style={styles.headerTitle}>Discover Venues</Text>
        <Text style={styles.headerSubtitle}>
          {`${nearbyVenues.filter(v => v.isOpen).length} open now • ${nearbyVenues.length} within 50 miles`}
        </Text>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setViewMode(viewMode === 'map' ? 'list' : 'map');
          }}
          testID="view-mode-toggle"
        >
          {viewMode === 'map' ? (
            <List size={22} color="#fff" />
          ) : (
            <MapIcon size={22} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, locationSettings.ghostMode && styles.controlButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleGhostMode();
          }}
        >
          <Ghost size={22} color={locationSettings.ghostMode ? '#000000' : '#fff'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await refreshVenues();
          }}
        >
          <RefreshCw size={22} color="#fff" />
        </TouchableOpacity>

        {friendLocations.length > 0 && (
          <TouchableOpacity style={styles.controlButton} onPress={findMyGroup}>
            <Users size={22} color="#fff" />
          </TouchableOpacity>
        )}

        {viewMode === 'map' && (
          <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
            <Navigation size={24} color="#000000" />
          </TouchableOpacity>
        )}
      </View>

      {!selectedVenue && friendLocations.length > 0 && (
        <TouchableOpacity 
          style={styles.friendDrawerToggle} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFriendDrawer(!showFriendDrawer);
          }}
        >
          <View style={styles.friendDrawerToggleContent}>
            {showFriendDrawer ? <ChevronDown size={20} color="#fff" /> : <ChevronUp size={20} color="#fff" />}
            <Text style={styles.friendDrawerToggleText}>
              {friendLocations.length} {friendLocations.length === 1 ? 'Friend' : 'Friends'} Online
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {showFriendDrawer && !selectedVenue && (
        <FriendListDrawer
          friendLocations={friendLocations}
          onClose={() => setShowFriendDrawer(false)}
          onFriendPress={(friend) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedUserId(friend.userId);
            setShowUserProfile(true);
            setShowFriendDrawer(false);
          }}
        />
      )}

      {selectedVenue && (
        <VenueBottomSheet
          venue={selectedVenue}
          friendsAtVenue={friendsByVenue[selectedVenue.id] || []}
          groupPurchases={venueGroupPurchases}
          onClose={() => setSelectedVenueId(null)}
          onCreateGroupPurchase={() => setShowGroupPurchaseModal(true)}
          onJoinGroupPurchase={(groupPurchaseId) => joinGroupPurchase({ groupPurchaseId, userId: 'user-me' })}
          onViewDetails={() => setShowVenueDetails(true)}
        />
      )}

      <UserProfileModal
        visible={showUserProfile}
        userId={selectedUserId}
        onClose={() => setShowUserProfile(false)}
        onMessage={handleOpenDM}
      />

      <GroupPurchaseModal
        visible={showGroupPurchaseModal}
        venueId={selectedVenueId || undefined}
        venueName={selectedVenue?.name}
        onClose={() => setShowGroupPurchaseModal(false)}
        onCreate={(purchase) => {
          createGroupPurchase(purchase);
          setShowGroupPurchaseModal(false);
        }}
      />

      <VenueDetailsModal
        visible={showVenueDetails}
        placeId={selectedVenue?.id || null}
        venueName={selectedVenue?.name}
        onClose={() => setShowVenueDetails(false)}
      />
    </View>
  );
}

interface VenueListViewProps {
  venues: (Venue & { distance?: number })[];
  friendsByVenue: Record<string, FriendLocation[]>;
  onVenuePress: (venueId: string) => void;
}

function VenueListView({ venues, friendsByVenue, onVenuePress }: VenueListViewProps) {
  const renderVenue = ({ item: venue }: { item: Venue & { distance?: number } }) => {
    const friendCount = (friendsByVenue[venue.id] || []).length;
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => onVenuePress(venue.id)}
        testID={`venue-list-item-${venue.id}`}
      >
        <LinearGradient colors={['#1a1a2e', '#15151f']} style={styles.listCardGradient}>
          <Image source={{ uri: venue.imageUrl }} style={styles.listCardImage} />
          <View style={styles.listCardBody}>
            <View style={styles.listCardTopRow}>
              <Text style={styles.listCardName} numberOfLines={1}>{venue.name}</Text>
              {venue.isOpen && (
                <View style={styles.listOpenBadge}>
                  <Text style={styles.listOpenBadgeText}>OPEN</Text>
                </View>
              )}
            </View>
            <Text style={styles.listCardMeta} numberOfLines={1}>
              {venue.type}
              {venue.distance !== undefined ? ` • ${venue.distance.toFixed(1)} mi` : ''}
              {venue.location.city ? ` • ${venue.location.city}` : ''}
            </Text>
            <View style={styles.listCardBottomRow}>
              {(venue.rating ?? 0) > 0 && (
                <View style={styles.listRating}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.listRatingText}>{(venue.rating ?? 0).toFixed(1)}</Text>
                </View>
              )}
              <Text style={styles.listPriceLevel}>{'$'.repeat(venue.priceLevel || 2)}</Text>
              {friendCount > 0 && (
                <View style={styles.listFriendBadge}>
                  <Users size={12} color="#00d4ff" />
                  <Text style={styles.listFriendBadgeText}>{friendCount}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={venues}
      keyExtractor={(v) => v.id}
      renderItem={renderVenue}
      style={styles.listContainer}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.listEmpty}>
          <MapPin size={40} color="#666" />
          <Text style={styles.listEmptyText}>No venues found nearby</Text>
        </View>
      }
    />
  );
}

interface FriendListDrawerProps {
  friendLocations: FriendLocation[];
  onClose: () => void;
  onFriendPress: (friend: FriendLocation) => void;
}

function FriendListDrawer({ friendLocations, onClose, onFriendPress }: FriendListDrawerProps) {
  const venueGroups = useMemo(() => {
    const grouped = friendLocations.reduce((acc, friend) => {
      const key = friend.venueId || 'exploring';
      if (!acc[key]) {
        acc[key] = {
          venueName: friend.venueName || 'Exploring',
          friends: [],
        };
      }
      acc[key].friends.push(friend);
      return acc;
    }, {} as Record<string, { venueName: string; friends: FriendLocation[] }>);
    return Object.values(grouped);
  }, [friendLocations]);

  return (
    <View style={styles.friendDrawer}>
      <LinearGradient
        colors={['#1a1a1a', '#1a1a2e']}
        style={styles.friendDrawerGradient}
      >
        <View style={styles.friendDrawerHeader}>
          <Text style={styles.friendDrawerTitle}>Friends Online</Text>
          <TouchableOpacity onPress={onClose} style={styles.friendDrawerClose}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.friendDrawerScroll} showsVerticalScrollIndicator={false}>
          {venueGroups.map((group, idx) => (
            <View key={idx} style={styles.venueGroup}>
              <View style={styles.venueGroupHeader}>
                <MapPin size={14} color="#ff0080" />
                <Text style={styles.venueGroupName}>{group.venueName}</Text>
                <Text style={styles.venueGroupCount}>{group.friends.length}</Text>
              </View>
              
              {group.friends.map((friend) => (
                <TouchableOpacity
                  key={friend.userId}
                  style={styles.friendItem}
                  onPress={() => onFriendPress(friend)}
                >
                  <View style={[styles.friendAvatarRing, styles.friendAvatarRingActive]}>
                    <Image
                      source={{ uri: friend.avatarUrl }}
                      style={styles.friendItemAvatar}
                    />
                  </View>
                  <View style={styles.friendItemInfo}>
                    <Text style={styles.friendItemName}>{friend.displayName}</Text>
                    <Text style={styles.friendItemStatus}>
                      {friend.precision === 'EXACT' ? 'Exact location' : 'At venue'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

interface VenueBottomSheetProps {
  venue: Venue;
  friendsAtVenue: FriendLocation[];
  groupPurchases: GroupPurchase[];
  onClose: () => void;
  onCreateGroupPurchase: () => void;
  onJoinGroupPurchase: (groupPurchaseId: string) => void;
  onViewDetails: () => void;
}

function VenueBottomSheet({ venue, friendsAtVenue, groupPurchases, onClose, onCreateGroupPurchase, onJoinGroupPurchase, onViewDetails }: VenueBottomSheetProps) {
  const { profile, updateProfile, updateProfileAsync, awardBadge, canRejoinVenue, calculateVibePercentage } = useAppState();
  const { triggerGlow } = useGlow();
  const { getDynamicPricing } = useMonetization();

  // Get calculated vibe from user feedback, fallback to static value
  const calculatedVibe = calculateVibePercentage(venue.id);
  const vibePercentage = calculatedVibe ?? venue.currentVibeLevel;
  const isLiveVibe = calculatedVibe !== null;

  // Get dynamic pricing
  const dynamicPricing = getDynamicPricing(venue.id);

  const handleGetDirections = () => {
    const { latitude, longitude } = venue.location;
    const label = encodeURIComponent(venue.name);
    
    let url = '';
    
    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${latitude},${longitude}&q=${label}`;
    } else if (Platform.OS === 'android') {
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(url).catch(() => {
      const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(fallbackUrl).catch(() => {
        Alert.alert('Error', 'Unable to open maps');
      });
    });
  };

  const handleJoinLobby = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (__DEV__) {
      console.log('[Discovery] handleJoinLobby called');
      console.log('[Discovery] venue.id:', venue.id);
      console.log('[Discovery] venue.name:', venue.name);
      console.log('[Discovery] Current badges:', profile.badges.map(b => b.venueId));
    }

    const alreadyJoined = profile.badges.some(badge => badge.venueId === venue.id);

    if (alreadyJoined) {
      if (__DEV__) console.log('[Discovery] Already joined, navigating to servers');
      router.push('/(tabs)/servers');
      return;
    }

    const hasLeftBefore = profile.transactionHistory.some(t => t.venueId === venue.id) && 
                          !profile.badges.some(b => b.venueId === venue.id);
    
    if (hasLeftBefore) {
      const canRejoin = canRejoinVenue(venue.id, venue);
      
      if (!canRejoin) {
        const venueSpend = profile.transactionHistory
          .filter(t => t.venueId === venue.id)
          .reduce((sum, t) => sum + t.amount, 0);
        
        Alert.alert(
          'Cannot Re-enter Inner Circle',
          `Your Toast spend history (${venueSpend}) does not meet ${venue.name}'s VIP threshold (${venue.vipThreshold}). You can only re-enter if you meet the venue's active spend requirements.`,
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Welcome Back!',
        venue.hasPublicLobby 
          ? `You can re-enter ${venue.name}'s public lobby anytime.`
          : `Your Toast spend history meets ${venue.name}'s VIP requirements. Welcome back to the Inner Circle!`,
        [
          {
            text: 'Join',
            onPress: async () => {
              await awardBadge({
                venueId: venue.id,
                venueName: venue.name,
                badgeType: 'GUEST',
              });

              triggerGlow({ color: 'purple', intensity: 0.6, duration: 1000 });
              router.push('/(tabs)/servers');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      const newTransaction = {
        id: `tx-${Date.now()}`,
        venueId: venue.id,
        amount: 0,
        timestamp: new Date().toISOString(),
      };

      // Wait for profile update to complete before navigating
      try {
        // awardBadge persists server-side and updates state+cache; the
        // transaction is a separate local-only profile field.
        await awardBadge({
          venueId: venue.id,
          venueName: venue.name,
          badgeType: 'GUEST',
        });
        await updateProfileAsync({
          transactionHistory: [...profile.transactionHistory, newTransaction],
        });

        if (__DEV__) {
          console.log('[Discovery] Profile update completed successfully');
        }

        triggerGlow({ color: 'purple', intensity: 0.6, duration: 1000 });

        Alert.alert(
          'Joined!',
          `You've joined ${venue.name}'s public lobby. Check the Servers tab to chat.`,
          [
            { text: 'OK', onPress: () => router.push('/(tabs)/servers') },
          ]
        );
      } catch (error) {
        if (__DEV__) {
          console.error('[Discovery] Error updating profile:', error);
        }
        Alert.alert('Error', 'Failed to join server. Please try again.');
      }
    }
  };
  return (
    <View style={styles.bottomSheet}>
      <LinearGradient
        colors={['#1a1a1a', '#1a1a2e']}
        style={styles.sheetGradient}
      >
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#fff" />
        </TouchableOpacity>

        <Image
          source={{ uri: venue.imageUrl }}
          style={styles.venueImage}
        />

        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={styles.sheetContentContainer}
        >
          <View style={styles.venueHeader}>
            <View>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, venue.isOpen && styles.statusDotLive]} />
                <Text style={[styles.statusText, venue.isOpen && styles.statusTextLive]}>
                  {venue.isOpen ? 'OPEN NOW' : 'CLOSED'}
                </Text>
              </View>
            </View>
            {venue.isOpen && (
              <View style={[styles.vibeBadge, isLiveVibe && styles.vibeBadgeLive]}>
                <Text style={styles.vibeText}>{vibePercentage}%</Text>
                <Text style={styles.vibeLabel}>{isLiveVibe ? 'LIVE VIBE' : 'VIBE'}</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MapPin size={16} color="#ff0080" />
              <Text style={styles.infoText}>{venue.location.address}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <DollarSign size={18} color="#ff0080" />
              <Text style={styles.statText}>
                {dynamicPricing ? (
                  <>
                    <Text style={styles.strikethrough}>${venue.coverCharge ?? 0}</Text> ${dynamicPricing.currentPrice}
                  </>
                ) : venue.coverCharge ? (
                  `$${venue.coverCharge} cover`
                ) : (
                  'Free entry'
                )}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Users size={18} color="#ff0080" />
              <Text style={styles.statText}>
                {friendsAtVenue.length > 0
                  ? `${friendsAtVenue.length} ${friendsAtVenue.length === 1 ? 'friend here' : 'friends here'}`
                  : 'Be the first here'}
              </Text>
            </View>
          </View>

          {/* Dynamic Pricing Badge */}
          {dynamicPricing && (
            <View style={styles.pricingBadgeContainer}>
              <PricingBadge pricing={dynamicPricing} size="large" />
              <View style={styles.pricingDetails}>
                <Text style={styles.pricingDescription}>{dynamicPricing.description}</Text>
                <Text style={styles.pricingExpiry}>
                  Ends {new Date(dynamicPricing.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          )}

          {venue.genres && venue.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {venue.genres.map((genre, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Social Proof Section */}
          <SocialProofSection venueId={venue.id} />

          {friendsAtVenue.length > 0 && (
            <View style={styles.friendsSection}>
              <View style={styles.friendsSectionHeader}>
                <Users size={16} color="#ff0080" />
                <Text style={styles.friendsSectionTitle}>
                  {friendsAtVenue.length} {friendsAtVenue.length === 1 ? 'Friend' : 'Friends'} Here
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsScrollContent}
              >
                {friendsAtVenue.map((friend) => (
                  <View key={friend.userId} style={styles.friendAtVenueCard}>
                    <View style={[styles.friendAvatarRing, styles.friendAvatarRingActive]}>
                      <Image
                        source={{ uri: friend.avatarUrl }}
                        style={styles.friendAtVenueAvatar}
                      />
                    </View>
                    <Text style={styles.friendAtVenueName} numberOfLines={1}>
                      {friend.displayName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Group Purchases Section */}
          {groupPurchases.length > 0 && (
            <View style={styles.groupPurchasesSection}>
              <View style={styles.groupPurchasesSectionHeader}>
                <Users size={16} color="#00d4ff" />
                <Text style={styles.groupPurchasesSectionTitle}>
                  Group Purchase Opportunities ({groupPurchases.length})
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groupPurchasesScrollContent}
              >
                {groupPurchases.map((gp) => (
                  <View key={gp.id} style={styles.groupPurchaseScrollCard}>
                    <GroupPurchaseCard
                      groupPurchase={gp}
                      onJoin={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onJoinGroupPurchase(gp.id);
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.createGroupPurchaseButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onCreateGroupPurchase();
            }}
          >
            <Users size={18} color="#00d4ff" />
            <Text style={styles.createGroupPurchaseButtonText}>Create Group Purchase</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.joinButton} onPress={handleJoinLobby}>
            <Text style={styles.joinButtonText}>
              {profile.badges.some(b => b.venueId === venue.id) ? 'Go to Server' : 'Join Public Lobby'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewDetails();
            }}
          >
            <Info size={18} color="#ff0080" />
            <Text style={styles.detailsButtonText}>View Full Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.directionsButton} onPress={handleGetDirections}>
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

interface SocialProofSectionProps {
  venueId: string;
}

function SocialProofSection({ venueId }: SocialProofSectionProps) {
  const { getVenueSocialProofData } = useSocial();
  const socialProof = getVenueSocialProofData(venueId);

  if (!socialProof) return null;

  const hypeFactorIcons: Record<string, string> = {
    FRIENDS_HERE: '👥',
    TRENDING_UP: '📈',
    EVENT_TONIGHT: '🎉',
    CHALLENGE_ACTIVE: '🏆',
    HOT_SPOT: '🔥',
  };

  const getTrendingColor = (score: number) => {
    if (score >= 90) return '#ff0080';
    if (score >= 70) return '#00d4ff';
    if (score >= 50) return '#a855f7';
    return '#ffa64d';
  };

  const trendingColor = getTrendingColor(socialProof.trendingScore);

  return (
    <View style={styles.socialProofSection}>
      {/* Trending Score */}
      <View style={styles.socialProofHeader}>
        <View style={[styles.trendingBadge, { backgroundColor: `${trendingColor}20` }]}>
          <Text style={[styles.trendingScore, { color: trendingColor }]}>
            {socialProof.trendingScore}
          </Text>
          <Text style={[styles.trendingLabel, { color: trendingColor }]}>
            TRENDING
          </Text>
        </View>
        {socialProof.popularityRank && socialProof.popularityRank <= 3 && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankEmoji}>
              {socialProof.popularityRank === 1 ? '🥇' : socialProof.popularityRank === 2 ? '🥈' : '🥉'}
            </Text>
            <Text style={styles.rankText}>#{socialProof.popularityRank} in area</Text>
          </View>
        )}
      </View>

      {/* Check-ins */}
      <View style={styles.checkInsRow}>
        <Text style={styles.checkInsText}>
          <Text style={styles.checkInsValue}>{socialProof.recentCheckIns}</Text> check-ins in last hour
        </Text>
      </View>

      {/* Hype Factors */}
      {socialProof.hypeFactors.length > 0 && (
        <View style={styles.hypeFactors}>
          {socialProof.hypeFactors.map((factor, index) => (
            <View key={index} style={styles.hypeFactorChip}>
              <Text style={styles.hypeFactorIcon}>
                {hypeFactorIcons[factor.type] || '✨'}
              </Text>
              <Text style={styles.hypeFactorText}>{factor.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerGradient: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ff0080',
    fontWeight: '600' as const,
  },
  markerWrapper: {
    alignItems: 'center' as const,
    gap: 4,
  },
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#666',
  },
  markerLive: {
    borderColor: '#ff0080',
  },
  markerText: {
    fontSize: 20,
  },
  pulseDot: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#a855f7',
  },
  markerPricingBadge: {
    marginTop: 2,
  },
  bottomSheet: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    // Definite height (not maxHeight): the inner ScrollView uses flex:1, which
    // only produces a bounded, scrollable height when its parent chain has a
    // definite height. With maxHeight alone the sheet sized to content, so the
    // ScrollView grew to full content height and never scrolled — the action
    // buttons at the bottom were clipped off-screen by overflow:hidden.
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetGradient: {
    padding: 20,
    paddingBottom: 40,
    flex: 1,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  venueImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  venueHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  venueName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  statusDotLive: {
    backgroundColor: '#a855f7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
  },
  statusTextLive: {
    color: '#a855f7',
  },
  vibeBadge: {
    backgroundColor: 'rgba(0, 255, 204, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  vibeBadgeLive: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  vibeText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  vibeLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  infoRow: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  genresContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  genreTag: {
    backgroundColor: 'rgba(102, 102, 128, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  joinButton: {
    backgroundColor: '#ff0080',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center' as const,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  detailsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    borderWidth: 1,
    borderColor: '#ff0080',
    marginBottom: 12,
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  directionsButton: {
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: '#ff0080',
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600' as const,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  retryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#ff0080',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  mapControls: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlButtonActive: {
    backgroundColor: '#ff0080',
  },
  recenterButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff0080',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  friendCountBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#ff0080',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#000000',
  },
  friendCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#000000',
  },
  friendAvatarContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  friendAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  friendAvatarRingActive: {
    backgroundColor: '#a855f7',
  },
  friendAvatarRingVenue: {
    backgroundColor: '#a855f7',
  },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#000000',
  },
  friendDrawerToggle: {
    position: 'absolute' as const,
    bottom: 24,
    left: 24,
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.3)',
  },
  friendDrawerToggleContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  friendDrawerToggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  friendDrawer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  friendDrawerGradient: {
    padding: 20,
    paddingBottom: 40,
  },
  friendDrawerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  friendDrawerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  friendDrawerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  friendDrawerScroll: {
    maxHeight: 400,
  },
  venueGroup: {
    marginBottom: 20,
  },
  venueGroupHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  venueGroupName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ff0080',
    flex: 1,
  },
  venueGroupCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
  },
  friendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
  },
  friendItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  friendItemInfo: {
    flex: 1,
  },
  friendItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  friendItemStatus: {
    fontSize: 12,
    color: '#999',
  },
  friendsSection: {
    backgroundColor: 'rgba(0, 255, 204, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.1)',
  },
  friendsSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  friendsSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  friendsScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  friendAtVenueCard: {
    alignItems: 'center' as const,
    gap: 8,
    width: 64,
  },
  friendAtVenueAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  friendAtVenueName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center' as const,
  },
  groupPurchasesSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  groupPurchasesSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  groupPurchasesSectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  groupPurchasesScrollContent: {
    gap: 12,
    paddingHorizontal: 2,
  },
  groupPurchaseScrollCard: {
    width: 280,
  },
  createGroupPurchaseButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d4ff',
    marginBottom: 12,
  },
  createGroupPurchaseButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#00d4ff',
  },
  // Social Proof Styles
  socialProofSection: {
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.1)',
  },
  socialProofHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  trendingBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  trendingScore: {
    fontSize: 20,
    fontWeight: '800' as const,
  },
  trendingLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  rankBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffd700',
  },
  checkInsRow: {
    marginBottom: 12,
  },
  checkInsText: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500' as const,
  },
  checkInsValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
  },
  hypeFactors: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  hypeFactorChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  hypeFactorIcon: {
    fontSize: 14,
  },
  hypeFactorText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#00d4ff',
  },
  // Dynamic Pricing Styles
  pricingBadgeContainer: {
    marginBottom: 16,
    gap: 12,
  },
  pricingDetails: {
    paddingLeft: 12,
  },
  pricingDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  pricingExpiry: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  strikethrough: {
    textDecorationLine: 'line-through' as const,
    color: '#999',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  listContent: {
    paddingTop: 130,
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 12,
  },
  listCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  listCardGradient: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  listCardImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#26263a',
  },
  listCardBody: {
    flex: 1,
    gap: 4,
  },
  listCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listCardName: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listOpenBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  listOpenBadgeText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
  },
  listCardMeta: {
    color: '#999',
    fontSize: 13,
  },
  listCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listRatingText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  listPriceLevel: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
  },
  listFriendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listFriendBadgeText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
  },
  listEmpty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  listEmptyText: {
    color: '#666',
    fontSize: 15,
  },
});
