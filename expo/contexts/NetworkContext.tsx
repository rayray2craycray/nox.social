import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useToast } from './ToastNotificationContext';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true,
    isInternetReachable: null,
    connectionType: null,
    isOffline: false,
  });
  const { showWarning, showInfo } = useToast();

  // Use refs so the listener closure always has fresh values without re-registering.
  const showWarningRef = useRef(showWarning);
  const showInfoRef = useRef(showInfo);
  const hasShownOfflineToastRef = useRef(false);
  const hasShownOnlineToastRef = useRef(false);

  useEffect(() => {
    showWarningRef.current = showWarning;
    showInfoRef.current = showInfo;
  }, [showWarning, showInfo]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Defer native NetInfo calls with a short delay so they don't fire during
    // the TurboModule initialization window (~0-500ms after launch). This
    // prevents ObjC exceptions in void-method invocations on iOS New Arch.
    const timer = setTimeout(() => {
      try {
        // Get initial network state
        NetInfo.fetch()
          .then((state: NetInfoState) => {
            const isConnected = state.isConnected ?? false;
            const isInternetReachable = state.isInternetReachable ?? null;
            const isOffline = !isConnected || isInternetReachable === false;

            setNetworkState({
              isConnected,
              isInternetReachable,
              connectionType: state.type,
              isOffline,
            });
          })
          .catch((err: unknown) => {
            console.warn('NetInfo.fetch() failed:', err);
          });
      } catch (err) {
        console.warn('NetInfo.fetch() threw synchronously:', err);
      }

      try {
        // Subscribe to network state changes
        unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
          const isConnected = state.isConnected ?? false;
          const isInternetReachable = state.isInternetReachable ?? null;
          const isOffline = !isConnected || isInternetReachable === false;

          if (isOffline && !hasShownOfflineToastRef.current) {
            showWarningRef.current(
              'You are offline',
              'Some features may not be available until you reconnect.'
            );
            hasShownOfflineToastRef.current = true;
            hasShownOnlineToastRef.current = false;
          }

          if (!isOffline && hasShownOfflineToastRef.current && !hasShownOnlineToastRef.current) {
            showInfoRef.current('Back online', 'You are now connected to the internet.');
            hasShownOnlineToastRef.current = true;
            hasShownOfflineToastRef.current = false;
          }

          setNetworkState({
            isConnected,
            isInternetReachable,
            connectionType: state.type,
            isOffline,
          });
        });
      } catch (err) {
        console.warn('NetInfo.addEventListener() threw:', err);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, []);

  return <NetworkContext.Provider value={networkState}>{children}</NetworkContext.Provider>;
};
