import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  X,
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  QrCode,
  Share2,
  CheckCircle2,
  Clock,
} from 'lucide-react-native';
import { useEvents } from '@/contexts/EventsContext';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import type { Ticket as TicketType, Venue } from '@/types';

export default function TicketsScreen() {
  const { userTickets, getEventById, getTicketTiersForEvent, generateTicketQR, isLoading } = useEvents();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTicketPress = (ticket: TicketType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTicket(ticket);
    setShowQRModal(true);
  };

  const handleShareTicket = (ticket: TicketType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Share Ticket',
      'Ticket transfer functionality coming soon!',
      [{ text: 'OK' }]
    );
  };

  const getTicketStatusColor = (status: TicketType['status']) => {
    switch (status) {
      case 'ACTIVE':
        return '#00ff80';
      case 'USED':
        return '#666';
      case 'TRANSFERRED':
        return '#00d4ff';
      case 'CANCELLED':
        return '#ff0000';
      default:
        return '#999';
    }
  };

  const getTicketStatusText = (status: TicketType['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'USED':
        return 'Used';
      case 'TRANSFERRED':
        return 'Transferred';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0080" />
        <Text style={styles.loadingText}>Loading tickets...</Text>
      </View>
    );
  }

  const activeTickets = userTickets.filter(t => t.status === 'ACTIVE');
  const pastTickets = userTickets.filter(t => t.status !== 'ACTIVE');

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
            <Text style={styles.headerTitle}>My Tickets</Text>
            <Text style={styles.headerSubtitle}>
              {activeTickets.length} active {activeTickets.length === 1 ? 'ticket' : 'tickets'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {userTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ticket size={64} color="#333" />
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptyText}>
              Browse events and purchase tickets to see them here
            </Text>
          </View>
        ) : (
          <>
            {/* Active Tickets */}
            {activeTickets.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Tickets</Text>
                {activeTickets.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onPress={() => handleTicketPress(ticket)}
                    onShare={() => handleShareTicket(ticket)}
                    getEventById={getEventById}
                    getTicketTiersForEvent={getTicketTiersForEvent}
                    getTicketStatusColor={getTicketStatusColor}
                    getTicketStatusText={getTicketStatusText}
                  />
                ))}
              </View>
            )}

            {/* Past Tickets */}
            {pastTickets.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Tickets</Text>
                {pastTickets.map(ticket => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onPress={() => handleTicketPress(ticket)}
                    onShare={() => handleShareTicket(ticket)}
                    getEventById={getEventById}
                    getTicketTiersForEvent={getTicketTiersForEvent}
                    getTicketStatusColor={getTicketStatusColor}
                    getTicketStatusText={getTicketStatusText}
                    isPast
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* QR Code Modal */}
      {selectedTicket && (
        <QRCodeModal
          visible={showQRModal}
          ticket={selectedTicket}
          onClose={() => {
            setShowQRModal(false);
            setTimeout(() => setSelectedTicket(null), 300);
          }}
          getEventById={getEventById}
          getTicketTiersForEvent={getTicketTiersForEvent}
          generateTicketQR={generateTicketQR}
        />
      )}
    </View>
  );
}

// ===== TICKET CARD COMPONENT =====

interface TicketCardProps {
  ticket: TicketType;
  onPress: () => void;
  onShare: () => void;
  getEventById: (id: string) => any;
  getTicketTiersForEvent: (id: string) => any[];
  getTicketStatusColor: (status: TicketType['status']) => string;
  getTicketStatusText: (status: TicketType['status']) => string;
  isPast?: boolean;
}

