import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModeration } from '@/contexts/ModerationContext';
import { useAuth } from '@/contexts/AuthContext';

interface BlockButtonProps {
  userId: string;
  userName?: string;
  isBlocked?: boolean;
  style?: any;
  variant?: 'text' | 'icon';
}

export default function BlockButton({
  userId,
  userName,
  isBlocked = false,
  style,
  variant = 'text',
}: BlockButtonProps) {
  const { blockUser, unblockUser, isBlocking, isUnblocking } = useModeration();
  const { isAuthenticated, userId: currentUserId } = useAuth();

  // Don't show block button for own profile
  if (userId === currentUserId) {
    return null;
  }

  const isLoading = isBlocking || isUnblocking;

  const handlePress = () => {
    if (!isAuthenticated) {
      return;
    }

    if (isBlocked) {
      unblockUser(userId);
    } else {
      blockUser(userId, userName);
    }
  };

  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isLoading}
        style={[styles.iconButton, style]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ff0080" />
        ) : (
          <Ionicons
            name={isBlocked ? 'person-add-outline' : 'person-remove-outline'}
            size={24}
            color={isBlocked ? '#4CAF50' : '#ff3b30'}
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={[
        styles.button,
        isBlocked ? styles.unblockButton : styles.blockButton,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.buttonText}>
          {isBlocked ? 'Unblock' : 'Block User'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  blockButton: {
    backgroundColor: '#ff3b30',
  },
  unblockButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
});
