/**
 * Blocked Users Screen
 * Shows list of blocked users and allows unblocking
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ShieldOff, Unlock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useModeration } from '@/contexts/ModerationContext';

export default function BlockedUsersScreen() {
  const { blockedUsers, isLoadingBlockedUsers, unblockUser } = useModeration();

  const handleUnblock = (userId: string, username: string) => {
    Alert.alert(
      'Unblock User',
      `Unblock @${username}? They will be able to see your content and interact with you again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await unblockUser(userId);
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Blocked Users',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0a0a0f',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />

      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0f', '#15151f']}
          style={styles.gradient}
        >
          {isLoadingBlockedUsers ? (
            <View style={styles.emptyState}>
              <ShieldOff size={48} color="#666680" />
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <ShieldOff size={48} color="#666680" />
              <Text style={styles.emptyText}>No blocked users</Text>
              <Text style={styles.emptySubtext}>
                Users you block will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {blockedUsers.map((block) => (
                <View key={block.id} style={styles.userCard}>
                  <LinearGradient
                    colors={['#1a1a2e', '#15151f']}
                    style={styles.userCardGradient}
                  >
                    <Image
                      source={{
                        uri:
                          block.blockedUserId.profilePicture ||
                          'https://i.pravatar.cc/150?u=' + block.blockedUserId._id,
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.displayName}>
                        {block.blockedUserId.displayName}
                      </Text>
                      <Text style={styles.username}>
                        @{block.blockedUserId.username}
                      </Text>
                      <Text style={styles.blockedDate}>
                        Blocked {new Date(block.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.unblockButton}
                      onPress={() =>
                        handleUnblock(
                          block.blockedUserId._id,
                          block.blockedUserId.username
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Unlock size={18} color="#4ade80" />
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    minHeight: '100%',
    paddingTop: 20,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
  },
  userList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  userCardGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  blockedDate: {
    fontSize: 12,
    color: '#666680',
  },
  unblockButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#4ade80',
  },
});