function TicketCard({
  ticket,
  onPress,
  onShare,
  getEventById,
  getTicketTiersForEvent,
  getTicketStatusColor,
  getTicketStatusText,
  isPast,
}: TicketCardProps) {
  const event = getEventById(ticket.eventId);
  const tiers = getTicketTiersForEvent(ticket.eventId);
  const tier = tiers.find(t => t.id === ticket.tierId);
  const venue = null as Venue | null;

  if (!event || !tier) return null;

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.ticketCard, isPast && styles.ticketCardPast]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isPast ? ['#0f0f15', '#0a0a0f'] : ['#1a1a2e', '#15151f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ticketGradient}
      >
        {/* Ticket Header */}
        <View style={styles.ticketHeader}>
          <View style={styles.ticketHeaderLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getTicketStatusColor(ticket.status) },
              ]}
            />
            <Text style={[styles.statusText, isPast && styles.statusTextPast]}>
              {getTicketStatusText(ticket.status)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <Share2 size={18} color={isPast ? '#666' : '#999'} />
          </TouchableOpacity>
        </View>

        {/* Event Image */}
        {event.imageUrl && (
          <Image
            source={{ uri: event.imageUrl }}
            style={styles.ticketImage}
            contentFit="cover"
          />
        )}

        {/* Event Info */}
        <Text style={[styles.ticketEventTitle, isPast && styles.ticketEventTitlePast]}>
          {event.title}
        </Text>

        {venue && (
          <View style={styles.ticketInfoRow}>
            <MapPin size={14} color={isPast ? '#555' : '#999'} />
            <Text style={[styles.ticketInfoText, isPast && styles.ticketInfoTextPast]}>
              {venue.name}
            </Text>
          </View>
        )}

        <View style={styles.ticketInfoRow}>
          <Calendar size={14} color={isPast ? '#555' : '#999'} />
          <Text style={[styles.ticketInfoText, isPast && styles.ticketInfoTextPast]}>
            {formattedDate} • {event.startTime}
          </Text>
        </View>

        {/* Tier Info */}
        <View style={styles.ticketTierContainer}>
          <View style={styles.ticketTierBadge}>
            <Text style={[styles.ticketTierText, isPast && styles.ticketTierTextPast]}>
              {tier.name}
            </Text>
          </View>
          <Text style={[styles.ticketPrice, isPast && styles.ticketPricePast]}>
            ${tier.price}
          </Text>
        </View>

        {/* QR Code Indicator */}
        {!isPast && ticket.status === 'ACTIVE' && (
          <View style={styles.qrIndicator}>
            <QrCode size={16} color="#00d4ff" />
            <Text style={styles.qrIndicatorText}>Tap to show QR code</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ===== QR CODE MODAL COMPONENT =====

interface QRCodeModalProps {
  visible: boolean;
  ticket: TicketType;
  onClose: () => void;
  getEventById: (id: string) => any;
  getTicketTiersForEvent: (id: string) => any[];
  generateTicketQR: (ticketId: string) => string;
}

function QRCodeModal({
  visible,
  ticket,
  onClose,
  getEventById,
  getTicketTiersForEvent,
  generateTicketQR,
}: QRCodeModalProps) {
  const event = getEventById(ticket.eventId);
  const tiers = getTicketTiersForEvent(ticket.eventId);
  const tier = tiers.find(t => t.id === ticket.tierId);
  const venue = null as Venue | null;
  const qrCode = generateTicketQR(ticket.id);

  if (!event || !tier) return null;

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#0a0a0a']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Ticket</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* QR Code */}
              <View style={styles.qrContainer}>
                <View style={styles.qrCodeBox}>
                  {ticket.status === 'ACTIVE' ? (
                    <QRCode
                      value={qrCode}
                      size={240}
                      color="#000"
                      backgroundColor="#fff"
                      logoSize={40}
                      logoMargin={4}
                      logoBackgroundColor="#fff"
                    />
                  ) : (
                    <View style={styles.qrInactive}>
                      {ticket.status === 'USED' ? (
                        <CheckCircle2 size={80} color="#00ff80" />
                      ) : (
                        <Clock size={80} color="#666" />
                      )}
                      <Text style={styles.qrInactiveText}>
                        {ticket.status === 'USED' ? 'Ticket Used' : 'Ticket Inactive'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Event Details */}
              <View style={styles.modalEventInfo}>
                <Text style={styles.modalEventTitle}>{event.title}</Text>
                {venue && (
                  <View style={styles.modalInfoRow}>
                    <MapPin size={16} color="#ff0080" />
                    <Text style={styles.modalInfoText}>{venue.name}</Text>
                  </View>
                )}
                <View style={styles.modalInfoRow}>
                  <Calendar size={16} color="#00d4ff" />
                  <Text style={styles.modalInfoText}>{formattedDate}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Clock size={16} color="#00d4ff" />
                  <Text style={styles.modalInfoText}>
                    {event.startTime} - {event.endTime}
                  </Text>
                </View>
              </View>

              {/* Tier Info */}
              <View style={styles.modalTierInfo}>
                <Text style={styles.modalTierLabel}>Ticket Type</Text>
                <Text style={styles.modalTierValue}>{tier.name}</Text>
              </View>

              {/* Ticket ID */}
              <View style={styles.modalTicketId}>
                <Text style={styles.modalTicketIdLabel}>Ticket ID</Text>
                <Text style={styles.modalTicketIdValue}>{ticket.id}</Text>
              </View>

              {/* Instructions */}
              {ticket.status === 'ACTIVE' && (
                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>Check-In Instructions</Text>
                  <Text style={styles.instructionsText}>
                    • Present this QR code at the venue entrance{'\n'}
                    • Keep screen brightness high for scanning{'\n'}
                    • Have a valid ID ready{'\n'}
                    • QR code is single-use only
                  </Text>
                </View>
              )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
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
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
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
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  ticketCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  ticketCardPast: {
    opacity: 0.6,
  },
  ticketGradient: {
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00ff80',
    textTransform: 'uppercase',
  },
  statusTextPast: {
    color: '#666',
  },
  shareButton: {
    padding: 8,
  },
  ticketImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  ticketEventTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  ticketEventTitlePast: {
    color: '#999',
  },
  ticketInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  ticketInfoText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  ticketInfoTextPast: {
    color: '#555',
  },
  ticketTierContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  ticketTierBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ticketTierText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00d4ff',
  },
  ticketTierTextPast: {
    color: '#555',
  },
  ticketPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  ticketPricePast: {
    color: '#666',
  },
  qrIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  qrIndicatorText: {
    fontSize: 12,
    color: '#00d4ff',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
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
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrCodeBox: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  qrInactive: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  qrInactiveText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  modalEventInfo: {
    marginBottom: 24,
  },
  modalEventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  modalTierInfo: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTierLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalTierValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00d4ff',
  },
  modalTicketId: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  modalTicketIdLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalTicketIdValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'monospace',
  },
  instructions: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00d4ff',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
});
