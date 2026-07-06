import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { NetworkProvider, useNetwork } from '../NetworkContext';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => {
  const listeners: Array<(state: any) => void> = [];
  return {
    __esModule: true,
    default: {
      fetch: jest.fn().mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      }),
      addEventListener: jest.fn((callback: (state: any) => void) => {
        listeners.push(callback);
        return () => {
          const index = listeners.indexOf(callback);
          if (index > -1) listeners.splice(index, 1);
        };
      }),
      _listeners: listeners,
      _simulateChange: (state: any) => {
        listeners.forEach((cb) => cb(state));
      },
    },
  };
});

// Mock ToastNotificationContext
const mockShowWarning = jest.fn();
const mockShowInfo = jest.fn();
jest.mock('../ToastNotificationContext', () => ({
  useToast: () => ({
    showWarning: mockShowWarning,
    showInfo: mockShowInfo,
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showToast: jest.fn(),
  }),
}));

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <NetworkProvider>{children}</NetworkProvider>
  );
}

describe('NetworkContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Reset listeners
    (NetInfo as any)._listeners.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // NetworkContext defers all NetInfo calls by 1s to dodge the TurboModule
  // init window (iOS New Arch crash fix) — advance past it after mounting.
  async function mountNetwork() {
    const wrapper = createWrapper();
    const rendered = renderHook(() => useNetwork(), { wrapper });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    return rendered;
  }

  it('should throw when used outside provider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => {
      renderHook(() => useNetwork());
    }).toThrow('useNetwork must be used within a NetworkProvider');
    spy.mockRestore();
  });

  it('should have default online state', async () => {
    const { result } = await mountNetwork();

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('should fetch initial network state after the deferral window', async () => {
    await mountNetwork();
    expect(NetInfo.fetch).toHaveBeenCalled();
  });

  it('should subscribe to network state changes after the deferral window', async () => {
    await mountNetwork();
    expect(NetInfo.addEventListener).toHaveBeenCalled();
  });

  it('should update state when network goes offline', async () => {
    const { result } = await mountNetwork();

    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isOffline).toBe(true);
    expect(result.current.connectionType).toBe('none');
  });

  it('should update state when network comes back online', async () => {
    const { result } = await mountNetwork();

    // Go offline first
    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    expect(result.current.isOffline).toBe(true);

    // Come back online
    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.connectionType).toBe('wifi');
  });

  it('should show warning toast when going offline', async () => {
    await mountNetwork();

    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    expect(mockShowWarning).toHaveBeenCalledWith(
      'You are offline',
      expect.any(String)
    );
  });

  it('should show info toast when coming back online after being offline', async () => {
    await mountNetwork();

    // Go offline
    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      });
    });

    // Come back online
    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      });
    });

    expect(mockShowInfo).toHaveBeenCalledWith(
      'Back online',
      expect.any(String)
    );
  });

  it('should handle connection type changes (wifi to cellular)', async () => {
    const { result } = await mountNetwork();

    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: true,
        isInternetReachable: true,
        type: 'cellular',
      });
    });

    expect(result.current.connectionType).toBe('cellular');
    expect(result.current.isOffline).toBe(false);
  });

  it('should treat isInternetReachable=false as offline even when connected', async () => {
    const { result } = await mountNetwork();

    act(() => {
      (NetInfo as any)._simulateChange({
        isConnected: true,
        isInternetReachable: false,
        type: 'wifi',
      });
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.isOffline).toBe(true);
  });
});
