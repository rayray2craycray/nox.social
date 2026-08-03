import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Hash, Lock, Send, MessageCircle, Settings, LogOut, Users, Bell, AlertTriangle, X, Zap, MessageSquare, Shield } from 'lucide-react-native';
import { VenueServer, ServerChannel, Message, VibeEnergyLevel, WaitTimeRange, PerformerBooking } from '@/types';
import * as Haptics from 'expo-haptics';
import { useAppState } from '@/contexts/AppStateContext';
import { useSocial } from '@/contexts/SocialContext';
import { useChat } from '@/contexts/ChatContext';
import UserProfileModal from '@/components/UserProfileModal';
import { useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, DollarSign } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVenueMemberCounts } from '@/hooks/useVenueMemberCounts';

/** "1 member" / "N members" with correct pluralization. */
function memberLabel(n: number): string {
  return `${n} ${n === 1 ? 'member' : 'members'}`;
}

type TabType = 'servers' | 'messages';

export default function ServersScreen() {
  const params = useLocalSearchParams();
  const { profile, joinedServers } = useAppState();
  const [activeTab, setActiveTab] = useState<TabType>('servers');
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Debug: Log when screen mounts/updates and check AsyncStorage directly
  useEffect(() => {
    if (__DEV__) {
      console.log('[Servers] ServersScreen mounted/updated');
      console.log('[Servers] Profile badges:', profile.badges.length);
      console.log('[Servers] Joined servers:', joinedServers.length);

      // Check AsyncStorage directly to see what's stored
      AsyncStorage.getItem('vibelink_profile').then((stored) => {
        if (stored) {
          const storedProfile = JSON.parse(stored);
          console.log('[Servers] AsyncStorage profile badges:', storedProfile.badges?.length || 0);
          console.log('[Servers] AsyncStorage badge venueIds:', storedProfile.badges?.map((b: any) => b.venueId) || []);
        }
      });
    }
  }, [profile.badges, joinedServers]);

  // Handle deep link to open DM with specific user
  useEffect(() => {
    if (params.openDM && typeof params.openDM === 'string') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setActiveTab('messages');
      setSelectedConversation(`conv-${params.openDM}`);
    }
  }, [params.openDM]);

  const handleOpenUserProfile = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const handleOpenDM = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowUserProfile(false);
    setActiveTab('messages');
    setSelectedConversation(`conv-${userId}`);
  };

  // Direct Messages flow
  if (activeTab === 'messages') {
    if (selectedConversation) {
      return (
        <>
          <DirectMessageChat
            conversationId={selectedConversation}
            onBack={() => setSelectedConversation(null)}
            onOpenUserProfile={handleOpenUserProfile}
          />
          <UserProfileModal
            visible={showUserProfile}
            userId={selectedUserId}
            onClose={() => setShowUserProfile(false)}
            onMessage={handleOpenDM}
          />
        </>
      );
    }
    return (
      <TabContainer activeTab={activeTab} onChangeTab={setActiveTab}>
        <DirectMessagesList onSelectConversation={setSelectedConversation} />
      </TabContainer>
    );
  }

  // Servers flow
  if (!selectedServer) {
    return (
      <TabContainer activeTab={activeTab} onChangeTab={setActiveTab}>
        <ServerList onSelectServer={setSelectedServer} />
      </TabContainer>
    );
  }

  const server = joinedServers.find(s => s.venueId === selectedServer);
  if (!server) {
    if (__DEV__) {
      console.log('[Servers] Server not found for venueId:', selectedServer);
      console.log('[Servers] Available servers:', joinedServers.map(s => s.venueId));
    }
    return null;
  }

  if (!selectedChannel) {
    return (
      <>
        <ChannelList
          server={server}
          onSelectChannel={setSelectedChannel}
          onBack={() => setSelectedServer(null)}
          onOpenSettings={() => setShowSettings(true)}
        />
        <ServerSettingsModal
          visible={showSettings}
          server={server}
          onClose={() => setShowSettings(false)}
          onLeave={() => {
            setShowSettings(false);
            setSelectedServer(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <ChatView
        server={server}
        channelId={selectedChannel}
        onBack={() => setSelectedChannel(null)}
        onOpenUserProfile={handleOpenUserProfile}
      />
      <UserProfileModal
        visible={showUserProfile}
        userId={selectedUserId}
        onClose={() => setShowUserProfile(false)}
        onMessage={handleOpenDM}
      />
    </>
  );
}

interface TabContainerProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  children: React.ReactNode;
}

function TabContainer({ activeTab, onChangeTab, children }: TabContainerProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.gradient}
      >
        <View style={styles.tabHeader}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'servers' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChangeTab('servers');
            }}
          >
            <MessageCircle size={20} color={activeTab === 'servers' ? '#ff0080' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'servers' && styles.tabTextActive]}>
              Servers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChangeTab('messages');
            }}
          >
            <MessageSquare size={20} color={activeTab === 'messages' ? '#ff0080' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
              Messages
            </Text>
            <View style={styles.encryptedBadge}>
              <Shield size={10} color="#00ff99" />
            </View>
          </TouchableOpacity>
        </View>
        {children}
      </LinearGradient>
    </View>
  );
}

interface DirectMessagesListProps {
  onSelectConversation: (conversationId: string) => void;
}

