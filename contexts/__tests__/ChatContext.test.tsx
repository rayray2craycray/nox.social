import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Mock socket.io-client ---
const mockEmit = jest.fn();
const mockDisconnect = jest.fn();

// Store registered handlers so tests can simulate server events
const socketHandlers: Record<string, (...args: any[]) => void> = {};

const mockSocketInstance = {
  emit: mockEmit,
  disconnect: mockDisconnect,
  on: jest.fn((event: string, handler: (...args: any[]) => void) => {
    socketHandlers[event] = handler;
  }),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocketInstance),
}));

// --- Mock AuthContext ---
const mockAuth = {
  accessToken: 'test-access-token',
  userId: 'test-user-id',
};

jest.mock('../AuthContext', () => ({
  useAuth: () => mockAuth,
}));

// --- Mock global fetch ---
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocks
import { ChatProvider, useChat } from '../ChatContext';
import { io } from 'socket.io-client';

// Suppress console noise
let logSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
  errorSpy.mockRestore();
  warnSpy.mockRestore();
});

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
  );
}

/** Helper to simulate the socket emitting a 'connect' event */
function simulateConnect() {
  if (socketHandlers['connect']) {
    socketHandlers['connect']();
  }
}

/** Helper to simulate the socket emitting a 'disconnect' event */
function simulateDisconnect() {
  if (socketHandlers['disconnect']) {
    socketHandlers['disconnect']();
  }
}

