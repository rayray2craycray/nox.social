/**
 * User Action Menu
 * Provides report and block actions for user profiles and content
 * Shows a bottom sheet with options to report or block a user
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag, ShieldOff, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import ReportContentModal from './modals/ReportContentModal';
import BlockUserModal from './modals/BlockUserModal';
import { useModeration } from '@/contexts/ModerationContext';

interface UserActionMenuProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  contentId?: string;
  contentType?: 'video' | 'comment';
}

/**
 * User Action Menu Component
 * Shows report and block options for users and their content
 */
export default function UserActionMenu({
  visible,
  onClose,
  userId,
  username,
  contentId,
  contentType,
}: UserActionMenuProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const { submitReport, blockUser } = useModeration();

  const handleReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setShowReportModal(true);
  };

  const handleBlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setShowBlockModal(true);
  };

  const handleReportSubmit = async (report: any) => {
    await submitReport(report);
    setShowReportModal(false);
  };

  const handleBlockConfirm = async (blockUserId: string) => {
    await blockUser(blockUserId);
    setShowBlockModal(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.container}>
              <LinearGradient
                colors={['#1a1a2e', '#15151f']}
                style={styles.gradient}
              >
                <View style={styles.header}>
                  <Text style={styles.title}>Actions</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={24} color="#666680" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleReport}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionIcon}>
                      <Flag size={22} color="#ffa64d" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>
                        {contentId ? `Report ${contentType}` : 'Report User'}
                      </Text>
                      <Text style={styles.actionDescription}>
                        {contentId
                          ? `Report this ${contentType} for violating guidelines`
                          : 'Report this user for inappropriate behavior'
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleBlock}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionIcon}>
                      <ShieldOff size={22} color="#ff6b6b" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Block @{username}</Text>
                      <Text style={styles.actionDescription}>
                        Stop seeing content from this user
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ReportContentModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType={contentId ? contentType! : 'user'}
        contentId={contentId || userId}
        reportedUserId={userId}
        onReportSubmit={handleReportSubmit}
      />

      <BlockUserModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        userId={userId}
        username={username}
        onBlockConfirm={handleBlockConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end' as const,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 8,
  },
});
