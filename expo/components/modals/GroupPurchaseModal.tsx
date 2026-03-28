import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Users, DollarSign, Clock, Calendar } from 'lucide-react-native';
import { GroupPurchase } from '@/types';
import * as Haptics from 'expo-haptics';

interface GroupPurchaseModalProps {
  visible: boolean;
  venueId?: string;
  venueName?: string;
  onClose: () => void;
  onCreate: (purchase: Omit<GroupPurchase, 'id' | 'createdAt'>) => void;
}

export function GroupPurchaseModal({
  visible,
  venueId,
  venueName,
  onClose,
  onCreate,
}: GroupPurchaseModalProps) {
  const [ticketType, setTicketType] = useState<'ENTRY' | 'TABLE' | 'BOTTLE_SERVICE'>('ENTRY');
  const [totalAmount, setTotalAmount] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('4');
  const [expiresInHours, setExpiresInHours] = useState('48');
  const [notes, setNotes] = useState('');

  const handleCreate = () => {
    if (!totalAmount || !maxParticipants || !expiresInHours) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(totalAmount);
    const participants = parseInt(maxParticipants);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid total amount');
      return;
    }

    if (isNaN(participants) || participants < 2 || participants > 20) {
      Alert.alert('Invalid Participants', 'Please enter between 2-20 participants');
      return;
    }

    const hours = parseInt(expiresInHours);
    if (isNaN(hours) || hours < 1) {
      Alert.alert('Invalid Time', 'Please enter a valid expiration time');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    onCreate({
      initiatorId: 'user-me', // Get from auth context in real app
      venueId: venueId || 'venue-1',
      ticketType,
      totalAmount: amount,
      perPersonAmount: amount / participants,
      maxParticipants: participants,
      currentParticipants: ['user-me'],
      status: 'OPEN',
      expiresAt,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setTicketType('ENTRY');
    setTotalAmount('');
    setMaxParticipants('4');
    setExpiresInHours('48');
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const perPersonAmount = totalAmount && maxParticipants
    ? (parseFloat(totalAmount) / parseInt(maxParticipants)).toFixed(2)
    : '0.00';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Group Purchase</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {venueName && (
              <Text style={styles.venueName}>{venueName}</Text>
            )}

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Ticket Type Selector */}
              <Text style={styles.label}>Ticket Type</Text>
              <View style={styles.ticketTypeContainer}>
                {(['ENTRY', 'TABLE', 'BOTTLE_SERVICE'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.ticketTypeButton,
                      ticketType === type && styles.ticketTypeButtonActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTicketType(type);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.ticketTypeText,
                        ticketType === type && styles.ticketTypeTextActive,
                      ]}
                    >
                      {type === 'ENTRY' ? 'Entry' : type === 'TABLE' ? 'VIP Table' : 'Bottle Service'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Total Amount */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <DollarSign size={18} color="#ff0080" />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Total Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor="#666"
                    keyboardType="decimal-pad"
                    value={totalAmount}
                    onChangeText={setTotalAmount}
                  />
                </View>
              </View>

              {/* Max Participants */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Users size={18} color="#a855f7" />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Max Participants</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="4"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                  />
                </View>
              </View>

              {/* Per Person Amount (Calculated) */}
              {totalAmount && maxParticipants && (
                <View style={styles.calculatedAmount}>
                  <Text style={styles.calculatedLabel}>Per Person:</Text>
                  <Text style={styles.calculatedValue}>${perPersonAmount}</Text>
                </View>
              )}

              {/* Expires In */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Clock size={18} color="#00d4ff" />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Expires In (hours)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="48"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={expiresInHours}
                    onChangeText={setExpiresInHours}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Calendar size={18} color="#ffa64d" />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="VIP table for Friday night..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreate}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ff0080', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  <Users size={20} color="#000" />
                  <Text style={styles.createButtonText}>Create Group Purchase</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  venueName: {
    fontSize: 16,
    color: '#ff0080',
    marginBottom: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  ticketTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  ticketTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#15151f',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  ticketTypeButtonActive: {
    borderColor: '#ff0080',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  ticketTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  ticketTypeTextActive: {
    color: '#ff0080',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#15151f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  calculatedAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  calculatedLabel: {
    fontSize: 14,
    color: '#00d4ff',
    fontWeight: '600',
  },
  calculatedValue: {
    fontSize: 20,
    color: '#00d4ff',
    fontWeight: '800',
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  bottomPadding: {
    height: 40,
  },
});
