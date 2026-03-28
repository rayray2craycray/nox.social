import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Clock, DollarSign, MapPin } from 'lucide-react-native';
import { GroupPurchase } from '@/types';
import * as Haptics from 'expo-haptics';

interface GroupPurchaseCardProps {
  groupPurchase: GroupPurchase;
  onPress?: () => void;
  onJoin?: () => void;
}

export function GroupPurchaseCard({ groupPurchase, onPress, onJoin }: GroupPurchaseCardProps) {
  const spotsLeft = groupPurchase.maxParticipants - groupPurchase.currentParticipants.length;
  const isExpired = new Date(groupPurchase.expiresAt) < new Date();
  const isFull = groupPurchase.status === 'FULL';

  const getStatusColor = () => {
    if (isExpired || groupPurchase.status === 'CANCELLED') return '#666';
    if (isFull || groupPurchase.status === 'COMPLETED') return '#00d4ff';
    return '#ff0080';
  };

  const getStatusText = () => {
    if (isExpired) return 'EXPIRED';
    if (groupPurchase.status === 'CANCELLED') return 'CANCELLED';
    if (isFull) return 'FULL';
    if (groupPurchase.status === 'COMPLETED') return 'COMPLETED';
    return `${spotsLeft} SPOT${spotsLeft === 1 ? '' : 'S'} LEFT`;
  };

  const getTicketTypeLabel = () => {
    switch (groupPurchase.ticketType) {
      case 'ENTRY':
        return 'Entry Tickets';
      case 'TABLE':
        return 'VIP Table';
      case 'BOTTLE_SERVICE':
        return 'Bottle Service';
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const handleJoin = () => {
    if (onJoin && !isFull && !isExpired) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onJoin();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <LinearGradient
        colors={['#1a1a2e', '#15151f']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{getTicketTypeLabel()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '30' }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {groupPurchase.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {groupPurchase.notes}
          </Text>
        )}

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Users size={16} color="#a855f7" />
            <Text style={styles.detailText}>
              {groupPurchase.currentParticipants.length}/{groupPurchase.maxParticipants} people
            </Text>
          </View>

          <View style={styles.detailRow}>
            <DollarSign size={16} color="#00d4ff" />
            <Text style={styles.detailText}>
              ${groupPurchase.perPersonAmount} per person
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Clock size={16} color="#ff0080" />
            <Text style={styles.detailText}>
              Expires {new Date(groupPurchase.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {onJoin && groupPurchase.status === 'OPEN' && !isExpired && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoin}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff0080', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>Join Group</Text>
              <DollarSign size={18} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notes: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
