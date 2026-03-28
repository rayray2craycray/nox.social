import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Search,
  Plus,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react-native';
import { useEvents } from '@/contexts/EventsContext';
import * as Haptics from 'expo-haptics';
import type { GuestListEntry } from '@/types';

export default function GuestListScreen() {
  const {
    guestListEntries,
    addToGuestList,
    updateGuestListStatus,
    removeFromGuestList,
    checkInFromGuestList,
  } = useEvents();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'PENDING' | 'CHECKED_IN'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Filter and search guests
  const filteredGuests = useMemo(() => {
    return guestListEntries.filter((guest) => {
      // Status filter
      if (filterStatus !== 'ALL' && guest.status !== filterStatus) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          guest.guestName.toLowerCase().includes(query) ||
          guest.guestEmail?.toLowerCase().includes(query) ||
          guest.guestPhone?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [guestListEntries, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: guestListEntries.length,
      confirmed: guestListEntries.filter(g => g.status === 'CONFIRMED').length,
      pending: guestListEntries.filter(g => g.status === 'PENDING').length,
      checkedIn: guestListEntries.filter(g => g.status === 'CHECKED_IN').length,
    };
  }, [guestListEntries]);

  const handleCheckIn = async (guest: GuestListEntry) => {
    try {
      await checkInFromGuestList(guest.id, 'venue-staff-1');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${guest.guestName} has been checked in`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to check in guest');
    }
  };

  const handleConfirm = async (guestId: string) => {
    try {
      await updateGuestListStatus(guestId, 'CONFIRMED');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRemove = (guest: GuestListEntry) => {
    Alert.alert(
      'Remove Guest',
      `Are you sure you want to remove ${guest.guestName} from the guest list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromGuestList(guest.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(10,10,15,0.95)', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Guest List</Text>
            <Text style={styles.headerSubtitle}>
              {stats.total} total • {stats.checkedIn} checked in
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.statChip, filterStatus === 'ALL' && styles.statChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus('ALL');
            }}
          >
            <Text style={[styles.statLabel, filterStatus === 'ALL' && styles.statLabelActive]}>
              All
            </Text>
            <Text style={[styles.statValue, filterStatus === 'ALL' && styles.statValueActive]}>
              {stats.total}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, filterStatus === 'CONFIRMED' && styles.statChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus('CONFIRMED');
            }}
          >
            <Text
              style={[styles.statLabel, filterStatus === 'CONFIRMED' && styles.statLabelActive]}
            >
              Confirmed
            </Text>
            <Text
              style={[styles.statValue, filterStatus === 'CONFIRMED' && styles.statValueActive]}
            >
              {stats.confirmed}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, filterStatus === 'PENDING' && styles.statChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus('PENDING');
            }}
          >
            <Text style={[styles.statLabel, filterStatus === 'PENDING' && styles.statLabelActive]}>
              Pending
            </Text>
            <Text style={[styles.statValue, filterStatus === 'PENDING' && styles.statValueActive]}>
              {stats.pending}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip, filterStatus === 'CHECKED_IN' && styles.statChipActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterStatus('CHECKED_IN');
            }}
          >
            <Text
              style={[styles.statLabel, filterStatus === 'CHECKED_IN' && styles.statLabelActive]}
            >
              Checked In
            </Text>
            <Text
              style={[styles.statValue, filterStatus === 'CHECKED_IN' && styles.statValueActive]}
            >
              {stats.checkedIn}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Guest List */}
      <ScrollView style={styles.guestList} showsVerticalScrollIndicator={false}>
        {filteredGuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color="#333" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Results' : 'No Guests'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add guests to the list to get started'}
            </Text>
          </View>
        ) : (
          filteredGuests.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onCheckIn={() => handleCheckIn(guest)}
              onConfirm={() => handleConfirm(guest.id)}
              onRemove={() => handleRemove(guest)}
            />
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Guest Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddModal(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff0080', '#a855f7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Plus size={24} color="#000" />
            <Text style={styles.addButtonText}>Add Guest</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add Guest Modal */}
      <AddGuestModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addToGuestList}
      />
    </View>
  );
}

// ===== GUEST CARD COMPONENT =====

interface GuestCardProps {
  guest: GuestListEntry;
  onCheckIn: () => void;
  onConfirm: () => void;
  onRemove: () => void;
}

