import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wifi,
  WifiOff,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bluetooth,
  Loader,
} from 'lucide-react-native';
import { useToast } from '@/contexts/ToastContext';
import { useGlow } from '@/contexts/GlowContext';
import { ToastSpendRule } from '@/types';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function ToastIntegrationScreen() {
  const {
    integration,
    availableLocations,
    spendRules,
    isConnected,
    isConnecting,
    hasError,
    connectToast,
    disconnectToast,
    selectLocations,
    updateSpendRule,
  } = useToast();
  const { triggerGlow } = useGlow();

  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>(
    integration.selectedLocations
  );
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [isBluetoothPairing, setIsBluetoothPairing] = useState(false);

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Show Bluetooth connection prompt
    Alert.alert(
      'Connect Toast POS',
      'To connect to your Toast POS system, we need to pair with your terminal via Bluetooth. Make sure Bluetooth is enabled on your device and your Toast terminal is nearby.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Connect via Bluetooth',
          onPress: () => {
            setShowBluetoothModal(true);
            startBluetoothPairing();
          },
        },
      ]
    );
  };

  const startBluetoothPairing = () => {
    setIsBluetoothPairing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate Bluetooth pairing process
    setTimeout(() => {
      setIsBluetoothPairing(false);
      setShowBluetoothModal(false);

      // Actually connect to Toast after successful pairing
      connectToast.mutate(undefined, {
        onSuccess: () => {
          triggerGlow({ color: 'gold', intensity: 0.7, duration: 1200 });
          Alert.alert(
            'Connected!',
            'Successfully connected to Toast POS system via Bluetooth.',
            [{ text: 'OK' }]
          );
        },
      });
    }, 3000); // 3 second pairing simulation
  };

  const handleDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    disconnectToast.mutate();
  };

  const toggleLocation = (locationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter(id => id !== locationId)
      : [...selectedLocationIds, locationId];
    
    setSelectedLocationIds(updated);
    selectLocations.mutate(updated);
  };

  const toggleRule = (rule: ToastSpendRule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSpendRule.mutate({ ...rule, isActive: !rule.isActive });
  };

  const getStatusColor = () => {
    if (isConnected) return '#a855f7';
    if (hasError) return '#ff6b6b';
    if (isConnecting) return '#ffa64d';
    return '#666680';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (hasError) return 'Connection Error';
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isConnected) return <CheckCircle2 size={20} color="#a855f7" />;
    if (hasError) return <XCircle size={20} color="#ff6b6b" />;
    if (isConnecting) return <ActivityIndicator size={20} color="#ffa64d" />;
    return <WifiOff size={20} color="#666680" />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Toast POS Integration</Text>
          <Text style={styles.headerDescription}>
            Automatically reward customers based on their bar spending
          </Text>
        </View>

        <LinearGradient
          colors={
            isConnected
              ? ['rgba(0, 255, 136, 0.1)', 'rgba(0, 212, 255, 0.1)']
              : ['rgba(102, 102, 128, 0.1)', 'rgba(102, 102, 128, 0.05)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            {getStatusIcon()}
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Integration Status</Text>
              <Text style={[styles.statusValue, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {isConnected && integration.connectedAt && (
            <View style={styles.statusDetails}>
              <Text style={styles.statusDetailText}>
                Connected {new Date(integration.connectedAt).toLocaleDateString()}
              </Text>
              {integration.lastSyncAt && (
                <Text style={styles.statusDetailText}>
                  Last sync: {new Date(integration.lastSyncAt).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}

          {!isConnected && !isConnecting && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={handleConnect}
              activeOpacity={0.7}
            >
              <Wifi size={20} color="#0a0a0f" />
              <Text style={styles.connectButtonText}>Connect to Toast</Text>
            </TouchableOpacity>
          )}

          {isConnected && (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
              activeOpacity={0.7}
            >
              <WifiOff size={16} color="#ff6b6b" />
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {isConnected && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color="#ff0080" />
                <Text style={styles.sectionTitle}>Select Locations</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Choose which Toast locations to sync with VibeLink
              </Text>

              <View style={styles.locationsList}>
                {availableLocations.map(location => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.locationCard,
                      selectedLocationIds.includes(location.id) &&
                        styles.locationCardSelected,
                    ]}
                    onPress={() => toggleLocation(location.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.name}</Text>
                      <Text style={styles.locationAddress}>{location.address}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedLocationIds.includes(location.id) &&
                          styles.checkboxChecked,
                      ]}
                    >
                      {selectedLocationIds.includes(location.id) && (
                        <CheckCircle2 size={20} color="#ff0080" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <DollarSign size={20} color="#ff0080" />
                <Text style={styles.sectionTitle}>Spend Thresholds</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Set automatic rewards based on customer spending
              </Text>

              <View style={styles.rulesList}>
                {spendRules.map(rule => (
                  <View key={rule.id} style={styles.ruleCard}>
                    <View style={styles.ruleHeader}>
                      <View style={styles.ruleHeaderLeft}>
                        <Text style={styles.ruleThreshold}>
                          ${rule.threshold}+
                        </Text>
                        <View style={styles.ruleBadge}>
                          <Text style={styles.ruleBadgeText}>
                            {rule.tierUnlocked}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={rule.isActive}
                        onValueChange={() => toggleRule(rule)}
                        trackColor={{ false: '#2a2a3e', true: '#ff008050' }}
                        thumbColor={rule.isActive ? '#ff0080' : '#666680'}
                      />
                    </View>

                    <View style={styles.ruleDetails}>
                      <View style={styles.ruleDetailRow}>
                        <Text style={styles.ruleDetailLabel}>Access Level:</Text>
                        <Text style={styles.ruleDetailValue}>
                          {rule.serverAccessLevel === 'INNER_CIRCLE'
                            ? 'Inner Circle'
                            : 'Public Lobby'}
                        </Text>
                      </View>

                      {rule.isLiveOnly && (
                        <View style={styles.liveOnlyBadge}>
                          <Clock size={14} color="#ff6b9d" />
                          <Text style={styles.liveOnlyText}>
                            Live Only{' '}
                            {rule.liveTimeWindow &&
                              `(${rule.liveTimeWindow.startTime} - ${rule.liveTimeWindow.endTime})`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <LinearGradient
                colors={['rgba(0, 255, 204, 0.1)', 'rgba(0, 212, 255, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCard}
              >
                <View style={styles.infoHeader}>
                  <AlertCircle size={20} color="#ff0080" />
                  <Text style={styles.infoTitle}>How It Works</Text>
                </View>
                <Text style={styles.infoText}>
                  When a customer makes a purchase at your venue using Toast POS, we
                  match their card token to their VibeLink account.
                </Text>
                <Text style={styles.infoText}>
                  If their spending meets a threshold, they automatically unlock the
                  associated tier and server access.
                </Text>
                <Text style={styles.infoText}>
                  All card data is tokenized. We never see actual card numbers.
                </Text>
              </LinearGradient>
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showBluetoothModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBluetoothModal(false)}
      >
        <View style={styles.bluetoothModalOverlay}>
          <View style={styles.bluetoothModalContent}>
            <LinearGradient
              colors={['#1a1a2e', '#15151f']}
              style={styles.bluetoothModalGradient}
            >
              <View style={styles.bluetoothIconContainer}>
                {isBluetoothPairing ? (
                  <View style={styles.pulsingBluetoothIcon}>
                    <Bluetooth size={48} color="#00d4ff" />
                  </View>
                ) : (
                  <CheckCircle2 size={48} color="#a855f7" />
                )}
              </View>

              <Text style={styles.bluetoothModalTitle}>
                {isBluetoothPairing ? 'Pairing with Toast POS...' : 'Paired Successfully!'}
              </Text>

              <Text style={styles.bluetoothModalDescription}>
                {isBluetoothPairing
                  ? 'Searching for Toast terminals nearby. Make sure your terminal is powered on and in pairing mode.'
                  : 'Your device is now connected to the Toast POS system.'}
              </Text>

              {isBluetoothPairing && (
                <View style={styles.pairingLoader}>
                  <ActivityIndicator size="large" color="#00d4ff" />
                </View>
              )}

              {!isBluetoothPairing && (
                <TouchableOpacity
                  style={styles.bluetoothDoneButton}
                  onPress={() => setShowBluetoothModal(false)}
                >
                  <Text style={styles.bluetoothDoneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>
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
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statusDetails: {
    gap: 4,
    marginBottom: 16,
  },
  statusDetailText: {
    fontSize: 12,
    color: '#999',
  },
  connectButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#ff0080',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  disconnectButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  disconnectButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#ff6b6b',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    lineHeight: 18,
  },
  locationsList: {
    gap: 12,
  },
  locationCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#15151f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#1f1f2e',
  },
  locationCardSelected: {
    borderColor: '#ff0080',
    backgroundColor: 'rgba(0, 255, 204, 0.05)',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 12,
    color: '#999',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#666680',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxChecked: {
    borderColor: '#ff0080',
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
  },
  rulesList: {
    gap: 12,
  },
  ruleCard: {
    backgroundColor: '#15151f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  ruleHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  ruleHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  ruleThreshold: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#ff0080',
  },
  ruleBadge: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ruleBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  ruleDetails: {
    gap: 8,
  },
  ruleDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  ruleDetailLabel: {
    fontSize: 13,
    color: '#999',
  },
  ruleDetailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  liveOnlyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  liveOnlyText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ff6b9d',
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  infoText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 40,
  },
  bluetoothModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  bluetoothModalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
  },
  bluetoothModalGradient: {
    padding: 32,
    alignItems: 'center' as const,
  },
  bluetoothIconContainer: {
    marginBottom: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pulsingBluetoothIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  bluetoothModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  bluetoothModalDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  pairingLoader: {
    marginTop: 8,
    marginBottom: 16,
  },
  bluetoothDoneButton: {
    backgroundColor: '#ff0080',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 24,
    marginTop: 8,
  },
  bluetoothDoneButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
});
