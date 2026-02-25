import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Settings,
  MessageSquare,
  Calendar,
  BarChart3,
  ChevronRight,
  AlertCircle,
  Wifi,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { usePOS } from '@/contexts/POSContext';
import { useVenueManagement } from '@/contexts/VenueManagementContext';
import { Venue, VenueAnalytics } from '@/types';
import { venuesService } from '@/services/venues.service';

const { width } = Dimensions.get('window');

export default function ManagementDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [venue, setVenue] = useState<Venue | null>(null);
  const { managedVenues } = useVenueManagement();
  const { isConnected: isPOSConnected } = usePOS();

  useEffect(() => {
    if (managedVenues[0]) {
      venuesService.getVenueById(managedVenues[0]).then(v => setVenue(v)).catch(() => {});
    }
  }, [managedVenues]);

  const analytics: VenueAnalytics = {
    venueId: venue?.id || '',
    period: selectedPeriod,
    totalRevenue: 0,
    totalTransactions: 0,
    averageSpend: 0,
    uniqueGuests: 0,
    newMembers: 0,
    vipUpgrades: 0,
    peakHours: [],
    topSpenders: [],
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.venueName}>{venue?.name ?? 'My Venue'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, venue?.isOpen && styles.statusDotLive]} />
              <Text style={styles.statusText}>
                {venue?.isOpen ? 'Currently Open' : 'Closed'}
              </Text>
            </View>
            {isPOSConnected && (
              <View style={styles.toastBadge}>
                <Wifi size={14} color="#a855f7" />
                <Text style={styles.toastBadgeText}>POS Connected</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.periodSelector}>
          {(['today', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period && styles.periodTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon={<DollarSign size={24} color="#a855f7" />}
            label="Total Revenue"
            value={`$${(analytics.totalRevenue / 1000).toFixed(1)}K`}
            change="+12.5%"
            isPositive
          />
          <MetricCard
            icon={<Users size={24} color="#00d4ff" />}
            label="Unique Guests"
            value={analytics.uniqueGuests.toString()}
            change="+8.2%"
            isPositive
          />
          <MetricCard
            icon={<TrendingUp size={24} color="#ff6b9d" />}
            label="Avg Spend"
            value={`$${analytics.averageSpend}`}
            change="+5.1%"
            isPositive
          />
          <MetricCard
            icon={<Activity size={24} color="#ffa64d" />}
            label="Transactions"
            value={analytics.totalTransactions.toString()}
            change="+15.3%"
            isPositive
          />
        </View>

        <View style={styles.highlightSection}>
          <LinearGradient
            colors={['rgba(0, 255, 204, 0.1)', 'rgba(0, 212, 255, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.highlightCard}
          >
            <View style={styles.highlightHeader}>
              <AlertCircle size={20} color="#ff0080" />
              <Text style={styles.highlightTitle}>New VIP Upgrades</Text>
            </View>
            <Text style={styles.highlightValue}>{analytics.vipUpgrades}</Text>
            <Text style={styles.highlightDescription}>
              Members upgraded to VIP status today
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(255, 107, 157, 0.1)', 'rgba(255, 166, 77, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.highlightCard}
          >
            <View style={styles.highlightHeader}>
              <Users size={20} color="#ff6b9d" />
              <Text style={styles.highlightTitle}>New Members</Text>
            </View>
            <Text style={styles.highlightValue}>{analytics.newMembers}</Text>
            <Text style={styles.highlightDescription}>
              First-time visitors joined server
            </Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Management Tools</Text>

        <View style={styles.toolsGrid}>
          <ToolCard
            icon={<Wifi size={28} color="#a855f7" />}
            title="POS Integration"
            description="Toast & Square"
            onPress={() => router.push('/management/pos-integration')}
          />
          <ToolCard
            icon={<Settings size={28} color="#ff0080" />}
            title="Rules Engine"
            description="Configure automated rewards"
            onPress={() => router.push('/management/rules-engine')}
          />
          <ToolCard
            icon={<MessageSquare size={28} color="#00d4ff" />}
            title="Server Command"
            description="Moderate & broadcast"
            onPress={() => router.push('/management/server-command')}
          />
          <ToolCard
            icon={<Calendar size={28} color="#ff6b9d" />}
            title="Talent Booking"
            description="Manage performers"
            onPress={() => router.push('/management/talent-booking')}
          />
          <ToolCard
            icon={<BarChart3 size={28} color="#ffa64d" />}
            title="Analytics"
            description="Deep dive reports"
            onPress={() => router.push('/management/analytics')}
          />
        </View>

        <View style={styles.topSpenders}>
          <Text style={styles.sectionTitle}>Top Spenders Today</Text>
          {analytics.topSpenders.slice(0, 5).map((spender, index) => (
            <View key={spender.userId} style={styles.spenderRow}>
              <View style={styles.spenderRank}>
                <Text style={styles.spenderRankText}>{index + 1}</Text>
              </View>
              <View style={styles.spenderInfo}>
                <Text style={styles.spenderName}>{spender.name}</Text>
                <Text style={styles.spenderTier}>{spender.tier}</Text>
              </View>
              <Text style={styles.spenderAmount}>${spender.spend.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

function MetricCard({ icon, label, value, change, isPositive }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={[styles.metricChange, isPositive && styles.metricChangePositive]}>
        {change}
      </Text>
    </View>
  );
}

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

function ToolCard({ icon, title, description, onPress }: ToolCardProps) {
  return (
    <TouchableOpacity style={styles.toolCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.toolIcon}>{icon}</View>
      <View style={styles.toolInfo}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolDescription}>{description}</Text>
      </View>
      <ChevronRight size={20} color="#666680" />
    </TouchableOpacity>
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
  venueName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  statusDotLive: {
    backgroundColor: '#a855f7',
  },
  statusText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600' as const,
  },
  toastBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start' as const,
  },
  toastBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#a855f7',
  },
  periodSelector: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#15151f',
    alignItems: 'center' as const,
  },
  periodButtonActive: {
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666680',
  },
  periodTextActive: {
    color: '#ff0080',
  },
  metricsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    width: (width - 52) / 2,
    backgroundColor: '#15151f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  metricIcon: {
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ff6b6b',
  },
  metricChangePositive: {
    color: '#a855f7',
  },
  highlightSection: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 204, 0.2)',
  },
  highlightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  highlightValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#fff',
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  toolsGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  toolCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#15151f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    color: '#999',
  },
  topSpenders: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  spenderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#15151f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  spenderRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 204, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  spenderRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  spenderInfo: {
    flex: 1,
  },
  spenderName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  spenderTier: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500' as const,
  },
  spenderAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ff0080',
  },
  bottomPadding: {
    height: 40,
  },
});
