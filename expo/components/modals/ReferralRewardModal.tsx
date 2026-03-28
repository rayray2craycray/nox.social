import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Gift, Check, Clock } from 'lucide-react-native';
import { ReferralReward } from '@/types';
import * as Haptics from 'expo-haptics';

interface ReferralRewardModalProps {
  visible: boolean;
  rewards: ReferralReward[];
  onClose: () => void;
  onClaimReward: (rewardId: string) => void;
}

export function ReferralRewardModal({
  visible,
  rewards,
  onClose,
  onClaimReward,
}: ReferralRewardModalProps) {
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleClaim = (rewardId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClaimReward(rewardId);
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'DISCOUNT':
        return '💰';
      case 'SKIP_LINE':
        return '⚡';
      case 'FREE_DRINK':
        return '🍹';
      case 'VIP_ACCESS':
        return '👑';
      default:
        return '🎁';
    }
  };

  const getRewardColor = (rewardType: string) => {
    switch (rewardType) {
      case 'DISCOUNT':
        return '#00d4ff';
      case 'SKIP_LINE':
        return '#ffa64d';
      case 'FREE_DRINK':
        return '#a855f7';
      case 'VIP_ACCESS':
        return '#ff0080';
      default:
        return '#fff';
    }
  };

  const activeRewards = rewards.filter(
    (r) => !r.isUsed && new Date(r.expiresAt) > new Date()
  );
  const usedRewards = rewards.filter((r) => r.isUsed);
  const expiredRewards = rewards.filter(
    (r) => !r.isUsed && new Date(r.expiresAt) <= new Date()
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Gift size={28} color="#ff0080" />
                <Text style={styles.title}>Your Rewards</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Active Rewards */}
              {activeRewards.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Available ({activeRewards.length})</Text>
                  {activeRewards.map((reward) => (
                    <View key={reward.id} style={styles.rewardCard}>
                      <LinearGradient
                        colors={['#1a1a2e', '#15151f']}
                        style={styles.rewardGradient}
                      >
                        {/* Icon */}
                        <View
                          style={[
                            styles.rewardIcon,
                            { backgroundColor: getRewardColor(reward.reward.type) + '20' },
                          ]}
                        >
                          <Text style={styles.rewardEmoji}>
                            {getRewardIcon(reward.reward.type)}
                          </Text>
                        </View>

                        {/* Details */}
                        <View style={styles.rewardDetails}>
                          <Text style={styles.rewardDescription}>
                            {reward.reward.description}
                          </Text>
                          <View style={styles.rewardMeta}>
                            <Clock size={12} color="#999" />
                            <Text style={styles.rewardExpiry}>
                              Expires {new Date(reward.expiresAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={styles.rewardBadge}>
                            <Text style={styles.rewardType}>
                              {reward.type === 'REFERRER' ? 'For Referring' : 'Welcome Gift'}
                            </Text>
                          </View>
                        </View>

                        {/* Claim Button */}
                        <TouchableOpacity
                          style={styles.claimButton}
                          onPress={() => handleClaim(reward.id)}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={[getRewardColor(reward.reward.type), '#a855f7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.claimButtonGradient}
                          >
                            <Text style={styles.claimButtonText}>Claim</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </LinearGradient>
                    </View>
                  ))}
                </>
              )}

              {/* Used Rewards */}
              {usedRewards.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                    Used ({usedRewards.length})
                  </Text>
                  {usedRewards.map((reward) => (
                    <View key={reward.id} style={[styles.rewardCard, styles.rewardCardUsed]}>
                      <View style={styles.rewardGradient}>
                        <View style={[styles.rewardIcon, styles.rewardIconUsed]}>
                          <Check size={20} color="#666" />
                        </View>
                        <View style={styles.rewardDetails}>
                          <Text style={[styles.rewardDescription, styles.rewardDescriptionUsed]}>
                            {reward.reward.description}
                          </Text>
                          <Text style={styles.rewardUsedDate}>
                            Used {new Date(reward.usedAt!).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Expired Rewards */}
              {expiredRewards.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                    Expired ({expiredRewards.length})
                  </Text>
                  {expiredRewards.map((reward) => (
                    <View key={reward.id} style={[styles.rewardCard, styles.rewardCardExpired]}>
                      <View style={styles.rewardGradient}>
                        <View style={[styles.rewardIcon, styles.rewardIconUsed]}>
                          <Clock size={20} color="#666" />
                        </View>
                        <View style={styles.rewardDetails}>
                          <Text style={[styles.rewardDescription, styles.rewardDescriptionUsed]}>
                            {reward.reward.description}
                          </Text>
                          <Text style={styles.rewardUsedDate}>
                            Expired {new Date(reward.expiresAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Empty State */}
              {rewards.length === 0 && (
                <View style={styles.emptyState}>
                  <Gift size={48} color="#333" />
                  <Text style={styles.emptyStateTitle}>No Rewards Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Share your referral code to earn rewards!
                  </Text>
                </View>
              )}

              <View style={styles.bottomPadding} />
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  rewardCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  rewardCardUsed: {
    opacity: 0.5,
  },
  rewardCardExpired: {
    opacity: 0.4,
  },
  rewardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 16,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rewardIconUsed: {
    backgroundColor: '#15151f',
  },
  rewardEmoji: {
    fontSize: 28,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardDescription: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  rewardDescriptionUsed: {
    color: '#666',
  },
  rewardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  rewardExpiry: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  rewardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 0, 128, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff0080',
  },
  rewardUsedDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  claimButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