function DirectMessagesList({ onSelectConversation }: DirectMessagesListProps) {
  const conversations: Array<{
    id: string;
    userId: string;
    userName: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    isOnline: boolean;
  }> = [];

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct Messages</Text>
        <View style={styles.encryptionInfo}>
          <Shield size={14} color="#00ff99" />
          <Text style={styles.encryptionText}>End-to-end encrypted</Text>
        </View>
      </View>

      <ScrollView style={styles.conversationList} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color="#666" />
            <Text style={styles.emptyStateTitle}>No messages yet</Text>
            <Text style={styles.emptyStateText}>Start a conversation with your friends!</Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectConversation(conversation.id);
              }}
            >
              <LinearGradient
                colors={['#1a1a2e', '#1a1a1a']}
                style={styles.conversationCardGradient}
              >
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{conversation.userName[0]}</Text>
                  </View>
                  {conversation.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{conversation.userName}</Text>
                    <Text style={styles.conversationTime}>{getTimeAgo(conversation.timestamp)}</Text>
                  </View>
                  <View style={styles.conversationFooter}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {conversation.lastMessage}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
  );
}

interface DirectMessageChatProps {
  conversationId: string;
  onBack: () => void;
  onOpenUserProfile: (userId: string) => void;
}

function DirectMessageChat({ conversationId, onBack, onOpenUserProfile }: DirectMessageChatProps) {
  const { profile } = useAppState();
  const { getFriendProfile } = useSocial();
  const [message, setMessage] = useState<string>('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    date: '',
    startTime: '',
    endTime: '',
    fee: '',
  });

  // Look up the conversation to get the actual userId from the deep-link format (conv-<userId>)
  const otherUserId = conversationId.replace('conv-', '');
  const otherUserProfile = getFriendProfile(otherUserId);
  const otherUserName = otherUserProfile?.displayName || 'User';

  // Check if current user is a venue manager and the other user is a performer
  const isVenueManager = profile.isVenueManager;
  const isTalent = otherUserProfile?.isVerified && otherUserProfile.verifiedCategory === 'PERFORMER';
  const canBook = isVenueManager && isTalent;

  const [messages, setMessages] = useState<Array<{
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    isOwn: boolean;
    isEncrypted: boolean;
  }>>([]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add new message to the chat
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'user-me',
      senderName: 'You',
      content: message,
      timestamp: new Date().toISOString(),
      isOwn: true,
      isEncrypted: true,
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleBookTalent = () => {
    if (!bookingDetails.date || !bookingDetails.startTime || !bookingDetails.endTime || !bookingDetails.fee) {
      Alert.alert('Missing Information', 'Please fill in all booking details');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Get venue info from profile
    const venueId = profile.managedVenues?.[0] || 'venue-1';

    // Create the booking
    const newBooking: PerformerBooking = {
      id: `booking-${Date.now()}`,
      performerId: otherUserId,
      venueId: venueId,
      date: bookingDetails.date,
      startTime: bookingDetails.startTime,
      endTime: bookingDetails.endTime,
      fee: parseFloat(bookingDetails.fee),
      status: 'PENDING',
    };

    // Send confirmation message
    const confirmationMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'user-me',
      senderName: 'You',
      content: `🎉 Booking request sent! ${otherUserName} is scheduled for ${bookingDetails.date} from ${bookingDetails.startTime} to ${bookingDetails.endTime}. Fee: $${bookingDetails.fee}. Check Talent Booking to manage this booking.`,
      timestamp: new Date().toISOString(),
      isOwn: true,
      isEncrypted: true,
    };

    setMessages([...messages, confirmationMessage]);
    setShowBookingModal(false);
    setBookingDetails({
      date: '',
      startTime: '',
      endTime: '',
      fee: '',
    });

    Alert.alert(
      'Booking Request Sent!',
      `${otherUserName} has been booked. Check the Talent Booking page to manage this booking.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.gradient}
      >
        <View style={styles.dmHeader}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dmHeaderInfo}
            onPress={() => onOpenUserProfile(otherUserId)}
          >
            <Text style={styles.dmHeaderTitle}>{otherUserName}</Text>
            <View style={styles.encryptionBadge}>
              <Shield size={12} color="#00ff99" />
              <Text style={styles.encryptionBadgeText}>Encrypted</Text>
            </View>
          </TouchableOpacity>
          {canBook && (
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowBookingModal(true);
              }}
            >
              <LinearGradient
                colors={['#ff0080', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookButtonGradient}
              >
                <Calendar size={16} color="#000" />
                <Text style={styles.bookButtonText}>Book</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.dmBubble, item.isOwn && styles.dmBubbleOwn]}>
              {!item.isOwn && (
                <TouchableOpacity onPress={() => onOpenUserProfile(item.senderId)}>
                  <Text style={styles.dmSenderName}>{item.senderName}</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.dmContent, item.isOwn && styles.dmContentOwn]}>
                {item.content}
              </Text>
              <View style={styles.dmFooter}>
                <Text style={[styles.dmTime, item.isOwn && styles.dmTimeOwn]}>
                  {getTimeAgo(item.timestamp)}
                </Text>
                {item.isEncrypted && (
                  <Shield size={10} color={item.isOwn ? '#000' : '#00ff99'} />
                )}
              </View>
            </View>
          )}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type an encrypted message..."
            placeholderTextColor="#666"
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Send size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.bookingModalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowBookingModal(false)}
          />
          <View style={styles.bookingModalContent}>
            <LinearGradient
              colors={['#1a1a1a', '#0a0a0a']}
              style={styles.bookingModalGradient}
            >
              <View style={styles.bookingModalHeader}>
                <Text style={styles.bookingModalTitle}>Book {otherUserName}</Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowBookingModal(false);
                  }}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.bookingForm} showsVerticalScrollIndicator={false}>
                <View style={styles.bookingInputGroup}>
                  <View style={styles.bookingInputIcon}>
                    <Calendar size={18} color="#ff0080" />
                  </View>
                  <View style={styles.bookingInputContent}>
                    <Text style={styles.bookingInputLabel}>Date</Text>
                    <TextInput
                      style={styles.bookingInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#666"
                      value={bookingDetails.date}
                      onChangeText={(text) => setBookingDetails({ ...bookingDetails, date: text })}
                    />
                  </View>
                </View>

                <View style={styles.bookingInputRow}>
                  <View style={[styles.bookingInputGroup, { flex: 1, marginRight: 8 }]}>
                    <View style={styles.bookingInputIcon}>
                      <Clock size={18} color="#ff0080" />
                    </View>
                    <View style={styles.bookingInputContent}>
                      <Text style={styles.bookingInputLabel}>Start Time</Text>
                      <TextInput
                        style={styles.bookingInput}
                        placeholder="HH:MM"
                        placeholderTextColor="#666"
                        value={bookingDetails.startTime}
                        onChangeText={(text) => setBookingDetails({ ...bookingDetails, startTime: text })}
                      />
                    </View>
                  </View>

                  <View style={[styles.bookingInputGroup, { flex: 1, marginLeft: 8 }]}>
                    <View style={styles.bookingInputIcon}>
                      <Clock size={18} color="#ff0080" />
                    </View>
                    <View style={styles.bookingInputContent}>
                      <Text style={styles.bookingInputLabel}>End Time</Text>
                      <TextInput
                        style={styles.bookingInput}
                        placeholder="HH:MM"
                        placeholderTextColor="#666"
                        value={bookingDetails.endTime}
                        onChangeText={(text) => setBookingDetails({ ...bookingDetails, endTime: text })}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.bookingInputGroup}>
                  <View style={styles.bookingInputIcon}>
                    <DollarSign size={18} color="#00ff99" />
                  </View>
                  <View style={styles.bookingInputContent}>
                    <Text style={styles.bookingInputLabel}>Fee</Text>
                    <TextInput
                      style={styles.bookingInput}
                      placeholder="0.00"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={bookingDetails.fee}
                      onChangeText={(text) => setBookingDetails({ ...bookingDetails, fee: text })}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmBookingButton}
                  onPress={handleBookTalent}
                >
                  <LinearGradient
                    colors={['#ff0080', '#a855f7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmBookingGradient}
                  >
                    <Calendar size={20} color="#000" />
                    <Text style={styles.confirmBookingText}>Confirm Booking</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface ServerListProps {
  onSelectServer: (serverId: string) => void;
}

function ServerList({ onSelectServer }: ServerListProps) {
  const { joinedServers, profile } = useAppState();
  const getMemberCount = useVenueMemberCounts(joinedServers.map((s) => s.venueId));

  // Debug logging
  React.useEffect(() => {
    if (__DEV__) {
      console.log('[Servers] ServerList rendered');
      console.log('[Servers] joinedServers:', joinedServers.length);
      console.log('[Servers] profile.badges:', profile.badges.length);
      console.log('[Servers] Badge venueIds:', profile.badges.map(b => b.venueId));
    }
  }, [joinedServers, profile.badges]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Servers</Text>
        <Text style={styles.headerSubtitle}>Connected to {joinedServers.length} venues</Text>
      </View>

      <ScrollView style={styles.serverList} showsVerticalScrollIndicator={false}>
          {joinedServers.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color="#666" />
              <Text style={styles.emptyStateTitle}>No servers yet</Text>
              <Text style={styles.emptyStateText}>Join a venue&apos;s lobby from the Discovery tab to start chatting!</Text>
            </View>
          ) : (
            joinedServers.map((server) => (
            <TouchableOpacity
              key={server.venueId}
              style={styles.serverCard}
              onPress={() => onSelectServer(server.venueId)}
            >
              <LinearGradient
                colors={['#1a1a2e', '#1a1a1a']}
                style={styles.serverCardGradient}
              >
                <View style={styles.serverInfo}>
                  <Text style={styles.serverName}>{server.venueName}</Text>
                  <Text style={styles.memberCount}>{memberLabel(getMemberCount(server.venueId))}</Text>
                </View>
                <View style={styles.serverMeta}>
                  <Text style={styles.lastActivity}>
                    {getTimeAgo(server.lastActivity)}
                  </Text>
                  {getTotalUnread(server.channels) > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{getTotalUnread(server.channels)}</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
          )}

          <TouchableOpacity style={styles.joinNewCard}>
            <MessageCircle size={32} color="#ff0080" />
            <Text style={styles.joinNewText}>Join a new server</Text>
            <Text style={styles.joinNewSubtext}>Visit a venue and scan the QR code</Text>
          </TouchableOpacity>
        </ScrollView>
    </>
  );
}

interface ChannelListProps {
  server: VenueServer;
  onSelectChannel: (channelId: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

function ChannelList({ server, onSelectChannel, onBack, onOpenSettings }: ChannelListProps) {
  const getMemberCount = useVenueMemberCounts([server.venueId]);
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onBack}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onOpenSettings} style={styles.settingsButton}>
              <Settings size={24} color="#ff0080" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{server.venueName}</Text>
          <Text style={styles.headerSubtitle}>{memberLabel(getMemberCount(server.venueId))}</Text>
        </View>

        <ScrollView style={styles.channelList} showsVerticalScrollIndicator={false}>
          <View style={styles.channelSection}>
            <Text style={styles.sectionTitle}>PUBLIC LOBBY</Text>
            {server.channels
              .filter(ch => ch.type === 'PUBLIC_LOBBY')
              .map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  onPress={() => onSelectChannel(channel.id)}
                />
              ))}
          </View>

          <View style={styles.channelSection}>
            <Text style={styles.sectionTitle}>INNER CIRCLE</Text>
            {server.channels
              .filter(ch => ch.type === 'INNER_CIRCLE')
              .map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  onPress={() => onSelectChannel(channel.id)}
                />
              ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

interface ChannelItemProps {
  channel: ServerChannel;
  onPress: () => void;
}

function ChannelItem({ channel, onPress }: ChannelItemProps) {
  return (
    <TouchableOpacity
      style={[styles.channelItem, channel.isLocked && styles.channelLocked]}
      onPress={channel.isLocked ? undefined : onPress}
      disabled={channel.isLocked}
    >
      {channel.isLocked ? (
        <Lock size={18} color="#666" />
      ) : (
        <Hash size={18} color="#ff0080" />
      )}
      <Text style={[styles.channelName, channel.isLocked && styles.channelNameLocked]}>
        {channel.name}
      </Text>
      {channel.unreadCount > 0 && (
        <View style={styles.channelUnread}>
          <Text style={styles.channelUnreadText}>{channel.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface ChatViewProps {
  server: VenueServer;
  channelId: string;
  onBack: () => void;
  onOpenUserProfile: (userId: string) => void;
}

function ChatView({ server, channelId, onBack, onOpenUserProfile }: ChatViewProps) {
  const { getBroadcastMessagesForChannel } = useAppState();
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    joinChannel,
    leaveChannel,
    loadMessages,
    isLoadingMessages,
    isConnected,
    typingUsers,
    startTyping,
    stopTyping,
  } = useChat();
  const [message, setMessage] = useState<string>('');
  const [showVibeCheck, setShowVibeCheck] = useState<boolean>(false);

  // Join channel and load messages on mount
  useEffect(() => {
    if (__DEV__) console.log('[ChatView] Joining channel:', channelId);
    joinChannel(channelId);
    loadMessages(channelId);

    return () => {
      if (__DEV__) console.log('[ChatView] Leaving channel:', channelId);
      leaveChannel(channelId);
    };
  }, [channelId]);

  // Get chat messages for this channel
  const channelChatMessages = chatMessages.filter((m) => m.channelId === channelId);

  // Get broadcast messages and convert to Message format
  const channelName = server.channels.find(c => c.id === channelId)?.name || 'general';
  const broadcastMessages = getBroadcastMessagesForChannel(`#${channelName}`).map(broadcast => ({
    id: broadcast.id,
    channelId: channelId,
    userId: 'venue-manager',
    userName: '🎤 Venue Broadcast',
    userBadge: 'MANAGER',
    content: broadcast.message,
    timestamp: broadcast.timestamp,
    isOwn: false,
    isBroadcast: true,
  }));

  // Merge and sort messages by timestamp
  const messages = [...channelChatMessages, ...broadcastMessages].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const channel = server.channels.find(c => c.id === channelId);
  const isGeneralChannel = channel?.name === 'general' && channel?.type === 'PUBLIC_LOBBY';

  const handleSendMessage = () => {
    if (!message.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Send via Socket.io
    sendChatMessage(channelId, message);
    setMessage('');
    stopTyping(channelId);
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    if (text.length > 0) {
      startTyping(channelId);
    } else {
      stopTyping(channelId);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.gradient}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>#{server.channels.find(c => c.id === channelId)?.name}</Text>
        </View>

        {isGeneralChannel && (
          <VibeCheckOverlay 
            venueId={server.venueId}
            venueName={server.venueName}
            visible={showVibeCheck}
            onToggle={() => setShowVibeCheck(!showVibeCheck)}
          />
        )}

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onOpenUserProfile={onOpenUserProfile}
            />
          )}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          ListHeaderComponent={
            isLoadingMessages ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : null
          }
        />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              {typingUsers.map((u) => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}

        {/* Connection status */}
        {!isConnected && (
          <View style={styles.connectionStatus}>
            <Text style={styles.connectionStatusText}>⚠️ Reconnecting...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            value={message}
            onChangeText={handleTextChange}
            editable={isConnected}
          />
          <TouchableOpacity
            style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!isConnected}
          >
            <Send size={20} color={isConnected ? "#000000" : "#666"} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

interface MessageBubbleProps {
  message: Message;
  onOpenUserProfile: (userId: string) => void;
}

function MessageBubble({ message, onOpenUserProfile }: MessageBubbleProps) {
  const badgeColors: Record<string, string> = {
    PLATINUM: '#ff0080',
    WHALE: '#ff006e',
    PERFORMER: '#ffcc00',
    REGULAR: '#6680ff',
    GUEST: '#666',
    MANAGER: '#ffa64d',
  };

  const isBroadcast = 'isBroadcast' in message && message.isBroadcast;

  if (isBroadcast) {
    return (
      <View style={styles.broadcastWrapper}>
        <LinearGradient
          colors={['rgba(255, 0, 128, 0.25)', 'rgba(138, 85, 247, 0.25)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.broadcastBubble}
        >
          <View style={styles.broadcastBorder}>
            <View style={styles.messageHeader}>
              <TouchableOpacity onPress={() => onOpenUserProfile(message.userId)}>
                <Text style={styles.messageName}>{message.userName}</Text>
              </TouchableOpacity>
              <View style={[styles.messageBadge, { backgroundColor: badgeColors[message.userBadge] }]}>
                <Text style={styles.messageBadgeText}>{message.userBadge}</Text>
              </View>
            </View>
            <Text style={[styles.messageContent, styles.broadcastContent]}>{message.content}</Text>
            <Text style={styles.messageTime}>{getTimeAgo(message.timestamp)}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.messageBubble, message.isOwn && styles.messageBubbleOwn]}>
      <View style={styles.messageHeader}>
        <TouchableOpacity onPress={() => onOpenUserProfile(message.userId)}>
          <Text style={styles.messageName}>{message.userName}</Text>
        </TouchableOpacity>
        <View style={[styles.messageBadge, { backgroundColor: badgeColors[message.userBadge] }]}>
          <Text style={styles.messageBadgeText}>{message.userBadge}</Text>
        </View>
      </View>
      <Text style={styles.messageContent}>{message.content}</Text>
      <Text style={styles.messageTime}>{getTimeAgo(message.timestamp)}</Text>
    </View>
  );
}

function getTotalUnread(channels: ServerChannel[]): number {
  return channels.reduce((sum, ch) => sum + ch.unreadCount, 0);
}

function getTimeAgo(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface ServerSettingsModalProps {
  visible: boolean;
  server: VenueServer;
  onClose: () => void;
  onLeave: () => void;
}

function ServerSettingsModal({ visible, server, onClose, onLeave }: ServerSettingsModalProps) {
  const { leaveServer, profile } = useAppState();
  const getMemberCount = useVenueMemberCounts(server ? [server.venueId] : []);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState<boolean>(false);

  const userBadge = profile.badges.find(b => b.venueId === server.venueId);
  const isVIP = userBadge?.badgeType === 'WHALE' || userBadge?.badgeType === 'PLATINUM';

  const handleLeave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLeaveConfirmation(true);
  };

  const confirmLeave = () => {
    leaveServer.mutate(server.venueId, {
      onSuccess: (data) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowLeaveConfirmation(false);
        onClose();
        onLeave();
        Alert.alert('Left Server', `You've left ${server.venueName}'s server.`, [{ text: 'OK' }]);
      },
      onError: (error) => {
        console.error('Error leaving server:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setShowLeaveConfirmation(false);
        Alert.alert('Error', 'Failed to leave server. Please try again.', [{ text: 'OK' }]);
      }
    });
  };

  const cancelLeave = () => {
    setShowLeaveConfirmation(false);
  };

  return (
    <>
      <Modal
        visible={visible && !showLeaveConfirmation}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={onClose}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Server Settings</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Server Info</Text>
              <View style={styles.settingsItem}>
                <Users size={20} color="#ff0080" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsItemText}>{server.venueName}</Text>
                  <Text style={styles.settingsItemSubtext}>{memberLabel(getMemberCount(server.venueId))}</Text>
                </View>
              </View>
              {userBadge && (
                <View style={styles.settingsItem}>
                  <Bell size={20} color="#ff0080" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingsItemText}>Your Status</Text>
                    <Text style={styles.settingsItemSubtext}>{userBadge.badgeType}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Danger Zone</Text>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={handleLeave}
              >
                <LogOut size={20} color="#ff006e" />
                <Text style={styles.leaveButtonText}>Leave Server</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isVIP ? (
        <VIPLeaveConfirmationModal
          visible={showLeaveConfirmation}
          venueName={server.venueName}
          badgeType={userBadge?.badgeType || 'WHALE'}
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      ) : (
        <PublicLobbyLeaveConfirmationModal
          visible={showLeaveConfirmation}
          venueName={server.venueName}
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      )}
    </>
  );
}

interface PublicLobbyLeaveConfirmationModalProps {
  visible: boolean;
  venueName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function PublicLobbyLeaveConfirmationModal({
  visible,
  venueName,
  onConfirm,
  onCancel
}: PublicLobbyLeaveConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.confirmModalHeader}>
            <Text style={styles.confirmModalTitle}>Leave Public Lobby?</Text>
          </View>

          <Text style={styles.confirmModalBody}>
            You will stop receiving live updates and chat notifications for {venueName}. You can re-join anytime by scanning the venue QR code.
          </Text>

          <View style={styles.confirmModalButtons}>
            <TouchableOpacity 
              style={[styles.confirmModalButton, styles.confirmModalButtonCancel]} 
              onPress={onCancel}
            >
              <Text style={styles.confirmModalButtonTextCancel}>Stay</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmModalButton, styles.confirmModalButtonLeave]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmModalButtonTextLeave}>Leave Lobby</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface VIPLeaveConfirmationModalProps {
  visible: boolean;
  venueName: string;
  badgeType: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function VIPLeaveConfirmationModal({ 
  visible, 
  venueName, 
  badgeType, 
  onConfirm, 
  onCancel 
}: VIPLeaveConfirmationModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.confirmModalHeader}>
            <AlertTriangle size={28} color="#ff006e" />
            <Text style={styles.confirmModalTitle}>Relinquish VIP Access?</Text>
          </View>

          <Text style={styles.confirmModalBody}>
            You are about to leave the {venueName} Inner Circle. Your &ldquo;{badgeType}&rdquo; status and history will be archived, but you will lose access to private chats and performer requests immediately.
          </Text>

          <View style={styles.vipWarningBox}>
            <AlertTriangle size={16} color="#ff006e" />
            <Text style={styles.vipWarningText}>Re-entry requires meeting the spend threshold again.</Text>
          </View>

          <View style={styles.confirmModalButtons}>
            <TouchableOpacity 
              style={[styles.confirmModalButton, styles.confirmModalButtonCancel]} 
              onPress={onCancel}
            >
              <Text style={styles.confirmModalButtonTextCancel}>Keep My Status</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmModalButton, styles.confirmModalButtonDestroy]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmModalButtonTextDestroy}>Confirm Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface AccessRevokedModalProps {
  visible: boolean;
  venueName: string;
  onDismiss: () => void;
}

