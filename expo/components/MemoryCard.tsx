import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Memory } from '@/types';
import { MapPin, Camera, Video, Award, Calendar, Users, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface MemoryCardProps {
  memory: Memory;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const MemoryCardComponent = ({ memory, onPress, size = 'medium' }: MemoryCardProps) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };
  const getMemoryIcon = () => {
    const iconSize = size === 'small' ? 16 : 20;
    const iconMap = {
      'CHECK_IN': MapPin,
      'VIDEO': Video,
      'PHOTO': Camera,
      'MILESTONE': Award,
      'EVENT': Calendar,
    };
    const IconComponent = iconMap[memory.type] || MapPin;
    return <IconComponent size={iconSize} color="#ff0080" />;
  };

  const getMemoryTypeLabel = () => {
    return {
      'CHECK_IN': 'Check-in',
      'VIDEO': 'Video',
      'PHOTO': 'Photo',
      'MILESTONE': 'Milestone',
      'EVENT': 'Event',
    }[memory.type] || 'Memory';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Small card for grid view
  if (size === 'small') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.smallCard}>
        {memory.content.imageUrl || memory.content.videoUrl ? (
          <Image
            source={{ uri: memory.content.imageUrl || memory.content.videoUrl }}
            style={styles.smallImage}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.smallImagePlaceholder}
          >
            {getMemoryIcon()}
          </LinearGradient>
        )}
        {memory.isPrivate && (
          <View style={styles.privateIconSmall}>
            <Lock size={12} color="#fff" />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.smallGradient}
        >
          <Text style={styles.smallVenueName} numberOfLines={1}>
            {memory.venueName}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Medium/Large card for list view
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={size === 'large' ? styles.largeCard : styles.mediumCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            {getMemoryIcon()}
            <Text style={styles.typeLabel}>{getMemoryTypeLabel()}</Text>
          </View>
          {memory.isPrivate && (
            <View style={styles.privateTag}>
              <Lock size={14} color="#666" />
              <Text style={styles.privateText}>Private</Text>
            </View>
          )}
        </View>

        {(memory.content.imageUrl || memory.content.videoUrl) && (
          <Image
            source={{ uri: memory.content.imageUrl || memory.content.videoUrl }}
            style={size === 'large' ? styles.largeImage : styles.mediumImage}
            contentFit="cover"
          />
        )}

        <View style={styles.cardContent}>
          <View style={styles.venueInfo}>
            <MapPin size={16} color="#ff0080" />
            <Text style={styles.venueName}>{memory.venueName}</Text>
          </View>

          {memory.content.caption && (
            <Text style={styles.caption} numberOfLines={size === 'large' ? 3 : 2}>
              {memory.content.caption}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(memory.date)}</Text>
            {memory.content.friendIds && memory.content.friendIds.length > 0 && (
              <View style={styles.friendsTag}>
                <Users size={12} color="#999" />
                <Text style={styles.friendsCount}>
                  {memory.content.friendIds.length} friend{memory.content.friendIds.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export const MemoryCard = React.memo(MemoryCardComponent);

const styles = StyleSheet.create({
  smallCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  smallImage: {
    width: '100%',
    height: '100%',
  },
  smallImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  smallVenueName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  privateIconSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediumCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  largeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff0080',
  },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  privateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  mediumImage: {
    width: '100%',
    height: 180,
  },
  largeImage: {
    width: '100%',
    height: 240,
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  caption: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  friendsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendsCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
});
