import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userBadge: string;
  content: string;
  timestamp: string;
  replyTo?: string;
  reactions: Array<{ emoji: string; userIds: string[] }>;
  edited: boolean;
  deleted: boolean;
  isOwn: boolean;
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface ChatContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentChannel: string | null;
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  sendMessage: (channelId: string, content: string, replyTo?: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  startTyping: (channelId: string) => void;
  stopTyping: (channelId: string) => void;
  loadMessages: (channelId: string) => Promise<void>;
  isLoadingMessages: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

const STORAGE_KEYS = {
  MESSAGES: 'chat_messages',
  OFFLINE_QUEUE: 'chat_offline_queue',
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { accessToken, userId } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!accessToken || !userId) {
      if (__DEV__) console.log('[Chat] No auth token, skipping Socket.io connection');
      return;
    }

    if (__DEV__) console.log('[Chat] Initializing Socket.io connection');

    const newSocket = io(API_URL, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      if (__DEV__) console.log('[Chat] Socket.io connected');
      setIsConnected(true);
      // Process offline queue
      processOfflineQueue(newSocket);
    });

    newSocket.on('disconnect', () => {
      if (__DEV__) console.log('[Chat] Socket.io disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Chat] Connection error:', error);
    });

    // Message events
    newSocket.on('message:new', (message: ChatMessage) => {
      if (__DEV__) console.log('[Chat] New message received:', message.id);
      setMessages((prev) => {
        // Check if message already exists
        if (prev.some((m) => m.id === message.id)) {
          return prev;
        }
        const updatedMessage = {
          ...message,
          isOwn: message.userId === userId,
        };
        return [...prev, updatedMessage];
      });
    });

    newSocket.on('message:edited', (data: { messageId: string; content: string }) => {
      if (__DEV__) console.log('[Chat] Message edited:', data.messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, content: data.content, edited: true }
            : m
        )
      );
    });

    newSocket.on('message:deleted', (data: { messageId: string }) => {
      if (__DEV__) console.log('[Chat] Message deleted:', data.messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId
            ? { ...m, content: '[Message deleted]', deleted: true }
            : m
        )
      );
    });

    newSocket.on('reaction:updated', (data: { messageId: string; reactions: any[] }) => {
      if (__DEV__) console.log('[Chat] Reaction updated:', data.messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        )
      );
    });

    // Typing events
    newSocket.on('user:typing', (data: { userId: string; userName: string }) => {
      if (data.userId !== userId) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === data.userId)) {
            return prev;
          }
          return [...prev, { userId: data.userId, userName: data.userName }];
        });
      }
    });

    newSocket.on('user:stopped-typing', (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    // Channel events
    newSocket.on('channel:joined', (data: { channelId: string }) => {
      if (__DEV__) console.log('[Chat] Channel joined:', data.channelId);
      setCurrentChannel(data.channelId);
    });

    newSocket.on('user:joined', (data: { userName: string }) => {
      if (__DEV__) console.log('[Chat] User joined:', data.userName);
    });

    newSocket.on('user:left', (data: { userName: string }) => {
      if (__DEV__) console.log('[Chat] User left:', data.userName);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('[Chat] Socket error:', data.message);
    });

    setSocket(newSocket);

    return () => {
      if (__DEV__) console.log('[Chat] Cleaning up Socket.io connection');
      newSocket.disconnect();
    };
  }, [accessToken, userId]);

  // Load messages from storage on mount
  useEffect(() => {
    loadMessagesFromStorage();
    loadOfflineQueue();
  }, []);

  // Save messages to storage when they change
  useEffect(() => {
    saveMessagesToStorage();
  }, [messages]);

  const loadMessagesFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      if (stored) {
        const parsedMessages = JSON.parse(stored);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('[Chat] Error loading messages from storage:', error);
    }
  };

  const saveMessagesToStorage = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('[Chat] Error saving messages to storage:', error);
    }
  };

  const loadOfflineQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (stored) {
        const queue = JSON.parse(stored);
        setOfflineQueue(queue);
      }
    } catch (error) {
      console.error('[Chat] Error loading offline queue:', error);
    }
  };

  const saveOfflineQueue = async (queue: any[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('[Chat] Error saving offline queue:', error);
    }
  };

  const processOfflineQueue = async (socketInstance: Socket) => {
    if (offlineQueue.length === 0) return;

    if (__DEV__) console.log('[Chat] Processing offline queue:', offlineQueue.length);

    for (const item of offlineQueue) {
      socketInstance.emit(item.event, item.data);
    }

    setOfflineQueue([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  };

  const joinChannel = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected) {
        console.warn('[Chat] Cannot join channel: not connected');
        return;
      }
      if (__DEV__) console.log('[Chat] Joining channel:', channelId);
      socket.emit('join:channel', channelId);
    },
    [socket, isConnected]
  );

  const leaveChannel = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected) return;
      if (__DEV__) console.log('[Chat] Leaving channel:', channelId);
      socket.emit('leave:channel', channelId);
      setCurrentChannel(null);
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(
    (channelId: string, content: string, replyTo?: string) => {
      if (!content || content.trim().length === 0) return;

      const messageData = {
        channelId,
        content: content.trim(),
        replyTo,
      };

      if (!socket || !isConnected) {
        if (__DEV__) console.log('[Chat] Offline, queueing message');
        const newQueue = [...offlineQueue, { event: 'message:send', data: messageData }];
        setOfflineQueue(newQueue);
        saveOfflineQueue(newQueue);
        return;
      }

      if (__DEV__) console.log('[Chat] Sending message');
      socket.emit('message:send', messageData);
    },
    [socket, isConnected, offlineQueue]
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!socket || !isConnected) return;
      if (__DEV__) console.log('[Chat] Editing message:', messageId);
      socket.emit('message:edit', { messageId, content });
    },
    [socket, isConnected]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!socket || !isConnected) return;
      if (__DEV__) console.log('[Chat] Deleting message:', messageId);
      socket.emit('message:delete', { messageId });
    },
    [socket, isConnected]
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!socket || !isConnected) return;
      if (__DEV__) console.log('[Chat] Adding reaction:', emoji, 'to message:', messageId);
      socket.emit('reaction:add', { messageId, emoji });
    },
    [socket, isConnected]
  );

  const startTyping = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected) return;
      socket.emit('typing:start', { channelId });

      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(channelId);
      }, 3000);
    },
    [socket, isConnected]
  );

  const stopTyping = useCallback(
    (channelId: string) => {
      if (!socket || !isConnected) return;
      socket.emit('typing:stop', { channelId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [socket, isConnected]
  );

  const loadMessages = useCallback(
    async (channelId: string) => {
      setIsLoadingMessages(true);
      try {
        // Load messages via REST API (fallback for initial load)
        const response = await fetch(`${API_URL}/api/chat/channels/${channelId}/messages?limit=100`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const messagesWithOwnership = data.data.map((msg: any) => ({
              ...msg,
              isOwn: msg.userId === userId,
            }));
            setMessages(messagesWithOwnership);
            if (__DEV__) console.log('[Chat] Loaded', messagesWithOwnership.length, 'messages');
          }
        }
      } catch (error) {
        console.error('[Chat] Error loading messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [accessToken, userId]
  );

  const value: ChatContextType = {
    socket,
    isConnected,
    currentChannel,
    messages,
    typingUsers,
    joinChannel,
    leaveChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    startTyping,
    stopTyping,
    loadMessages,
    isLoadingMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
