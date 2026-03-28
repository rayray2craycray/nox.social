import React, { useState } from 'react';
import type { LinkedCard } from '@/types';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  CreditCard,
  Bell,
  Shield,
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  Trash2,
  Plus,
  X,
  Award,
  DollarSign,
  Clock,
  MapPin,
  Users,
  Eye,
  EyeOff,
  UserX,
  ArrowLeft,
} from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import { useSocial } from '@/contexts/SocialContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Transaction {
  id: string;
  venueId: string;
  venueName: string;
  amount: number;
  pointsEarned: number;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

export default function SettingsScreen() {
  const { profile, toggleIncognito, setUserRole, linkedCards, addLinkedCard, removeLinkedCard } = useAppState();
  const { locationSettings, updateLocationSettings, toggleGhostMode } = useSocial();
  const { signOut } = useAuth();
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      venueId: 'v1',
      venueName: 'The Nox Room',
      amount: 85.50,
      pointsEarned: 86,
      date: '2024-12-30T23:45:00Z',
      status: 'COMPLETED',
    },
    {
      id: '2',
      venueId: 'v2',
      venueName: 'Neon Pulse',
      amount: 120.00,
      pointsEarned: 120,
      date: '2024-12-28T22:30:00Z',
      status: 'COMPLETED',
    },
  ]);

  const [showBadges, setShowBadges] = useState(true);
  const [proximityAlerts, setProximityAlerts] = useState(true);
  const [levelUpPings, setLevelUpPings] = useState(true);
  const [performerDrops, setPerformerDrops] = useState(true);

  const [isAddCardModalVisible, setIsAddCardModalVisible] = useState(false);
  const [isTransactionHistoryVisible, setIsTransactionHistoryVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const handleAddCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cardNumber.length >= 4) {
      const newCard = {
        last4: cardNumber.slice(-4),
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        cardholderName: profile.displayName,
        isDefault: false,
      };
      addLinkedCard(newCard);
      setCardNumber('');
      setIsAddCardModalVisible(false);
    }
  };

  const handleRemoveCard = (cardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeLinkedCard(cardId);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // TODO: Call backend API to delete account
            // await apiClient.delete('/users/me');
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            signOut();
          },
        },
      ]
    );
  };

  const totalPoints = profile.totalSpend;
  const cardLinkProgress = linkedCards.length > 0 ? 100 : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: '#0a0a0f' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/profile');
              }}
              style={{ marginLeft: 16 }}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0a0a0f', '#15151f']} style={styles.gradient}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#ff0080', '#a855f7']}
                style={styles.avatarGradient}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile.displayName[0]}</Text>
                </View>
              </LinearGradient>
            </View>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            <View style={styles.cloutBadge}>
              <Award size={16} color="#ff0080" />
              <Text style={styles.cloutText}>{totalPoints} Clout Points</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Type</Text>
            <View style={styles.userTypeCard}>
              <Text style={styles.userTypeDescription}>
                Switch between different account types to access their features
              </Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    profile.role === 'PARTYGOER' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setUserRole('PARTYGOER');
                  }}
                >
                  <Users size={20} color={profile.role === 'PARTYGOER' ? '#0a0a0f' : '#fff'} />
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      profile.role === 'PARTYGOER' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Party-Goer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    profile.role === 'VENUE' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setUserRole('VENUE');
                  }}
                >
                  <MapPin size={20} color={profile.role === 'VENUE' ? '#0a0a0f' : '#fff'} />
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      profile.role === 'VENUE' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Venue
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    profile.role === 'TALENT' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setUserRole('TALENT');
                  }}
                >
                  <Award size={20} color={profile.role === 'TALENT' ? '#0a0a0f' : '#fff'} />
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      profile.role === 'TALENT' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Talent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {cardLinkProgress < 100 && (
            <View style={styles.progressCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.progressGradient}
              >
                <View style={styles.progressHeader}>
                  <CreditCard size={20} color="#ff0080" />
                  <Text style={styles.progressTitle}>Complete Your Setup</Text>
                </View>
                <Text style={styles.progressSubtitle}>
                  Link your card to unlock VIP status and automatic rewards
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={['#ff0080', '#00d4ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${cardLinkProgress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>Step 1/2</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location Sharing</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  {locationSettings.ghostMode ? (
                    <EyeOff size={22} color="#ff0080" />
                  ) : (
                    <Eye size={22} color="#666" />
                  )}
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Ghost Mode</Text>
                    <Text style={styles.settingSubtitle}>
                      {locationSettings.ghostMode
                        ? 'Hidden from friends\' map'
                        : 'Visible to friends'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={locationSettings.ghostMode}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleGhostMode();
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={locationSettings.ghostMode ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <MapPin size={22} color="#ff0080" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Location Precision</Text>
                    <Text style={styles.settingSubtitle}>
                      {locationSettings.precision === 'EXACT' 
                        ? 'Exact location shared'
                        : locationSettings.precision === 'VENUE_ONLY'
                        ? 'Venue name only'
                        : 'Hidden from all'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.precisionButtons}>
              <TouchableOpacity
                style={[
                  styles.precisionButton,
                  locationSettings.precision === 'EXACT' && styles.precisionButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateLocationSettings({ precision: 'EXACT' });
                }}
              >
                <Text
                  style={[
                    styles.precisionButtonText,
                    locationSettings.precision === 'EXACT' && styles.precisionButtonTextActive,
                  ]}
                >
                  Exact
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.precisionButton,
                  locationSettings.precision === 'VENUE_ONLY' && styles.precisionButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateLocationSettings({ precision: 'VENUE_ONLY' });
                }}
              >
                <Text
                  style={[
                    styles.precisionButtonText,
                    locationSettings.precision === 'VENUE_ONLY' && styles.precisionButtonTextActive,
                  ]}
                >
                  Venue Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.precisionButton,
                  locationSettings.precision === 'HIDDEN' && styles.precisionButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateLocationSettings({ precision: 'HIDDEN' });
                }}
              >
                <Text
                  style={[
                    styles.precisionButtonText,
                    locationSettings.precision === 'HIDDEN' && styles.precisionButtonTextActive,
                  ]}
                >
                  Hidden
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <Users size={22} color={locationSettings.onlyShowToMutual ? '#ff0080' : '#666'} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Mutual Friends Only</Text>
                    <Text style={styles.settingSubtitle}>
                      Only show location to friends who follow you back
                    </Text>
                  </View>
                </View>
                <Switch
                  value={locationSettings.onlyShowToMutual}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateLocationSettings({ onlyShowToMutual: !locationSettings.onlyShowToMutual });
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={locationSettings.onlyShowToMutual ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <Clock size={22} color={locationSettings.autoExpireEnabled ? '#ff0080' : '#666'} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Auto-Expire Location</Text>
                    <Text style={styles.settingSubtitle}>
                      Automatically hide location at {locationSettings.autoExpireTime}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={locationSettings.autoExpireEnabled}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    updateLocationSettings({ autoExpireEnabled: !locationSettings.autoExpireEnabled });
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={locationSettings.autoExpireEnabled ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  {profile.isIncognito ? (
                    <EyeOff size={22} color="#ff0080" />
                  ) : (
                    <Eye size={22} color="#666" />
                  )}
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Server Incognito</Text>
                    <Text style={styles.settingSubtitle}>
                      {profile.isIncognito
                        ? 'You\'re invisible in servers'
                        : 'Everyone can see you'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={profile.isIncognito}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    toggleIncognito();
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={profile.isIncognito ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <Award size={22} color={showBadges ? '#ff0080' : '#666'} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Show My Badges</Text>
                    <Text style={styles.settingSubtitle}>
                      Display your &ldquo;Regular&rdquo; status publicly
                    </Text>
                  </View>
                </View>
                <Switch
                  value={showBadges}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowBadges(!showBadges);
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={showBadges ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/blocked-users');
              }}
            >
              <UserX size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Blocked Users</Text>
                <Text style={styles.settingSubtitle}>Manage blocked accounts</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet & POS</Text>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsAddCardModalVisible(true);
              }}
            >
              <CreditCard size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Linked Cards</Text>
                <Text style={styles.settingSubtitle}>
                  {linkedCards.length} card{linkedCards.length !== 1 ? 's' : ''} linked
                </Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            {linkedCards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <LinearGradient
                  colors={['#1a1a2e', '#15151f']}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardLeft}>
                    <CreditCard size={20} color="#ff0080" />
                    <View>
                      <Text style={styles.cardBrand}>
                        {card.brand} •••• {card.last4}
                      </Text>
                      <Text style={styles.cardHolder}>{card.cardholderName}</Text>
                      {card.isDefault && (
                        <Text style={styles.cardDefault}>Default</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveCard(card.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color="#ff4444" />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))}

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsTransactionHistoryVisible(true);
              }}
            >
              <DollarSign size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Transaction History</Text>
                <Text style={styles.settingSubtitle}>
                  View bar spends and points earned
                </Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Loyalty Reset',
                  'Contact venue management directly to reset your loyalty status or opt-out of tracking. This feature requires venue approval.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Clock size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Loyalty Reset</Text>
                <Text style={styles.settingSubtitle}>
                  Opt-out of tracking for specific venues
                </Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <MapPin size={22} color={proximityAlerts ? '#ff0080' : '#666'} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Proximity Alerts</Text>
                    <Text style={styles.settingSubtitle}>
                      Notify when friends are nearby
                    </Text>
                  </View>
                </View>
                <Switch
                  value={proximityAlerts}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setProximityAlerts(!proximityAlerts);
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={proximityAlerts ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <Award size={22} color={levelUpPings ? '#ff0080' : '#666'} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Level Up Pings</Text>
                    <Text style={styles.settingSubtitle}>
                      Alert when you unlock new server tiers
                    </Text>
                  </View>
                </View>
                <Switch
                  value={levelUpPings}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setLevelUpPings(!levelUpPings);
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={levelUpPings ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.settingGradient}
              >
                <View style={styles.settingLeft}>
                  <Users size={22} color={performerDrops ? '#ff0080' : '#666'} />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Performer Drops</Text>
                    <Text style={styles.settingSubtitle}>
                      Notify when followed DJs post promos
                    </Text>
                  </View>
                </View>
                <Switch
                  value={performerDrops}
                  onValueChange={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setPerformerDrops(!performerDrops);
                  }}
                  trackColor={{ false: '#1a1a2e', true: '#ff0080' }}
                  thumbColor={performerDrops ? '#0a0a0f' : '#666'}
                />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Notification Settings',
                  'Notification preferences are currently managed in your device settings. Would you like to open system settings?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                  ]
                );
              }}
            >
              <Bell size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Notification Settings</Text>
                <Text style={styles.settingSubtitle}>Manage all notifications</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Language & Region',
                  'Currently set to English (US). Additional languages will be available in a future update.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Globe size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Language & Region</Text>
                <Text style={styles.settingSubtitle}>English (US)</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support & Legal</Text>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Report a Bug',
                  'Please email support@vibelink.com with details about the issue you encountered. Include screenshots if possible.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Email', onPress: () => Linking.openURL('mailto:support@vibelink.com?subject=Bug Report') }
                  ]
                );
              }}
            >
              <HelpCircle size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Report a Bug</Text>
                <Text style={styles.settingSubtitle}>Help us improve VibeLink</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/community-guidelines');
              }}
            >
              <Shield size={22} color="#4ade80" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>Community Guidelines</Text>
                <Text style={styles.settingSubtitle}>Our community standards and policies</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Legal Information',
                  'View our Terms of Service, Privacy Policy, and UGC Guidelines on our website.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Website', onPress: () => Linking.openURL('https://vibelink.com/legal') }
                  ]
                );
              }}
            >
              <FileText size={22} color="#fff" />
              <View style={styles.settingButtonInfo}>
                <Text style={styles.settingTitle}>UGC Policy & Terms</Text>
                <Text style={styles.settingSubtitle}>Legal information</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleLogout}
            >
              <LogOut size={22} color="#ff9966" />
              <View style={styles.settingButtonInfo}>
                <Text style={[styles.settingTitle, styles.logoutText]}>Log Out</Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={handleDeleteAccount}
            >
              <Trash2 size={22} color="#ff4444" />
              <View style={styles.settingButtonInfo}>
                <Text style={[styles.settingTitle, styles.deleteText]}>
                  Delete Account
                </Text>
              </View>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>VibeLink v1.0.0</Text>
        </LinearGradient>
      </ScrollView>

      <Modal
        visible={isAddCardModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddCardModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Payment Card</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsAddCardModalVisible(false);
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoBox}>
                <Shield size={20} color="#ff0080" />
                <Text style={styles.infoText}>
                  Your card is tokenized via Stripe. We never store your full card
                  number.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  maxLength={19}
                />
              </View>

              <View style={styles.benefitsList}>
                <Text style={styles.benefitsTitle}>Benefits of Linking:</Text>
                <View style={styles.benefitItem}>
                  <Award size={16} color="#ff0080" />
                  <Text style={styles.benefitText}>
                    Automatic server unlocks when you hit spend thresholds
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <DollarSign size={16} color="#ff0080" />
                  <Text style={styles.benefitText}>
                    Real-time loyalty points and tier upgrades
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Bell size={16} color="#ff0080" />
                  <Text style={styles.benefitText}>
                    Instant notifications when you level up
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.addCardButton} onPress={handleAddCard}>
                <LinearGradient
                  colors={['#ff0080', '#00d4ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addCardGradient}
                >
                  <Plus size={20} color="#0a0a0f" />
                  <Text style={styles.addCardText}>Link Card</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTransactionHistoryVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsTransactionHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction History</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsTransactionHistoryVisible(false);
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <LinearGradient
                    colors={['#1a1a2e', '#15151f']}
                    style={styles.transactionGradient}
                  >
                    <View style={styles.transactionLeft}>
                      <View style={styles.transactionIcon}>
                        <DollarSign size={20} color="#ff0080" />
                      </View>
                      <View>
                        <Text style={styles.transactionVenue}>
                          {transaction.venueName}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={styles.transactionAmount}>
                        ${transaction.amount.toFixed(2)}
                      </Text>
                      <View style={styles.pointsBadge}>
                        <Award size={12} color="#ff0080" />
                        <Text style={styles.pointsText}>
                          +{transaction.pointsEarned}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center' as const,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarGradient: {
    borderRadius: 40,
    padding: 3,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#0a0a0f',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  cloutBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cloutText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  progressCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressGradient: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  progressSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#0a0a0f',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  settingCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  settingGradient: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  settingButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
  },
  settingButtonInfo: {
    flex: 1,
  },
  cardItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    marginLeft: 12,
  },
  cardGradient: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 12,
  },
  cardLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cardHolder: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  cardDefault: {
    fontSize: 11,
    color: '#ff0080',
    marginTop: 2,
  },
  logoutText: {
    color: '#ff9966',
  },
  deleteText: {
    color: '#ff4444',
  },
  version: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center' as const,
    marginTop: 20,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#15151f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
  infoBox: {
    flexDirection: 'row' as const,
    gap: 12,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#ff0080',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  benefitsList: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    marginBottom: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#ccc',
    lineHeight: 18,
  },
  addCardButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  addCardGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 18,
    gap: 8,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  transactionItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  transactionGradient: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  transactionLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  transactionVenue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end' as const,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  pointsBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  userTypeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
  },
  userTypeDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    lineHeight: 18,
  },
  userTypeButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    backgroundColor: '#0a0a0f',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  userTypeButtonActive: {
    backgroundColor: '#ff0080',
    borderColor: '#ff0080',
  },
  userTypeButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  userTypeButtonTextActive: {
    color: '#0a0a0f',
  },
  precisionButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  precisionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0a0a0f',
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  precisionButtonActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderColor: '#ff0080',
  },
  precisionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
  },
  precisionButtonTextActive: {
    color: '#ff0080',
  },
});
