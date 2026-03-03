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
  TextInput,
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
  Key,
  ChevronDown,
} from 'lucide-react-native';
import { usePOS } from '@/contexts/POSContext';
import { useGlow } from '@/contexts/GlowContext';
import { POSProviderType, POSCredentials, SpendRule } from '@/types';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export default function POSIntegrationScreen() {
  const {
    integration,
    availableLocations,
    spendRules,
    isConnected,
    isConnecting,
    hasError,
    connectPOS,
    disconnectPOS,
    validateCredentials,
    updateSpendRule,
  } = usePOS();
  const { triggerGlow } = useGlow();

  // Provider selection
  const [selectedProvider, setSelectedProvider] = useState<POSProviderType>('TOAST');
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  // API key input state
  const [apiKey, setApiKey] = useState('');
  const [locationId, setLocationId] = useState('');
  const [environment, setEnvironment] = useState<'PRODUCTION' | 'SANDBOX'>('PRODUCTION');

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleConnect = async () => {
    // Validate inputs
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter your API key');
      return;
    }
    if (!locationId.trim()) {
      Alert.alert('Error', 'Please enter your location ID');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setValidationError('');

    const credentials: POSCredentials = {
      apiKey: apiKey.trim(),
      locationId: locationId.trim(),
      environment,
    };

    // First validate credentials
    setIsValidating(true);
    try {
      const result = await validateCredentials.mutateAsync({
        provider: selectedProvider,
        credentials,
      });

      if (!result.valid) {
        setValidationError('Invalid credentials. Please check your API key and location ID.');
        setIsValidating(false);
        return;
      }

      // If validation successful, connect
      await connectPOS.mutateAsync({
        venueId: 'venue-1', // TODO: Get from auth context
        provider: selectedProvider,
        credentials,
      });

      triggerGlow({ color: 'gold', intensity: 0.7, duration: 1200 });
      Alert.alert(
        'Connected!',
        `Successfully connected to ${selectedProvider} POS system.`,
        [{ text: 'OK' }]
      );

      // Clear input fields
      setApiKey('');
      setLocationId('');
    } catch (error: any) {
      setValidationError(error.message || 'Connection failed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDisconnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Disconnect POS',
      'Are you sure you want to disconnect your POS system? Transaction syncing will stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnectPOS.mutate('venue-1'); // TODO: Get from auth context
          },
        },
      ]
    );
  };

  const toggleRule = (rule: SpendRule) => {
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
          <Text style={styles.headerTitle}>POS Integration</Text>
          <Text style={styles.headerDescription}>
            Connect Toast or Square to automatically reward customers based on spending
          </Text>
        </View>

        {/* Status Card */}
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
              {isConnected && integration && (
                <Text style={styles.providerBadge}>
                  {integration.provider} {integration.metadata.environment || 'PRODUCTION'}
                </Text>
              )}
            </View>
          </View>

          {isConnected && integration?.connectedAt && (
            <View style={styles.statusDetails}>
              <Text style={styles.statusDetailText}>
                Connected {new Date(integration.connectedAt).toLocaleDateString()}
              </Text>
              {integration.syncConfig.lastSyncAt && (
                <Text style={styles.statusDetailText}>
                  Last sync: {new Date(integration.syncConfig.lastSyncAt).toLocaleTimeString()}
                </Text>
              )}
              {integration.stats && (
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>
                    {integration.stats.transactionCount} transactions
                  </Text>
                  <Text style={styles.statText}>
                    ${(integration.stats.totalRevenue / 100).toFixed(2)} revenue
                  </Text>
                </View>
              )}
            </View>
          )}

          {!isConnected && !isConnecting && (
            <>
              {/* Provider Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>POS Provider</Text>
                <TouchableOpacity
                  style={styles.providerSelector}
                  onPress={() => setShowProviderPicker(!showProviderPicker)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.providerSelectorText}>{selectedProvider}</Text>
                  <ChevronDown size={20} color="#999" />
                </TouchableOpacity>

                {showProviderPicker && (
                  <View style={styles.providerOptions}>
                    <TouchableOpacity
                      style={[
                        styles.providerOption,
                        selectedProvider === 'TOAST' && styles.providerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedProvider('TOAST');
                        setShowProviderPicker(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.providerOptionText,
                          selectedProvider === 'TOAST' && styles.providerOptionTextSelected,
                        ]}
                      >
                        Toast POS
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.providerOption,
                        selectedProvider === 'SQUARE' && styles.providerOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedProvider('SQUARE');
                        setShowProviderPicker(false);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text
                        style={[
                          styles.providerOptionText,
                          selectedProvider === 'SQUARE' && styles.providerOptionTextSelected,
                        ]}
                      >
                        Square POS
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* API Key Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {selectedProvider === 'TOAST' ? 'API Key' : 'Access Token'}
                </Text>
                <View style={styles.inputContainer}>
                  <Key size={18} color="#666680" />
                  <TextInput
                    style={styles.input}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder={
                      selectedProvider === 'TOAST'
                        ? 'Enter your Toast API key'
                        : 'Enter your Square access token'
                    }
                    placeholderTextColor="#666680"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Location ID Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {selectedProvider === 'TOAST' ? 'Restaurant GUID' : 'Location ID'}
                </Text>
                <View style={styles.inputContainer}>
                  <MapPin size={18} color="#666680" />
                  <TextInput
                    style={styles.input}
                    value={locationId}
                    onChangeText={setLocationId}
                    placeholder={
                      selectedProvider === 'TOAST'
                        ? 'Enter your restaurant GUID'
                        : 'Enter your location ID'
                    }
                    placeholderTextColor="#666680"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Environment Toggle */}
              <View style={styles.environmentToggle}>
                <Text style={styles.environmentLabel}>Environment</Text>
                <View style={styles.environmentButtons}>
                  <TouchableOpacity
                    style={[
                      styles.environmentButton,
                      environment === 'PRODUCTION' && styles.environmentButtonActive,
                    ]}
                    onPress={() => setEnvironment('PRODUCTION')}
                  >
                    <Text
                      style={[
                        styles.environmentButtonText,
                        environment === 'PRODUCTION' && styles.environmentButtonTextActive,
                      ]}
                    >
                      Production
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.environmentButton,
                      environment === 'SANDBOX' && styles.environmentButtonActive,
                    ]}
                    onPress={() => setEnvironment('SANDBOX')}
                  >
                    <Text
                      style={[
                        styles.environmentButtonText,
                        environment === 'SANDBOX' && styles.environmentButtonTextActive,
                      ]}
                    >
                      Sandbox
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Validation Error */}
              {validationError && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color="#ff6b6b" />
                  <Text style={styles.errorText}>{validationError}</Text>
                </View>
              )}

              {/* Connect Button */}
              <TouchableOpacity
                style={[styles.connectButton, isValidating && styles.connectButtonDisabled]}
                onPress={handleConnect}
                disabled={isValidating}
                activeOpacity={0.7}
              >
                {isValidating ? (
                  <>
                    <ActivityIndicator size={20} color="#0a0a0f" />
                    <Text style={styles.connectButtonText}>Validating...</Text>
                  </>
                ) : (
                  <>
                    <Wifi size={20} color="#0a0a0f" />
                    <Text style={styles.connectButtonText}>Connect to {selectedProvider}</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Setup Instructions */}
              <View style={styles.instructionsCard}>
                <Text style={styles.instructionsTitle}>
                  {selectedProvider === 'TOAST' ? 'Toast Setup' : 'Square Setup'}
                </Text>
                {selectedProvider === 'TOAST' ? (
                  <>
                    <Text style={styles.instructionsText}>
                      1. Log in to your Toast account
                    </Text>
                    <Text style={styles.instructionsText}>
                      2. Navigate to Settings → API Access
                    </Text>
                    <Text style={styles.instructionsText}>
                      3. Generate a new API key with &quot;Orders&quot; permission
                    </Text>
                    <Text style={styles.instructionsText}>
                      4. Copy your Restaurant GUID from Settings → General
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.instructionsText}>
                      1. Log in to your Square Developer Dashboard
                    </Text>
                    <Text style={styles.instructionsText}>
                      2. Create a new application or use existing
                    </Text>
                    <Text style={styles.instructionsText}>
                      3. Copy your Access Token from Credentials
                    </Text>
                    <Text style={styles.instructionsText}>
                      4. Copy your Location ID from Locations
                    </Text>
                  </>
                )}
              </View>
            </>
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

        {/* Spend Rules Section - Only show when connected */}
        {isConnected && (
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
                      <Text style={styles.ruleThreshold}>${rule.threshold}+</Text>
                      <View style={styles.ruleBadge}>
                        <Text style={styles.ruleBadgeText}>{rule.tierUnlocked}</Text>
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

                    {rule.description && (
                      <Text style={styles.ruleDescription}>{rule.description}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
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
              When a customer makes a purchase at your venue through {integration?.provider || 'your POS'}, we
              match their card token to their VibeLink account.
            </Text>
            <Text style={styles.infoText}>
              If their spending meets a threshold, they automatically unlock the associated tier
              and server access.
            </Text>
            <Text style={styles.infoText}>
              All card data is tokenized. We never see actual card numbers.
            </Text>
            <Text style={styles.infoText}>
              {integration?.provider === 'SQUARE'
                ? 'Square webhooks provide real-time transaction updates.'
                : 'Transactions sync every 5 minutes.'}
            </Text>
          </LinearGradient>
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
  providerBadge: {
    fontSize: 12,
    color: '#a855f7',
    marginTop: 4,
    fontWeight: '600' as const,
  },
  statusDetails: {
    gap: 8,
    marginBottom: 16,
  },
  statusDetailText: {
    fontSize: 12,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 16,
    marginTop: 8,
  },
  statText: {
    fontSize: 13,
    color: '#a855f7',
    fontWeight: '600' as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  inputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#15151f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: 14,
  },
  providerSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#15151f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  providerSelectorText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600' as const,
  },
  providerOptions: {
    marginTop: 8,
    backgroundColor: '#15151f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    overflow: 'hidden',
  },
  providerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  providerOptionSelected: {
    backgroundColor: 'rgba(0, 255, 204, 0.05)',
  },
  providerOptionText: {
    fontSize: 15,
    color: '#999',
  },
  providerOptionTextSelected: {
    color: '#ff0080',
    fontWeight: '600' as const,
  },
  environmentToggle: {
    marginBottom: 16,
  },
  environmentLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '600' as const,
  },
  environmentButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  environmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#15151f',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    alignItems: 'center' as const,
  },
  environmentButtonActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderColor: '#ff0080',
  },
  environmentButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666680',
  },
  environmentButtonTextActive: {
    color: '#ff0080',
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#ff6b6b',
    lineHeight: 18,
  },
  connectButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#ff0080',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  instructionsCard: {
    backgroundColor: 'rgba(0, 255, 204, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.1)',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 6,
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
  ruleDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    fontStyle: 'italic' as const,
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
});