describe('ChatContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    // Clear stored handlers
    Object.keys(socketHandlers).forEach((k) => delete socketHandlers[k]);
    // Reset auth to defaults
    mockAuth.accessToken = 'test-access-token';
    mockAuth.userId = 'test-user-id';
  });

  // ----------------------------------------------------------------
  // 1. useChat throws outside provider
  // ----------------------------------------------------------------
  it('should throw when useChat is used outside ChatProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => {
      renderHook(() => useChat());
    }).toThrow('useChat must be used within ChatProvider');
    spy.mockRestore();
  });

  // ----------------------------------------------------------------
  // 2. Provides all expected properties and methods
  // ----------------------------------------------------------------
  it('should provide all expected context properties and methods', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.currentChannel).toBeNull();
    expect(Array.isArray(result.current.messages)).toBe(true);
    expect(Array.isArray(result.current.typingUsers)).toBe(true);
    expect(result.current.isLoadingMessages).toBe(false);
    expect(typeof result.current.joinChannel).toBe('function');
    expect(typeof result.current.leaveChannel).toBe('function');
    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.editMessage).toBe('function');
    expect(typeof result.current.deleteMessage).toBe('function');
    expect(typeof result.current.addReaction).toBe('function');
    expect(typeof result.current.startTyping).toBe('function');
    expect(typeof result.current.stopTyping).toBe('function');
    expect(typeof result.current.loadMessages).toBe('function');
  });

  // ----------------------------------------------------------------
  // 3. Initialises socket with auth token
  // ----------------------------------------------------------------
  it('should initialise a socket.io connection when accessToken and userId are available', () => {
    const wrapper = createWrapper();
    renderHook(() => useChat(), { wrapper });

    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: 'test-access-token' },
        transports: ['websocket', 'polling'],
      })
    );
  });

  // ----------------------------------------------------------------
  // 4. Does NOT initialise socket without auth
  // ----------------------------------------------------------------
  it('should not initialise socket when accessToken is missing', () => {
    mockAuth.accessToken = '';
    mockAuth.userId = '';

    (io as jest.Mock).mockClear();
    const wrapper = createWrapper();
    renderHook(() => useChat(), { wrapper });

    expect(io).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------
  // 5. Sets isConnected on socket connect / disconnect
  // ----------------------------------------------------------------
  it('should set isConnected to true on socket connect and false on disconnect', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current.isConnected).toBe(false);

    act(() => {
      simulateConnect();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      simulateDisconnect();
    });
    expect(result.current.isConnected).toBe(false);
  });

  // ----------------------------------------------------------------
  // 6. joinChannel emits the right event
  // ----------------------------------------------------------------
  it('should emit join:channel when joinChannel is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.joinChannel('channel-abc');
    });

    expect(mockEmit).toHaveBeenCalledWith('join:channel', 'channel-abc');
  });

  // ----------------------------------------------------------------
  // 7. joinChannel does nothing when disconnected
  // ----------------------------------------------------------------
  it('should not emit join:channel when not connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    // Do NOT simulate connect -> isConnected stays false
    act(() => {
      result.current.joinChannel('channel-abc');
    });

    expect(mockEmit).not.toHaveBeenCalledWith('join:channel', expect.anything());
  });

  // ----------------------------------------------------------------
  // 8. sendMessage emits when connected
  // ----------------------------------------------------------------
  it('should emit message:send when sendMessage is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.sendMessage('ch-1', 'Hello world');
    });

    expect(mockEmit).toHaveBeenCalledWith('message:send', {
      channelId: 'ch-1',
      content: 'Hello world',
      replyTo: undefined,
    });
  });

  // ----------------------------------------------------------------
  // 9. sendMessage ignores empty / whitespace content
  // ----------------------------------------------------------------
  it('should not send a message when content is empty or whitespace', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.sendMessage('ch-1', '');
    });
    act(() => {
      result.current.sendMessage('ch-1', '   ');
    });

    expect(mockEmit).not.toHaveBeenCalledWith('message:send', expect.anything());
  });

  // ----------------------------------------------------------------
  // 10. sendMessage queues offline when disconnected
  // ----------------------------------------------------------------
  it('should queue message in offline queue when not connected', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    // Do NOT connect
    act(() => {
      result.current.sendMessage('ch-1', 'offline msg');
    });

    // The message should NOT have been emitted
    expect(mockEmit).not.toHaveBeenCalledWith('message:send', expect.anything());

    // AsyncStorage should have the offline queue persisted
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('chat_offline_queue');
      expect(stored).not.toBeNull();
      const queue = JSON.parse(stored!);
      expect(queue).toHaveLength(1);
      expect(queue[0].event).toBe('message:send');
      expect(queue[0].data.content).toBe('offline msg');
    });
  });

  // ----------------------------------------------------------------
  // 11. Incoming message:new adds message to state
  // ----------------------------------------------------------------
  it('should add a new message to state when message:new is received', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    const incomingMessage = {
      id: 'msg-1',
      channelId: 'ch-1',
      userId: 'other-user',
      userName: 'Alice',
      userBadge: '',
      content: 'Hi there',
      timestamp: new Date().toISOString(),
      reactions: [],
      edited: false,
      deleted: false,
      isOwn: false,
    };

    act(() => {
      socketHandlers['message:new'](incomingMessage);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('msg-1');
    expect(result.current.messages[0].isOwn).toBe(false);
  });

  // ----------------------------------------------------------------
  // 12. Incoming message:new marks own messages
  // ----------------------------------------------------------------
  it('should set isOwn to true when the message userId matches the current user', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    const ownMessage = {
      id: 'msg-own',
      channelId: 'ch-1',
      userId: 'test-user-id', // matches mockAuth.userId
      userName: 'Me',
      userBadge: '',
      content: 'My message',
      timestamp: new Date().toISOString(),
      reactions: [],
      edited: false,
      deleted: false,
      isOwn: false,
    };

    act(() => {
      socketHandlers['message:new'](ownMessage);
    });

    expect(result.current.messages[0].isOwn).toBe(true);
  });

  // ----------------------------------------------------------------
  // 13. Duplicate messages are not added
  // ----------------------------------------------------------------
  it('should not add duplicate messages with the same id', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    const msg = {
      id: 'msg-dup',
      channelId: 'ch-1',
      userId: 'other',
      userName: 'Bob',
      userBadge: '',
      content: 'Hello',
      timestamp: new Date().toISOString(),
      reactions: [],
      edited: false,
      deleted: false,
      isOwn: false,
    };

    act(() => {
      socketHandlers['message:new'](msg);
    });
    act(() => {
      socketHandlers['message:new'](msg);
    });

    expect(result.current.messages).toHaveLength(1);
  });

  // ----------------------------------------------------------------
  // 14. message:edited updates message content
  // ----------------------------------------------------------------
  it('should update message content and mark edited on message:edited', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    // Add a message first
    act(() => {
      socketHandlers['message:new']({
        id: 'msg-edit',
        channelId: 'ch-1',
        userId: 'user-1',
        userName: 'Alice',
        userBadge: '',
        content: 'Original',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
        isOwn: false,
      });
    });

    act(() => {
      socketHandlers['message:edited']({ messageId: 'msg-edit', content: 'Edited content' });
    });

    expect(result.current.messages[0].content).toBe('Edited content');
    expect(result.current.messages[0].edited).toBe(true);
  });

  // ----------------------------------------------------------------
  // 15. message:deleted marks the message as deleted
  // ----------------------------------------------------------------
  it('should mark message as deleted on message:deleted', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      socketHandlers['message:new']({
        id: 'msg-del',
        channelId: 'ch-1',
        userId: 'user-1',
        userName: 'Alice',
        userBadge: '',
        content: 'Will be deleted',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
        isOwn: false,
      });
    });

    act(() => {
      socketHandlers['message:deleted']({ messageId: 'msg-del' });
    });

    expect(result.current.messages[0].content).toBe('[Message deleted]');
    expect(result.current.messages[0].deleted).toBe(true);
  });

  // ----------------------------------------------------------------
  // 16. reaction:updated updates reactions on a message
  // ----------------------------------------------------------------
  it('should update reactions on a message when reaction:updated is received', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      socketHandlers['message:new']({
        id: 'msg-react',
        channelId: 'ch-1',
        userId: 'user-1',
        userName: 'Alice',
        userBadge: '',
        content: 'React to me',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
        isOwn: false,
      });
    });

    const newReactions = [{ emoji: '👍', userIds: ['user-1'] }];
    act(() => {
      socketHandlers['reaction:updated']({ messageId: 'msg-react', reactions: newReactions });
    });

    expect(result.current.messages[0].reactions).toEqual(newReactions);
  });

  // ----------------------------------------------------------------
  // 17. user:typing adds a typing user (ignores own userId)
  // ----------------------------------------------------------------
  it('should add a typing user and ignore own userId', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    // Another user typing -> should be added
    act(() => {
      socketHandlers['user:typing']({ userId: 'other-user', userName: 'Alice' });
    });
    expect(result.current.typingUsers).toHaveLength(1);
    expect(result.current.typingUsers[0].userName).toBe('Alice');

    // Own user typing -> should be ignored
    act(() => {
      socketHandlers['user:typing']({ userId: 'test-user-id', userName: 'Me' });
    });
    expect(result.current.typingUsers).toHaveLength(1);
  });

  // ----------------------------------------------------------------
  // 18. user:stopped-typing removes a typing user
  // ----------------------------------------------------------------
  it('should remove a typing user on user:stopped-typing', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => {
      socketHandlers['user:typing']({ userId: 'other-user', userName: 'Alice' });
    });
    expect(result.current.typingUsers).toHaveLength(1);

    act(() => {
      socketHandlers['user:stopped-typing']({ userId: 'other-user' });
    });
    expect(result.current.typingUsers).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // 19. loadMessages fetches from REST API and sets messages
  // ----------------------------------------------------------------
  it('should load messages from the REST API and set them in state', async () => {
    const apiMessages = [
      {
        id: 'api-msg-1',
        channelId: 'ch-1',
        userId: 'test-user-id',
        userName: 'Me',
        userBadge: '',
        content: 'From API',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
      },
      {
        id: 'api-msg-2',
        channelId: 'ch-1',
        userId: 'other-user',
        userName: 'Alice',
        userBadge: '',
        content: 'Also from API',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: apiMessages }),
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.loadMessages('ch-1');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat/channels/ch-1/messages'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-access-token' },
      })
    );

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].isOwn).toBe(true);
    expect(result.current.messages[1].isOwn).toBe(false);
    expect(result.current.isLoadingMessages).toBe(false);
  });

  // ----------------------------------------------------------------
  // 20. loadMessages handles fetch failure gracefully
  // ----------------------------------------------------------------
  it('should handle loadMessages fetch failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    await act(async () => {
      await result.current.loadMessages('ch-1');
    });

    // Should not crash; isLoadingMessages should be reset
    expect(result.current.isLoadingMessages).toBe(false);
    expect(result.current.messages).toHaveLength(0);
  });

  // ----------------------------------------------------------------
  // 21. leaveChannel emits and clears currentChannel
  // ----------------------------------------------------------------
  it('should emit leave:channel and clear currentChannel on leaveChannel', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    // Simulate joining a channel first
    act(() => {
      socketHandlers['channel:joined']({ channelId: 'ch-1' });
    });
    expect(result.current.currentChannel).toBe('ch-1');

    act(() => {
      result.current.leaveChannel('ch-1');
    });

    expect(mockEmit).toHaveBeenCalledWith('leave:channel', 'ch-1');
    expect(result.current.currentChannel).toBeNull();
  });

  // ----------------------------------------------------------------
  // 22. editMessage emits message:edit
  // ----------------------------------------------------------------
  it('should emit message:edit when editMessage is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.editMessage('msg-1', 'Updated content');
    });

    expect(mockEmit).toHaveBeenCalledWith('message:edit', {
      messageId: 'msg-1',
      content: 'Updated content',
    });
  });

  // ----------------------------------------------------------------
  // 23. deleteMessage emits message:delete
  // ----------------------------------------------------------------
  it('should emit message:delete when deleteMessage is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.deleteMessage('msg-1');
    });

    expect(mockEmit).toHaveBeenCalledWith('message:delete', { messageId: 'msg-1' });
  });

  // ----------------------------------------------------------------
  // 24. addReaction emits reaction:add
  // ----------------------------------------------------------------
  it('should emit reaction:add when addReaction is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.addReaction('msg-1', '🔥');
    });

    expect(mockEmit).toHaveBeenCalledWith('reaction:add', {
      messageId: 'msg-1',
      emoji: '🔥',
    });
  });

  // ----------------------------------------------------------------
  // 25. Messages are persisted to AsyncStorage
  // ----------------------------------------------------------------
  it('should persist messages to AsyncStorage when messages change', async () => {
    const wrapper = createWrapper();
    renderHook(() => useChat(), { wrapper });

    act(() => {
      socketHandlers['message:new']({
        id: 'persist-1',
        channelId: 'ch-1',
        userId: 'user-1',
        userName: 'Alice',
        userBadge: '',
        content: 'Persisted',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
        isOwn: false,
      });
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('chat_messages');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.some((m: any) => m.id === 'persist-1')).toBe(true);
    });
  });

  // ----------------------------------------------------------------
  // 26. Messages are loaded from AsyncStorage on mount
  // ----------------------------------------------------------------
  it('should load persisted messages from AsyncStorage on mount', async () => {
    const cached = [
      {
        id: 'cached-1',
        channelId: 'ch-1',
        userId: 'user-1',
        userName: 'Alice',
        userBadge: '',
        content: 'Cached msg',
        timestamp: new Date().toISOString(),
        reactions: [],
        edited: false,
        deleted: false,
        isOwn: false,
      },
    ];
    await AsyncStorage.setItem('chat_messages', JSON.stringify(cached));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('cached-1');
    });
  });

  // ----------------------------------------------------------------
  // 27. startTyping emits typing:start
  // ----------------------------------------------------------------
  it('should emit typing:start when startTyping is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.startTyping('ch-1');
    });

    expect(mockEmit).toHaveBeenCalledWith('typing:start', { channelId: 'ch-1' });
  });

  // ----------------------------------------------------------------
  // 28. stopTyping emits typing:stop
  // ----------------------------------------------------------------
  it('should emit typing:stop when stopTyping is called while connected', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useChat(), { wrapper });

    act(() => simulateConnect());

    act(() => {
      result.current.stopTyping('ch-1');
    });

    expect(mockEmit).toHaveBeenCalledWith('typing:stop', { channelId: 'ch-1' });
  });
});