interface VibeCheckOverlayProps {
  venueId: string;
  venueName: string;
  visible: boolean;
  onToggle: () => void;
}

function VibeCheckOverlay({ venueId, venueName, visible, onToggle }: VibeCheckOverlayProps) {
  const { canVoteVibeCheck, getVibeCooldownRemaining, submitVibeCheck, getVenueVibe } = useAppState();
  const [music, setMusic] = useState<number>(3);
  const [density, setDensity] = useState<number>(3);
  const [energy, setEnergy] = useState<VibeEnergyLevel>('Social');
  const [waitTime, setWaitTime] = useState<WaitTimeRange>('0-10m');

  const canVote = canVoteVibeCheck(venueId);
  const cooldownRemaining = getVibeCooldownRemaining(venueId);
  const currentVibe = getVenueVibe(venueId);

  const handleSubmit = async () => {
    if (!canVote) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await submitVibeCheck.mutateAsync({
      venueId,
      music,
      density,
      energy,
      waitTime,
    });
    Alert.alert('Vibe Check Submitted!', 'Thanks for helping the community know what\'s happening at ' + venueName);
    onToggle();
  };

  const formatCooldown = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getVibeColor = (energyLevel: VibeEnergyLevel): string => {
    switch (energyLevel) {
      case 'Chill': return '#6680ff';
      case 'Social': return '#b366ff';
      case 'Wild': return '#ff006e';
      default: return '#ff0080';
    }
  };

  if (!visible) {
    return (
      <TouchableOpacity style={styles.vibeCheckContainer} onPress={onToggle}>
        <View style={styles.vibeCheckCollapsed}>
          <Zap size={20} color="#ff0080" />
          <Text style={styles.vibeCheckCollapsedText}>Vibe Check</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.vibeCheckContainer}>
      <TouchableOpacity style={styles.vibeCheckHeader} onPress={onToggle}>
        <Text style={styles.vibeCheckTitle}>Vibe Check</Text>
        <X size={20} color="#ff0080" />
      </TouchableOpacity>

      <ScrollView style={styles.vibeCheckScroll} contentContainerStyle={styles.vibeCheckContent} showsVerticalScrollIndicator={false}>
        {currentVibe && (
          <View style={styles.vibeCheckCurrentData}>
            <Text style={styles.vibeCheckCurrentTitle}>Current Vibe</Text>
            <View style={styles.vibeCheckCurrentRow}>
              <Text style={styles.vibeCheckCurrentLabel}>Music</Text>
              <Text style={styles.vibeCheckCurrentValue}>{currentVibe.musicScore.toFixed(1)}/5</Text>
            </View>
            <View style={styles.vibeCheckCurrentRow}>
              <Text style={styles.vibeCheckCurrentLabel}>Density</Text>
              <Text style={styles.vibeCheckCurrentValue}>{currentVibe.densityScore.toFixed(1)}/5</Text>
            </View>
            <View style={styles.vibeCheckCurrentRow}>
              <Text style={styles.vibeCheckCurrentLabel}>Energy</Text>
              <Text style={[styles.vibeCheckCurrentValue, { color: getVibeColor(currentVibe.energyLevel) }]}>
                {currentVibe.energyLevel}
              </Text>
            </View>
            <View style={styles.vibeCheckCurrentRow}>
              <Text style={styles.vibeCheckCurrentLabel}>Wait Time</Text>
              <Text style={styles.vibeCheckCurrentValue}>{currentVibe.waitTime}</Text>
            </View>
          </View>
        )}

        <View style={styles.vibeCheckSection}>
          <Text style={styles.vibeCheckLabel}>Music</Text>
          <View style={styles.vibeSlider}>
            <TouchableOpacity
              style={styles.sliderTrack}
              activeOpacity={0.8}
              onPress={(e) => {
                const touchX = e.nativeEvent.locationX;
                const sliderWidth = 300; // Approximate width
                const value = Math.ceil((touchX / sliderWidth) * 5);
                const clampedValue = Math.max(1, Math.min(5, value));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMusic(clampedValue);
              }}
            >
              <LinearGradient
                colors={['#6680ff', '#ff0080']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.sliderFill, { width: `${(music / 5) * 100}%` }]}
              />
            </TouchableOpacity>
            <View style={styles.sliderLabels}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMusic(val);
                  }}
                  style={styles.sliderLabelButton}
                >
                  <Text style={[styles.sliderLabel, music === val && styles.sliderLabelActive]}>
                    {val === 1 ? 'Weak' : val === 5 ? 'Fire' : val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.vibeCheckSection}>
          <Text style={styles.vibeCheckLabel}>Density</Text>
          <View style={styles.vibeSlider}>
            <TouchableOpacity
              style={styles.sliderTrack}
              activeOpacity={0.8}
              onPress={(e) => {
                const touchX = e.nativeEvent.locationX;
                const sliderWidth = 300; // Approximate width
                const value = Math.ceil((touchX / sliderWidth) * 5);
                const clampedValue = Math.max(1, Math.min(5, value));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDensity(clampedValue);
              }}
            >
              <LinearGradient
                colors={['#6680ff', '#ff006e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.sliderFill, { width: `${(density / 5) * 100}%` }]}
              />
            </TouchableOpacity>
            <View style={styles.sliderLabels}>
              {[1, 2, 3, 4, 5].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDensity(val);
                  }}
                  style={styles.sliderLabelButton}
                >
                  <Text style={[styles.sliderLabel, density === val && styles.sliderLabelActive]}>
                    {val === 1 ? 'Empty' : val === 5 ? 'Packed' : val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.vibeCheckSection}>
          <Text style={styles.vibeCheckLabel}>Energy</Text>
          <View style={styles.energyButtons}>
            {(['Chill', 'Social', 'Wild'] as VibeEnergyLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.energyButton, energy === level && styles.energyButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEnergy(level);
                }}
              >
                <Text style={[styles.energyButtonText, energy === level && styles.energyButtonTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.vibeCheckSection}>
          <Text style={styles.vibeCheckLabel}>Wait Time</Text>
          <View style={styles.waitTimeButtons}>
            {(['0-10m', '10-30m', '30m+'] as WaitTimeRange[]).map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.waitTimeButton, waitTime === time && styles.waitTimeButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWaitTime(time);
                }}
              >
                <Text style={[styles.waitTimeButtonText, waitTime === time && styles.waitTimeButtonTextActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.vibeSubmitButton, !canVote && styles.vibeSubmitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canVote || submitVibeCheck.isPending}
        >
          <Text style={styles.vibeSubmitButtonText}>
            {submitVibeCheck.isPending ? 'Submitting...' : 'Submit Vibe Check'}
          </Text>
        </TouchableOpacity>

        {!canVote && (
          <Text style={styles.vibeCooldownText}>
            Next vote available in {formatCooldown(cooldownRemaining)}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

export function AccessRevokedModal({ visible, venueName, onDismiss }: AccessRevokedModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.revokedHeader}>
            <View style={styles.revokedIconContainer}>
              <X size={32} color="#ff006e" />
            </View>
            <Text style={styles.confirmModalTitle}>Access Revoked</Text>
          </View>

          <Text style={styles.confirmModalBody}>
            Your access to {venueName} has been suspended by the venue management for a violation of community guidelines.
          </Text>

          <View style={styles.revokedDetailBox}>
            <Text style={styles.revokedDetailText}>
              Your linked card has been disconnected from this venue&apos;s loyalty logic.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.revokedAppealButton}
            onPress={() => {
              Alert.alert(
                'Appeal Process',
                'To appeal this decision, please email support@vibelink.com with your user ID and explanation. Appeals are reviewed within 3-5 business days.',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.revokedAppealButtonText}>Appeal Decision / View Community Guidelines</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.revokedDismissButton} 
            onPress={onDismiss}
          >
            <Text style={styles.revokedDismissButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ff0080',
    fontWeight: '600' as const,
  },
  backButton: {
    fontSize: 16,
    color: '#ff0080',
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  serverList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  serverCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  serverCardGradient: {
    padding: 16,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 13,
    color: '#999',
  },
  serverMeta: {
    alignItems: 'flex-end' as const,
    gap: 6,
  },
  lastActivity: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#ff0080',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center' as const,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#000000',
  },
  joinNewCard: {
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 204, 0.3)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center' as const,
    marginTop: 12,
    marginBottom: 40,
  },
  joinNewText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff0080',
    marginTop: 12,
  },
  joinNewSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  channelList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  channelSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    marginBottom: 8,
  },
  channelItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderRadius: 8,
  },
  channelLocked: {
    opacity: 0.5,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    flex: 1,
  },
  channelNameLocked: {
    color: '#666',
  },
  channelUnread: {
    backgroundColor: '#ff006e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center' as const,
  },
  channelUnreadText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  chatHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 20,
    gap: 16,
  },
  messageBubble: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  messageBubbleOwn: {
    backgroundColor: '#ff0080',
    alignSelf: 'flex-end' as const,
  },
  messageHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 6,
  },
  messageName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  messageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messageBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#000000',
  },
  messageContent: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  broadcastWrapper: {
    width: '100%',
    maxWidth: '100%',
  },
  broadcastBubble: {
    borderRadius: 12,
    padding: 2,
  },
  broadcastBorder: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 12,
  },
  broadcastContent: {
    fontWeight: '600' as const,
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    color: '#fff',
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff0080',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    paddingHorizontal: 40,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  settingsButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  closeButton: {
    fontSize: 16,
    color: '#ff0080',
    fontWeight: '600' as const,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  settingsItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  settingsItemText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
  },
  settingsItemSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  leaveButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff006e',
    gap: 8,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff006e',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  confirmModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmModalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
  },
  confirmModalBody: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 20,
  },
  vipWarningBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff006e',
    gap: 8,
    marginBottom: 20,
  },
  vipWarningText: {
    flex: 1,
    fontSize: 13,
    color: '#ff006e',
    fontWeight: '600' as const,
  },
  confirmModalButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  confirmModalButtonCancel: {
    backgroundColor: '#ff0080',
  },
  confirmModalButtonLeave: {
    backgroundColor: '#444',
  },
  confirmModalButtonDestroy: {
    backgroundColor: '#ff006e',
  },
  confirmModalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
  },
  confirmModalButtonTextLeave: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ccc',
  },
  confirmModalButtonTextDestroy: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  revokedHeader: {
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  revokedIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 0, 110, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ff006e',
  },
  revokedDetailBox: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  revokedDetailText: {
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
  },
  revokedAppealButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  revokedAppealButtonText: {
    fontSize: 13,
    color: '#ff0080',
    fontWeight: '600' as const,
    textDecorationLine: 'underline' as const,
  },
  revokedDismissButton: {
    backgroundColor: '#444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  revokedDismissButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  vibeCheckContainer: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  vibeCheckHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  vibeCheckTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  vibeCheckCollapsed: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    gap: 12,
  },
  vibeCheckCollapsedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  vibeCheckScroll: {
    maxHeight: 400,
  },
  vibeCheckContent: {
    padding: 16,
  },
  vibeCheckSection: {
    marginBottom: 20,
  },
  vibeCheckLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  vibeSlider: {
    gap: 8,
  },
  sliderTrack: {
    height: 12,
    backgroundColor: '#000000',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 6,
  },
  sliderLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sliderLabel: {
    fontSize: 11,
    color: '#666',
  },
  sliderLabelActive: {
    color: '#ff0080',
    fontWeight: '700' as const,
  },
  sliderLabelButton: {
    padding: 4,
    minWidth: 44,
    alignItems: 'center' as const,
  },
  energyButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  energyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  energyButtonActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    borderColor: '#ff0080',
  },
  energyButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  energyButtonTextActive: {
    color: '#ff0080',
    fontWeight: '700' as const,
  },
  waitTimeButtons: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  waitTimeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  waitTimeButtonActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    borderColor: '#ff0080',
  },
  waitTimeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  waitTimeButtonTextActive: {
    color: '#ff0080',
    fontWeight: '700' as const,
  },
  vibeSubmitButton: {
    backgroundColor: '#ff0080',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  vibeSubmitButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  vibeSubmitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
  },
  vibeCooldownText: {
    fontSize: 12,
    color: '#ff006e',
    textAlign: 'center' as const,
    marginTop: 8,
  },
  vibeMeterContainer: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  vibeCheckCurrentData: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  vibeCheckCurrentTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase' as const,
  },
  vibeCheckCurrentRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  vibeCheckCurrentLabel: {
    fontSize: 13,
    color: '#999',
  },
  vibeCheckCurrentValue: {
    fontSize: 13,
    color: '#ff0080',
    fontWeight: '600' as const,
  },
  // Tab Navigation Styles
  tabHeader: {
    flexDirection: 'row' as const,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 0, 128, 0.15)',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabTextActive: {
    color: '#ff0080',
    fontWeight: '700' as const,
  },
  encryptedBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 255, 153, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  // Direct Messages List Styles
  encryptionInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 4,
  },
  encryptionText: {
    fontSize: 12,
    color: '#00ff99',
    fontWeight: '600' as const,
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conversationCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  conversationCardGradient: {
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative' as const,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff0080',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#000',
  },
  onlineIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00ff99',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  conversationTime: {
    fontSize: 11,
    color: '#666',
  },
  conversationFooter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  // Direct Message Chat Styles
  dmHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  dmHeaderInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 8,
  },
  dmHeaderTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  encryptionBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0, 255, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  encryptionBadgeText: {
    fontSize: 11,
    color: '#00ff99',
    fontWeight: '600' as const,
  },
  dmBubble: {
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 8,
  },
  dmBubbleOwn: {
    backgroundColor: '#ff0080',
    alignSelf: 'flex-end' as const,
    marginLeft: 'auto' as const,
  },
  dmSenderName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ff0080',
    marginBottom: 4,
  },
  dmContent: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 21,
  },
  dmContentOwn: {
    color: '#000',
  },
  dmFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginTop: 4,
  },
  dmTime: {
    fontSize: 10,
    color: '#666',
  },
  dmTimeOwn: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  bookButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  bookingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  bookingModalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  bookingModalGradient: {
    paddingBottom: 40,
  },
  bookingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  bookingModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  bookingForm: {
    padding: 20,
  },
  bookingInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  bookingInputRow: {
    flexDirection: 'row',
  },
  bookingInputIcon: {
    marginRight: 12,
  },
  bookingInputContent: {
    flex: 1,
  },
  bookingInputLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
  },
  bookingInput: {
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  confirmBookingButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  confirmBookingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
  },
  confirmBookingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  typingText: {
    color: '#ff0080',
    fontSize: 12,
    fontStyle: 'italic',
  },
  connectionStatus: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  connectionStatusText: {
    color: '#ffa500',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
