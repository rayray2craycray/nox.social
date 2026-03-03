import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { X, QrCode, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { QRScanner } from '@/components/QRScanner';
import { useEvents } from '@/contexts/EventsContext';
import * as Haptics from 'expo-haptics';

export default function CheckInScreen() {
  const { validateQRCode, checkInWithQR } = useEvents();
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<{
    success: boolean;
    guestName?: string;
    ticketType?: string;
    timestamp: Date;
  } | null>(null);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleScanQR = async (qrCode: string) => {
    setIsProcessing(true);

    try {
      // Validate QR code first
      const validation = await validateQRCode(qrCode);

      if (!validation.valid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Invalid QR Code', validation.error || 'This QR code is not valid', [
          { text: 'OK' },
        ]);
        setIsProcessing(false);
        return;
      }

      // Check in the guest
      const checkInRecord = await checkInWithQR(qrCode, 'venue-staff-1');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setLastCheckIn({
        success: true,
        guestName: validation.ticket?.userId || 'Guest',
        ticketType: 'Standard Entry',
        timestamp: new Date(),
      });

      Alert.alert(
        'Check-In Successful!',
        'Guest has been checked in successfully.',
        [{ text: 'OK', onPress: () => setShowScanner(false) }]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Check-In Failed', error.message || 'Unable to check in guest', [
        { text: 'OK' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {showScanner ? (
        <QRScanner
          onScan={handleScanQR}
          onClose={() => setShowScanner(false)}
          isProcessing={isProcessing}
        />
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(10,10,15,0.95)', 'transparent']}
              style={styles.headerGradient}
            />
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>Check-In Scanner</Text>
                <Text style={styles.headerSubtitle}>Scan guest tickets</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Last Check-In Status */}
            {lastCheckIn && (
              <View style={styles.statusCard}>
                <LinearGradient
                  colors={
                    lastCheckIn.success
                      ? ['rgba(0, 255, 128, 0.2)', 'rgba(0, 255, 128, 0.05)']
                      : ['rgba(255, 0, 0, 0.2)', 'rgba(255, 0, 0, 0.05)']
                  }
                  style={styles.statusGradient}
                >
                  {lastCheckIn.success ? (
                    <CheckCircle2 size={48} color="#00ff80" />
                  ) : (
                    <AlertTriangle size={48} color="#ff0000" />
                  )}
                  <Text style={styles.statusTitle}>
                    {lastCheckIn.success ? 'Check-In Successful' : 'Check-In Failed'}
                  </Text>
                  {lastCheckIn.guestName && (
                    <Text style={styles.statusText}>{lastCheckIn.guestName}</Text>
                  )}
                  {lastCheckIn.ticketType && (
                    <Text style={styles.statusSubtext}>{lastCheckIn.ticketType}</Text>
                  )}
                  <Text style={styles.statusTime}>
                    {lastCheckIn.timestamp.toLocaleTimeString()}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to Check In Guests</Text>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Tap the &quot;Scan QR Code&quot; button below
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Position the guest&apos;s ticket QR code in the frame
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Wait for automatic scanning and verification
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>4</Text>
                </View>
                <Text style={styles.instructionText}>Check ID if required</Text>
              </View>
            </View>

            {/* Important Notes */}
            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Important Notes</Text>
              <Text style={styles.notesText}>
                • Each QR code can only be used once{'\n'}
                • Verify guest ID matches ticket name{'\n'}
                • Check for plus-ones if applicable{'\n'}
                • Report any suspicious activity to security
              </Text>
            </View>
          </ScrollView>

          {/* Scan Button */}
          <View style={styles.scanButtonContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowScanner(true);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00d4ff', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanButtonGradient}
              >
                <QrCode size={28} color="#000" />
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#00d4ff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  statusGradient: {
    padding: 24,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  statusTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  instructionsCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  notesCard: {
    backgroundColor: 'rgba(255, 166, 77, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 166, 77, 0.2)',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffa64d',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
  scanButtonContainer: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  scanButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
});
