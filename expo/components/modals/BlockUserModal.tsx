import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldOff, X, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  onBlockConfirm: (userId: string) => void;
}

/**
 * Block User Modal
 * Allows users to block other users to prevent interactions
 * Required for App Store approval (user safety and content control)
 */
export default function BlockUserModal({
  visible,
  onClose,
  userId,
  username,
  onBlockConfirm,
}: BlockUserModalProps) {
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsBlocking(true);

    try {
      await onBlockConfirm(userId);

      Alert.alert(
        'User Blocked',
        `You have blocked @${username}. You will no longer see their content or receive messages from them.`,
        [
          {
            text: 'OK',
            onPress: onClose,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleClose = () => {
    if (!isBlocking) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#15151f']}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isBlocking}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="#666680" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <ShieldOff size={48} color="#ff6b6b" />
            </View>

            <Text style={styles.title}>Block @{username}?</Text>

            <Text style={styles.description}>
              Blocking this user will prevent them from:
            </Text>

            <View style={styles.effectsList}>
              <View style={styles.effectItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.effectText}>Viewing your profile or content</Text>
              </View>
              <View style={styles.effectItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.effectText}>Sending you messages</Text>
              </View>
              <View style={styles.effectItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.effectText}>Following you</Text>
              </View>
              <View style={styles.effectItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.effectText}>Commenting on your videos</Text>
              </View>
              <View style={styles.effectItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.effectText}>Tagging you in content</Text>
              </View>
            </View>

            <Text style={styles.note}>
              You will also stop seeing their content in your feed. They will not be notified that you blocked them.
            </Text>

            <View style={styles.warningBox}>
              <AlertTriangle size={16} color="#ffa64d" />
              <Text style={styles.warningText}>
                You can unblock this user anytime from your Blocked Users list in Settings.
              </Text>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isBlocking}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.blockButton,
                  isBlocking && styles.blockButtonDisabled,
                ]}
                onPress={handleBlock}
                disabled={isBlocking}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isBlocking ? ['#666680', '#666680'] : ['#ff6b6b', '#ff8787']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.blockGradient}
                >
                  <Text style={styles.blockButtonText}>
                    {isBlocking ? 'Blocking...' : 'Block User'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 28,
    alignItems: 'center' as const,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 10,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  effectsList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  effectItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff6b6b',
    marginRight: 12,
  },
  effectText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  note: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 19,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
    backgroundColor: 'rgba(255, 166, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 166, 77, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ffa64d',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  blockButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  blockButtonDisabled: {
    opacity: 0.5,
  },
  blockGradient: {
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  blockButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
