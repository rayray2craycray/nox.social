import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Lock, X, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ContactSyncModalProps {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

/**
 * Contact Sync Permission Modal
 * Explains contact sync benefits and privacy measures
 * Allows users to skip if they prefer not to share contacts
 * Required for App Store approval (transparent permission requests)
 */
export default function ContactSyncModal({
  visible,
  onAllow,
  onSkip,
}: ContactSyncModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAllow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);
    await onAllow();
    setIsProcessing(false);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#15151f']}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleSkip}
              disabled={isProcessing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="#666680" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Users size={48} color="#ff0080" />
            </View>

            <Text style={styles.title}>Find Friends on Nox</Text>

            <Text style={styles.description}>
              Connect with friends who are already on Nox by syncing your contacts. This is completely optional!
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Users size={18} color="#4ade80" />
                </View>
                <Text style={styles.benefitText}>
                  Instantly find friends who use Nox
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Shield size={18} color="#4ade80" />
                </View>
                <Text style={styles.benefitText}>
                  Get personalized friend suggestions
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Lock size={18} color="#4ade80" />
                </View>
                <Text style={styles.benefitText}>
                  Your contacts are never shared publicly
                </Text>
              </View>
            </View>

            <View style={styles.privacyBox}>
              <Lock size={16} color="#8b5cf6" />
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
                <Text style={styles.privacyText}>
                  We hash phone numbers using SHA-256 encryption before sending them to our servers.
                  Your contacts are never stored in plain text and are only used to find mutual connections.
                </Text>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={isProcessing}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.allowButton,
                  isProcessing && styles.allowButtonDisabled,
                ]}
                onPress={handleAllow}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isProcessing ? ['#666680', '#666680'] : ['#ff0080', '#ff6b9d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.allowGradient}
                >
                  <Text style={styles.allowButtonText}>
                    {isProcessing ? 'Syncing...' : 'Allow Access'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
              You can change this anytime in Settings
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 128, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  privacyBox: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#a78bfa',
    marginBottom: 6,
  },
  privacyText: {
    fontSize: 12,
    color: '#c4b5fd',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row' as const,
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  allowButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  allowButtonDisabled: {
    opacity: 0.5,
  },
  allowGradient: {
    paddingVertical: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  allowButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  disclaimer: {
    fontSize: 11,
    color: '#666680',
    textAlign: 'center' as const,
  },
});
