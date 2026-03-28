import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Ban, AlertTriangle, Radio } from 'lucide-react-native';
import { ServerMember } from '@/types';
import * as Haptics from 'expo-haptics';
import { useAppState } from '@/contexts/AppStateContext';

export default function ServerCommandScreen() {
  const { profile, addBroadcastMessage } = useAppState();
  const [message, setMessage] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('#general');
  const [members, setMembers] = useState<ServerMember[]>([]);

  const channels = ['#general', '#line-watch', '#vip-lounge'];

  const sendBroadcast = () => {
    if (message.trim() && profile.managedVenues && profile.managedVenues.length > 0) {
      const venueId = profile.managedVenues[0]; // Use first managed venue
      addBroadcastMessage(selectedChannel, message, venueId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Broadcast Sent', `Your message has been sent to ${selectedChannel}`, [{ text: 'OK' }]);
      setMessage('');
    }
  };

  const warnMember = (userId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setMembers(prev =>
      prev.map(m => (m.userId === userId ? { ...m, status: 'WARNED' as const } : m))
    );
  };

  const banMember = (userId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setMembers(prev =>
      prev.map(m => (m.userId === userId ? { ...m, status: 'BANNED' as const } : m))
    );
  };

  const getTierColor = (tier: ServerMember['tier']) => {
    switch (tier) {
      case 'WHALE':
        return '#ffa64d';
      case 'PLATINUM':
        return '#00d4ff';
      case 'REGULAR':
        return '#a855f7';
      case 'GUEST':
        return '#999';
      default:
        return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Broadcast & Moderation</Text>
          <Text style={styles.headerDescription}>
            Send priority messages and manage your server community
          </Text>
        </View>

        <View style={styles.broadcastSection}>
          <Text style={styles.sectionTitle}>Broadcast Message</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.channelSelector}
            contentContainerStyle={styles.channelSelectorContent}
          >
            {channels.map(channel => (
              <TouchableOpacity
                key={channel}
                style={[
                  styles.channelButton,
                  selectedChannel === channel && styles.channelButtonActive,
                ]}
                onPress={() => setSelectedChannel(channel)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.channelButtonText,
                    selectedChannel === channel && styles.channelButtonTextActive,
                  ]}
                >
                  {channel}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.messageBox}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your broadcast message..."
              placeholderTextColor="#666680"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={sendBroadcast}
              disabled={!message.trim()}
              activeOpacity={0.7}
            >
              <Send size={18} color={message.trim() ? '#0a0a0f' : '#666680'} />
              <Text
                style={[
                  styles.sendButtonText,
                  !message.trim() && styles.sendButtonTextDisabled,
                ]}
              >
                Broadcast
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.membersSection}>
          <View style={styles.memberHeader}>
            <Text style={styles.sectionTitle}>Server Members</Text>
            <View style={styles.onlineBadge}>
              <Radio size={12} color="#00ff88" />
              <Text style={styles.onlineBadgeText}>
                {members.filter(m => m.isOnline).length} Online
              </Text>
            </View>
          </View>

          {members.map(member => (
            <View key={member.userId} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: getTierColor(member.tier) + '30' },
                  ]}
                >
                  <Text style={styles.memberInitial}>
                    {member.displayName.charAt(0)}
                  </Text>
                  {member.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.memberDetails}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.displayName}</Text>
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: getTierColor(member.tier) + '30' },
                      ]}
                    >
                      <Text
                        style={[styles.tierBadgeText, { color: getTierColor(member.tier) }]}
                      >
                        {member.tier}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.memberStats}>
                    <Text style={styles.memberStat}>
                      ${member.totalSpend.toLocaleString()} spent
                    </Text>
                    <Text style={styles.memberStat}>•</Text>
                    <Text style={styles.memberStat}>{member.visitCount} visits</Text>
                  </View>
                  {member.status !== 'ACTIVE' && (
                    <Text
                      style={[
                        styles.statusText,
                        member.status === 'BANNED' && styles.statusBanned,
                        member.status === 'WARNED' && styles.statusWarned,
                      ]}
                    >
                      {member.status}
                    </Text>
                  )}
                </View>
              </View>

              {member.status === 'ACTIVE' && (
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => warnMember(member.userId)}
                    activeOpacity={0.7}
                  >
                    <AlertTriangle size={18} color="#ffa64d" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconButton}
                    onPress={() => banMember(member.userId)}
                    activeOpacity={0.7}
                  >
                    <Ban size={18} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  broadcastSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  channelSelector: {
    marginBottom: 16,
  },
  channelSelectorContent: {
    gap: 12,
  },
  channelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#15151f',
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  channelButtonActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    borderColor: '#ff0080',
  },
  channelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#999',
  },
  channelButtonTextActive: {
    color: '#ff0080',
  },
  messageBox: {
    gap: 12,
  },
  messageInput: {
    backgroundColor: '#15151f',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  sendButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#ff0080',
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a3e',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  sendButtonTextDisabled: {
    color: '#666680',
  },
  membersSection: {
    paddingHorizontal: 20,
  },
  memberHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  onlineBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  onlineBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#00ff88',
  },
  memberCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#15151f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  memberInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
    position: 'relative' as const,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00ff88',
    borderWidth: 2,
    borderColor: '#15151f',
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  memberStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  memberStat: {
    fontSize: 12,
    color: '#999',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  statusWarned: {
    color: '#ffa64d',
  },
  statusBanned: {
    color: '#ff6b6b',
  },
  memberActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f1f2e',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  bottomPadding: {
    height: 40,
  },
});
