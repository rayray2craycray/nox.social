/**
 * Venue Analytics — in-app dashboard for venue owners/staff.
 *
 * Phase 2 of the analytics dashboard. Same data source as the shareable web
 * page (GET /v1/venues/:id/analytics via analyticsApi), rendered natively for
 * whoever holds a VIEW_ANALYTICS role. Charts use react-native-svg (already a
 * dependency — no new native module). A "Share report" button mints the
 * magic-link web page so an owner can send their numbers to a partner.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Polyline, Circle, Rect, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Share2,
  Users,
  Repeat,
  Clock,
  UserPlus,
  Ticket as TicketIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react-native';
import { useVenueManagement } from '@/contexts/VenueManagementContext';
import { analyticsApi } from '@/services/api';
import type { VenueInsights } from '@/types';

const COLORS = {
  background: '#000000',
  surface: '#141420',
  surfaceLight: '#1e1e2d',
  text: '#ffffff',
  textSecondary: '#9a9aab',
  textFaint: '#63636f',
  accent: '#ff0080',
  cyan: '#00d4ff',
  violet: '#a855f7',
  blue: '#5b8cff',
  border: '#2a2a38',
  up: '#34c759',
  down: '#ff453a',
};

const CHART_W = Dimensions.get('window').width - 64; // screen pad 16*2 + card pad 16*2
const CHART_H = 150;

const fmt = (n: number) => (n || 0).toLocaleString('en-US');
const hourLabel = (h: number) => {
  const ap = h < 12 ? 'AM' : 'PM';
  let x = h % 12;
  if (x === 0) x = 12;
  return `${x} ${ap}`;
};

export default function VenueInsightsScreen() {
  const { venueRoles, hasPermission } = useVenueManagement();

  const venueIds = useMemo(() => {
    const ids = venueRoles
      .filter((r) => r.isActive && hasPermission(r.venueId, 'VIEW_ANALYTICS'))
      .map((r) => r.venueId);
    return Array.from(new Set(ids));
  }, [venueRoles, hasPermission]);

  const [selected, setSelected] = useState<string | undefined>(venueIds[0]);
  const venueId = selected || venueIds[0];
  const [sharing, setSharing] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<VenueInsights | undefined>({
    queryKey: ['venueAnalytics', venueId],
    queryFn: async () => {
      const res = await analyticsApi.getVenueInsights(venueId as string);
      return res.data;
    },
    enabled: !!venueId,
  });

  const onShare = async () => {
    if (!venueId) return;
    setSharing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await analyticsApi.createShareLink(venueId, 30);
      const url = res.data?.url;
      if (!url) throw new Error('no url');
      await Share.share({
        message: `${data?.venueName || 'Our'} venue report on Nox — live numbers: ${url}`,
      });
    } catch {
      Alert.alert('Could not create link', 'Please try again in a moment.');
    } finally {
      setSharing(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
        <ChevronLeft size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Venue Analytics</Text>
      <TouchableOpacity
        style={[styles.shareBtn, (!data?.hasData || sharing) && { opacity: 0.4 }]}
        onPress={onShare}
        disabled={!data?.hasData || sharing}
      >
        {sharing ? (
          <ActivityIndicator size="small" color={COLORS.accent} />
        ) : (
          <Share2 size={20} color={COLORS.accent} />
        )}
      </TouchableOpacity>
    </View>
  );

  // No venue the user can report on.
  if (venueIds.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {header}
        <View style={styles.center}>
          <BarChart3 size={56} color={COLORS.textFaint} />
          <Text style={styles.emptyTitle}>No venues to report on</Text>
          <Text style={styles.emptyBody}>
            Analytics show up here once you manage a venue with viewing access.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {header}

      {/* Venue selector (only when managing more than one) */}
      {venueIds.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {venueIds.map((id) => {
            const active = id === venueId;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelected(id)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
                  {id === venueId && data?.venueName ? data.venueName : `Venue ${id.slice(-4)}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accent} />
        }
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Couldn't load analytics</Text>
            <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : !data?.hasData ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No check-ins yet</Text>
            <Text style={styles.emptyBody}>
              As soon as guests check in at your door through Nox, this fills with live
              attendance, peak hours, returning-guest rates, and the ticket clicks Nox sends
              to your box office.
            </Text>
          </View>
        ) : (
          <Dashboard data={data} onShare={onShare} sharing={sharing} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Dashboard({
  data,
  onShare,
  sharing,
}: {
  data: VenueInsights;
  onShare: () => void;
  sharing: boolean;
}) {
  const c = data.checkIns;
  const totalRN = c.newVisitors30d + c.returningVisitors30d;
  const returnRate = totalRN > 0 ? Math.round((c.returningVisitors30d / totalRN) * 100) : 0;

  return (
    <View>
      {data.venueName ? <Text style={styles.venueName}>{data.venueName}</Text> : null}
      <Text style={styles.eyebrow}>WHAT NOX DROVE · LAST 30 DAYS</Text>

      {/* Hero KPIs */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpi, styles.kpiAccent]}>
          <Text style={styles.kpiLabel}>Check-ins · 30d</Text>
          <Text style={styles.kpiBig}>{fmt(c.last30d)}</Text>
          <View style={styles.kpiFoot}>
            <Delta pct={c.change30dPct} />
            <Text style={styles.kpiFootText}>{fmt(c.allTime)} all-time</Text>
          </View>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>Ticket clicks</Text>
          <Text style={styles.kpiBig}>{fmt(data.tickets.taps)}</Text>
          <View style={styles.kpiFoot}>
            <Text style={styles.kpiFootText}>
              {fmt(data.tickets.upcomingEvents)} upcoming event
              {data.tickets.upcomingEvents === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stat grid */}
      <View style={styles.grid}>
        <Stat icon={<Users size={16} color={COLORS.cyan} />} value={fmt(c.uniqueVisitors30d)} label="Unique guests" sub="last 30 days" />
        <Stat icon={<Repeat size={16} color={COLORS.violet} />} value={`${returnRate}%`} label="Returning" sub={`${fmt(c.returningVisitors30d)} came back`} />
        <Stat icon={<Clock size={16} color={COLORS.accent} />} value={hourLabel(data.peak.hour)} label="Peak hour" sub="when they arrive" />
        <Stat icon={<UserPlus size={16} color={COLORS.blue} />} value={fmt(data.community.size)} label="Community" sub="following on Nox" />
      </View>

      {/* Trend */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>Check-ins, last 14 nights</Text>
          <Text style={styles.panelNote}>{fmt(c.today)} today · {fmt(c.last7d)} this week</Text>
        </View>
        <TrendChart trend={data.dailyTrend} />
      </View>

      {/* Peak hours */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>When your crowd shows up</Text>
          <Text style={styles.panelNote}>peak {hourLabel(data.peak.hour)}</Text>
        </View>
        <PeakChart byHour={data.peak.byHour} peak={data.peak.hour} />
      </View>

      {/* Loyalty tiers */}
      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>Your regulars</Text>
          <Text style={styles.panelNote}>loyalty tiers</Text>
        </View>
        <TierBar tiers={data.community.tiers} size={data.community.size} />
        <Text style={styles.tierNote}>
          Guests climb tiers by showing up. Higher tiers are the regulars who keep coming back.
        </Text>
      </View>

      {/* Nox effect */}
      <View style={styles.band}>
        <Text style={[styles.eyebrow, { color: COLORS.accent }]}>THE NOX EFFECT</Text>
        <View style={styles.bandRow}>
          <View style={styles.bandItem}>
            <Text style={styles.bandValue}>{fmt(c.allTime)}</Text>
            <Text style={styles.bandLabel}>door check-ins</Text>
          </View>
          <View style={styles.bandItem}>
            <Text style={styles.bandValue}>{fmt(data.tickets.taps)}</Text>
            <Text style={styles.bandLabel}>ticket clicks driven</Text>
          </View>
          <View style={styles.bandItem}>
            <Text style={styles.bandValue}>{fmt(data.community.size)}</Text>
            <Text style={styles.bandLabel}>in your community</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.shareCta} onPress={onShare} disabled={sharing}>
        {sharing ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Share2 size={18} color="#000" />
            <Text style={styles.shareCtaText}>Share this report</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>
        Powered by Nox · numbers update live · pull down to refresh
      </Text>
    </View>
  );
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null || pct === undefined) {
    return (
      <View style={[styles.delta, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
        <Text style={[styles.deltaText, { color: COLORS.textSecondary }]}>new</Text>
      </View>
    );
  }
  const up = pct > 0;
  const flat = pct === 0;
  const color = flat ? COLORS.textSecondary : up ? COLORS.up : COLORS.down;
  const bg = flat ? 'rgba(255,255,255,0.08)' : up ? 'rgba(52,199,89,0.14)' : 'rgba(255,69,58,0.14)';
  return (
    <View style={[styles.delta, { backgroundColor: bg }]}>
      {!flat && (up ? <TrendingUp size={11} color={color} /> : <TrendingDown size={11} color={color} />)}
      <Text style={[styles.deltaText, { color }]}>{Math.abs(pct)}%</Text>
    </View>
  );
}

function Stat({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function TrendChart({ trend }: { trend: { date: string; count: number }[] }) {
  const padT = 10;
  const padB = 22;
  const n = trend.length;
  const max = Math.max(1, ...trend.map((d) => d.count));
  const px = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * CHART_W);
  const py = (v: number) => padT + (1 - v / max) * (CHART_H - padT - padB);

  const pts = trend.map((d, i) => `${px(i)},${py(d.count)}`).join(' ');
  const area = `M0,${CHART_H - padB} ${trend.map((d, i) => `L${px(i)},${py(d.count)}`).join(' ')} L${CHART_W},${CHART_H - padB} Z`;
  const last = trend[n - 1];
  const firstLabel = trend[0]?.date ? `${+trend[0].date.split('-')[1]}/${+trend[0].date.split('-')[2]}` : '';

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        {[0, 0.5, 1].map((g) => (
          <Line
            key={g}
            x1={0}
            y1={padT + g * (CHART_H - padT - padB)}
            x2={CHART_W}
            y2={padT + g * (CHART_H - padT - padB)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}
        <Path d={area} fill="rgba(255,0,128,0.18)" />
        <Polyline points={pts} fill="none" stroke={COLORS.accent} strokeWidth={2.4} strokeLinejoin="round" />
        <Circle cx={px(n - 1)} cy={py(last.count)} r={4.5} fill={COLORS.accent} stroke="#fff" strokeWidth={1.6} />
      </Svg>
      <View style={styles.axisRow}>
        <Text style={styles.axisText}>{firstLabel}</Text>
        <Text style={styles.axisText}>today</Text>
      </View>
    </View>
  );
}

function PeakChart({ byHour, peak }: { byHour: number[]; peak: number }) {
  const gap = 3;
  const barW = (CHART_W - gap * 23) / 24;
  const max = Math.max(1, ...byHour);
  const usableH = CHART_H - 22;
  const labels: [number, string][] = [
    [0, '12a'],
    [6, '6a'],
    [12, '12p'],
    [18, '6p'],
  ];
  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        {byHour.map((v, i) => {
          const h = (v / max) * usableH;
          return (
            <Rect
              key={i}
              x={i * (barW + gap)}
              y={usableH - h}
              width={barW}
              height={Math.max(h, 1)}
              rx={Math.min(2, barW / 2)}
              fill={i === peak ? COLORS.accent : 'rgba(168,85,247,0.42)'}
            />
          );
        })}
      </Svg>
      <View style={styles.peakAxis}>
        {labels.map(([h, t]) => (
          <Text key={h} style={[styles.axisText, { position: 'absolute', left: h * (barW + gap) }]}>
            {t}
          </Text>
        ))}
      </View>
    </View>
  );
}

function TierBar({
  tiers,
  size,
}: {
  tiers: VenueInsights['community']['tiers'];
  size: number;
}) {
  const defs: [keyof typeof tiers, string, string][] = [
    ['GUEST', 'Guest', '#3a3a44'],
    ['REGULAR', 'Regular', COLORS.blue],
    ['PLATINUM', 'Platinum', COLORS.violet],
    ['WHALE', 'Whale', COLORS.accent],
  ];
  const total = Math.max(size, 1);
  return (
    <View>
      <View style={styles.tierTrack}>
        {defs.map(([k, , color]) =>
          tiers[k] > 0 ? (
            <View key={k} style={{ flex: tiers[k] / total, backgroundColor: color }} />
          ) : null
        )}
      </View>
      <View style={styles.legend}>
        {defs.map(([k, label, color]) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.legendSw, { backgroundColor: color }]} />
            <Text style={styles.legendText}>
              <Text style={styles.legendNum}>{fmt(tiers[k])}</Text> {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  emptyBody: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  retry: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.surfaceLight, borderRadius: 12 },
  retryText: { color: COLORS.accent, fontWeight: '700' },

  pills: { maxHeight: 52, flexGrow: 0, marginTop: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 180,
  },
  pillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  pillText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#000' },

  venueName: { color: COLORS.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  eyebrow: { color: COLORS.textFaint, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginTop: 4, marginBottom: 16 },

  kpiRow: { flexDirection: 'row', gap: 12 },
  kpi: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  kpiAccent: { borderColor: 'rgba(255,0,128,0.35)' },
  kpiLabel: { color: COLORS.textSecondary, fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
  kpiBig: { color: COLORS.text, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  kpiFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  kpiFootText: { color: COLORS.textFaint, fontSize: 12 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  deltaText: { fontSize: 12, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  stat: {
    width: (Dimensions.get('window').width - 32 - 10) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 3,
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginTop: 6 },
  statLabel: { color: COLORS.textSecondary, fontSize: 13 },
  statSub: { color: COLORS.textFaint, fontSize: 11.5 },

  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 12,
  },
  panelHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  panelNote: { color: COLORS.textFaint, fontSize: 12 },

  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  axisText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  peakAxis: { height: 16, marginTop: 2 },

  tierTrack: { height: 16, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendSw: { width: 11, height: 11, borderRadius: 3 },
  legendText: { color: COLORS.textSecondary, fontSize: 13 },
  legendNum: { color: COLORS.text, fontWeight: '700' },
  tierNote: { color: COLORS.textFaint, fontSize: 12.5, marginTop: 14, lineHeight: 18 },

  band: {
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,0,128,0.3)',
    backgroundColor: 'rgba(255,0,128,0.08)',
  },
  bandRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  bandItem: { flex: 1 },
  bandValue: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  bandLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 5 },

  shareCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    paddingVertical: 15,
    marginTop: 20,
  },
  shareCtaText: { color: '#000', fontSize: 15, fontWeight: '700' },
  footer: { color: COLORS.textFaint, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