function GuestCard({ guest, onCheckIn, onConfirm, onRemove }: GuestCardProps) {
  const getStatusIcon = () => {
    switch (guest.status) {
      case 'CONFIRMED':
        return <CheckCircle2 size={20} color="#00ff80" />;
      case 'PENDING':
        return <Clock size={20} color="#ffa64d" />;
      case 'CHECKED_IN':
        return <UserCheck size={20} color="#00d4ff" />;
      case 'NO_SHOW':
        return <XCircle size={20} color="#ff0000" />;
      case 'CANCELLED':
        return <XCircle size={20} color="#666" />;
      default:
        return <AlertCircle size={20} color="#999" />;
    }
  };

  const getStatusColor = () => {
    switch (guest.status) {
      case 'CONFIRMED':
        return '#00ff80';
      case 'PENDING':
        return '#ffa64d';
      case 'CHECKED_IN':
        return '#00d4ff';
      case 'NO_SHOW':
      case 'CANCELLED':
        return '#666';
      default:
        return '#999';
    }
  };

  return (
    <View style={styles.guestCard}>
      <LinearGradient colors={['#1a1a2e', '#15151f']} style={styles.guestGradient}>
        {/* Guest Info */}
        <View style={styles.guestInfo}>
          <View style={styles.guestHeader}>
            <Text style={styles.guestName}>{guest.guestName}</Text>
            <View style={[styles.statusBadge, { borderColor: getStatusColor() }]}>
              {getStatusIcon()}
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {guest.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {guest.guestEmail && (
            <Text style={styles.guestDetail}>{guest.guestEmail}</Text>
          )}
          {guest.guestPhone && (
            <Text style={styles.guestDetail}>{guest.guestPhone}</Text>
          )}

          {guest.plusOnes > 0 && (
            <View style={styles.plusOnesContainer}>
              <Users size={14} color="#999" />
              <Text style={styles.plusOnesText}>+{guest.plusOnes} guest{guest.plusOnes > 1 ? 's' : ''}</Text>
            </View>
          )}

          {guest.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{guest.notes}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.guestActions}>
          {guest.status === 'PENDING' && (
            <TouchableOpacity style={styles.actionButton} onPress={onConfirm}>
              <CheckCircle2 size={18} color="#00ff80" />
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
          )}
          {guest.status === 'CONFIRMED' && (
            <TouchableOpacity style={styles.actionButton} onPress={onCheckIn}>
              <UserCheck size={18} color="#00d4ff" />
              <Text style={styles.actionButtonText}>Check In</Text>
            </TouchableOpacity>
          )}
          {guest.status !== 'CHECKED_IN' && (
            <TouchableOpacity style={styles.actionButtonDanger} onPress={onRemove}>
              <XCircle size={18} color="#ff0080" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

// ===== ADD GUEST MODAL =====

interface AddGuestModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: any) => Promise<any>;
}

function AddGuestModal({ visible, onClose, onAdd }: AddGuestModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plusOnes, setPlusOnes] = useState('0');
  const [notes, setNotes] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Guest name is required');
      return;
    }

    try {
      await onAdd({
        venueId: 'venue-1',
        date: new Date().toISOString().split('T')[0],
        guestName: name.trim(),
        guestEmail: email.trim() || undefined,
        guestPhone: phone.trim() || undefined,
        plusOnes: parseInt(plusOnes) || 0,
        status: 'PENDING',
        addedBy: 'venue-manager-1',
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${name} has been added to the guest list`);

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setPlusOnes('0');
      setNotes('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Unable to add guest');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Guest</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Guest Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="John Doe"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="john@example.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+1 555 0100"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Plus Ones</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  value={plusOnes}
                  onChangeText={setPlusOnes}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputMultiline]}
                  placeholder="VIP friend of owner..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Add Button */}
              <TouchableOpacity style={styles.modalAddButton} onPress={handleAdd}>
                <LinearGradient
                  colors={['#ff0080', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalAddButtonGradient}
                >
                  <Plus size={20} color="#000" />
                  <Text style={styles.modalAddButtonText}>Add to Guest List</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
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
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#ff0080',
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  statsBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statChipActive: {
    borderColor: '#ff0080',
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  statLabelActive: {
    color: '#ff0080',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  statValueActive: {
    color: '#ff0080',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  guestList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  guestCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  guestGradient: {
    padding: 16,
  },
  guestInfo: {
    marginBottom: 12,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  guestName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  guestDetail: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  plusOnesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  plusOnesText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 166, 77, 0.1)',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffa64d',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 18,
  },
  guestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 128, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00ff80',
  },
  actionButtonDanger: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 128, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  bottomPadding: {
    height: 100,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  modalOverlay: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  modalCloseButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalAddButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalAddButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
});
