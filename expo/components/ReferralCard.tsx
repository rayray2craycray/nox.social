import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Users, DollarSign, Share2, Copy } from 'lucide-react-native';
import { UserReferralStats } from '@/types';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

interface ReferralCardProps {
  referralStats: UserReferralStats;
  onViewRewards?: () => void;
}

export function ReferralCard({ referralStats, onViewRewards }: ReferralCardProps) {
  const handleCopyCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(referralStats.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Get $10 off Nox with my referral code: ${referralStats.referralCode}\n\nDownload the app: https://nox.social/download`,
        title: 'Join me on Nox!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const conversionRate = referralStats.totalReferrals > 0
    ? (referralStats.successfulReferrals / referralStats.totalReferrals) * 100
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ff0080', '#a855f7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Gift size={24} color="#000" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Your Referral Code</Text>
            <Text style={styles.headerSubtitle}>Share & earn rewards</Text>
          </View>
        </View>

        {/* Referral Code */}
        <View style={styles.codeContainer}>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralStats.referralCode}</Text>
          </View>
          <View style={styles.codeActions}>
            <TouchableOpacity
              style={styles.codeActionButton}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Copy size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.codeActionButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Users size={18} color="#000" />
            <View>
              <Text style={styles.statValue}>{referralStats.successfulReferrals}</Text>
              <Text style={styles.statLabel}>Friends Joined</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <DollarSign size={18} color="#000" />
            <View>
              <Text style={styles.statValue}>${referralStats.totalRewardsEarned}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Gift size={18} color="#000" />
            <View>
              <Text style={styles.statValue}>{referralStats.pendingRewards.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* View Rewards Button */}
        {referralStats.pendingRewards.length > 0 && onViewRewards && (
          <TouchableOpacity
            style={styles.viewRewardsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onViewRewards();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.viewRewardsText}>View Rewards</Text>
          </TouchableOpacity>
        )}

        {/* Conversion Rate */}
        {referralStats.totalReferrals > 0 && (
          <View style={styles.conversionContainer}>
            <Text style={styles.conversionText}>
              {conversionRate.toFixed(0)}% conversion rate
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  codeBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  codeActions: {
    gap: 8,
  },
  codeActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '600',
  },
  viewRewardsButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewRewardsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  conversionContainer: {
    alignItems: 'center',
  },
  conversionText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '600',
  },
});
