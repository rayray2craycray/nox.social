/**
 * Talent Onboarding — "become a performer" on Nox.
 *
 * Auto-approved: submitting creates a live performer profile immediately
 * (POST /content/performers/me), links it to the user, and switches the
 * account role to TALENT. Reachable from Settings → account type → Talent.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Award, Check } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import { talentApi } from '@/services/api';

const COLORS = {
  bg: '#000000',
  surface: '#141420',
  surfaceLight: '#1e1e2d',
  text: '#ffffff',
  dim: '#9a9aab',
  faint: '#63636f',
  accent: '#a855f7', // talent = violet, matching the flow chart
  border: '#2a2a38',
};

const GENRE_OPTIONS = [
  'House', 'Techno', 'Hip-Hop', 'R&B', 'Afrobeats', 'Latin',
  'Disco', 'Trance', 'Open Format', 'Amapiano', 'Reggaeton', 'EDM',
];

export default function TalentOnboardScreen() {
  const { profile, setUserRole, updateProfileDetails } = useAppState();
  const [stageName, setStageName] = useState('');
  const [bio, setBio] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [instagram, setInstagram] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleGenre = (g: string) => {
    Haptics.selectionAsync();
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const canSubmit = stageName.trim().length >= 2 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await talentApi.becomeTalent({
        stageName: stageName.trim(),
        bio: bio.trim() || undefined,
        genres: genres.length ? genres : undefined,
        homeCity: homeCity.trim() || undefined,
        socialMedia: instagram.trim() ? { instagram: instagram.trim().replace(/^@/, '') } : undefined,
      });
      if (!res?.success) throw new Error(res?.error || 'Could not create your profile');

      // Switch the account into Talent mode locally.
      setUserRole('TALENT');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "You're live 🎧",
        `${stageName.trim()} is now a performer on Nox. Fans can find and follow you, and you'll show up on the lineups you're booked for.`,
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Something went wrong', err?.message || 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Become Talent</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Award size={26} color={COLORS.accent} /></View>
            <Text style={styles.heroTitle}>Set up your performer profile</Text>
            <Text style={styles.heroSub}>
              You'll go live immediately — no approval wait. Fans can follow you, and you'll appear
              on the events you're booked for.
            </Text>
          </View>

          {/* Stage name (required) */}
          <Text style={styles.label}>Stage name <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={stageName}
            onChangeText={setStageName}
            placeholder="e.g. VESKA"
            placeholderTextColor={COLORS.faint}
            autoCapitalize="words"
            maxLength={60}
          />

          {/* Genres */}
          <Text style={styles.label}>Genres</Text>
          <View style={styles.genreWrap}>
            {GENRE_OPTIONS.map((g) => {
              const on = genres.includes(g);
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genre, on && styles.genreOn]}
                  onPress={() => toggleGenre(g)}
                >
                  {on && <Check size={13} color="#000" />}
                  <Text style={[styles.genreText, on && styles.genreTextOn]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bio */}
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell fans who you are and what you play."
            placeholderTextColor={COLORS.faint}
            multiline
            maxLength={500}
          />

          {/* Home city */}
          <Text style={styles.label}>Home city</Text>
          <TextInput
            style={styles.input}
            value={homeCity}
            onChangeText={setHomeCity}
            placeholder="e.g. Miami"
            placeholderTextColor={COLORS.faint}
            maxLength={80}
          />

          {/* Instagram */}
          <Text style={styles.label}>Instagram</Text>
          <TextInput
            style={styles.input}
            value={instagram}
            onChangeText={setInstagram}
            placeholder="@yourhandle"
            placeholderTextColor={COLORS.faint}
            autoCapitalize="none"
            maxLength={40}
          />

          <TouchableOpacity
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitText}>Go live as {stageName.trim() || 'Talent'}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.footnote}>
            You can switch back to Party-Goer anytime in Settings.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
  scroll: { padding: 20, paddingBottom: 60 },

  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(168,85,247,0.14)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  heroSub: { color: COLORS.dim, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8, maxWidth: 320 },

  label: { color: COLORS.dim, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  req: { color: COLORS.accent },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: COLORS.text,
    fontSize: 16,
  },
  textarea: { minHeight: 92, textAlignVertical: 'top' },

  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genre: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  genreOn: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  genreText: { color: COLORS.dim, fontSize: 13, fontWeight: '600' },
  genreTextOn: { color: '#000' },

  submit: {
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#000', fontSize: 16, fontWeight: '800' },
  footnote: { color: COLORS.faint, fontSize: 12.5, textAlign: 'center', marginTop: 14 },
});
