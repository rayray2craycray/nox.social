import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, DollarSign, TrendingUp, Users, Check, X } from 'lucide-react-native';
import { PerformerBooking } from '@/types';
import * as Haptics from 'expo-haptics';

export default function TalentBookingScreen() {
  const [bookings, setBookings] = useState<PerformerBooking[]>([]);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingBookings = bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  const pastBookings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  // Calculate total revenue from completed bookings
  const completedBookings = pastBookings.filter(b => b.status === 'COMPLETED' && b.actualRevenue);
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.actualRevenue || 0), 0);
  const totalFees = completedBookings.reduce((sum, b) => sum + b.fee, 0);
  const totalAttendance = completedBookings.reduce((sum, b) => sum + (b.attendanceGenerated || 0), 0);
  const averageROI = completedBookings.length > 0
    ? completedBookings.reduce((sum, b) => sum + ((b.actualRevenue! / b.fee - 1) * 100), 0) / completedBookings.length
    : 0;

  const confirmBooking = (bookingId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'CONFIRMED' as const } : b))
    );
  };

  const cancelBooking = (bookingId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'CANCELLED' as const } : b))
    );
  };

  const getStatusColor = (status: PerformerBooking['status']) => {
    switch (status) {
      case 'PENDING':
        return '#ffa64d';
      case 'CONFIRMED':
        return '#a855f7';
      case 'COMPLETED':
        return '#00d4ff';
      case 'CANCELLED':
        return '#ff6b6b';
      default:
        return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Talent Booking</Text>
          <Text style={styles.headerDescription}>
            Manage performer bookings and track their revenue impact
          </Text>
        </View>

        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
            onPress={() => setSelectedTab('upcoming')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming ({upcomingBookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
            onPress={() => setSelectedTab('past')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
              Past ({pastBookings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'past' && completedBookings.length > 0 && (
          <View style={styles.revenueSummary}>
            <Text style={styles.summaryTitle}>Revenue Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <DollarSign size={20} color="#00d4ff" />
                <View>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={styles.summaryValue}>${totalRevenue.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <TrendingUp size={20} color="#a855f7" />
                <View>
                  <Text style={styles.summaryLabel}>Avg ROI</Text>
                  <Text style={styles.summaryValue}>{averageROI.toFixed(0)}%</Text>
                </View>
              </View>
            </View>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Users size={20} color="#ff0080" />
                <View>
                  <Text style={styles.summaryLabel}>Total Attendance</Text>
                  <Text style={styles.summaryValue}>{totalAttendance.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.summaryItem}>
                <Calendar size={20} color="#ffa64d" />
                <View>
                  <Text style={styles.summaryLabel}>Events</Text>
                  <Text style={styles.summaryValue}>{completedBookings.length}</Text>
                </View>
              </View>
            </View>
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryFooterText}>
                Net Profit: ${(totalRevenue - totalFees).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bookingsContainer}>
          {(selectedTab === 'upcoming' ? upcomingBookings : pastBookings).map(booking => {
            return (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.performerHeader}>
                  <View style={styles.performerInfo}>
                    <Text style={styles.performerName}>Performer #{booking.performerId}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '30' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color="#ff0080" />
                    <Text style={styles.detailText}>
                      {new Date(booking.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color="#00d4ff" />
                    <Text style={styles.detailText}>
                      {booking.startTime} - {booking.endTime}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <DollarSign size={16} color="#a855f7" />
                    <Text style={styles.detailText}>Fee: ${booking.fee.toLocaleString()}</Text>
                  </View>
                </View>

                {booking.status === 'COMPLETED' && booking.actualRevenue && (
                  <View style={styles.revenueReport}>
                    <View style={styles.revenueRow}>
                      <View style={styles.revenueItem}>
                        <TrendingUp size={18} color="#a855f7" />
                        <View>
                          <Text style={styles.revenueLabel}>Revenue Generated</Text>
                          <Text style={styles.revenueValue}>
                            ${booking.actualRevenue.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.revenueItem}>
                        <Users size={18} color="#00d4ff" />
                        <View>
                          <Text style={styles.revenueLabel}>Attendance</Text>
                          <Text style={styles.revenueValue}>{booking.attendanceGenerated}</Text>
                        </View>
                      </View>
                    </View>
                    {booking.expectedRevenue && (
                      <Text style={styles.roiText}>
                        ROI: {((booking.actualRevenue / booking.fee - 1) * 100).toFixed(0)}% vs expected
                      </Text>
                    )}
                  </View>
                )}

                {booking.status === 'PENDING' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => confirmBooking(booking.id)}
                      activeOpacity={0.7}
                    >
                      <Check size={18} color="#0a0a0f" />
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => cancelBooking(booking.id)}
                      activeOpacity={0.7}
                    >
                      <X size={18} color="#ff6b6b" />
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
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
  tabSelector: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#15151f',
    alignItems: 'center' as const,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666680',
  },
  tabTextActive: {
    color: '#ff0080',
  },
  revenueSummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#15151f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: '#1f1f2e',
    padding: 12,
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  summaryFooter: {
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginTop: 4,
  },
  summaryFooterText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#00d4ff',
  },
  bookingsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#15151f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  performerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  performerImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  performerInfo: {
    flex: 1,
  },
  performerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 6,
  },
  genreRow: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  genreTag: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#ff0080',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  bookingDetails: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500' as const,
  },
  revenueReport: {
    backgroundColor: '#1f1f2e',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  revenueRow: {
    flexDirection: 'row' as const,
    gap: 16,
  },
  revenueItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  revenueLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  roiText: {
    fontSize: 12,
    color: '#a855f7',
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 16,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#ff0080',
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0a0a0f',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: '#1f1f2e',
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ff6b6b',
  },
  bottomPadding: {
    height: 40,
  },
});
