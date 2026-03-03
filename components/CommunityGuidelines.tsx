import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Heart,
  Users,
  MessageCircle,
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

interface GuidelinesSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function GuidelinesSection({ icon, title, children }: GuidelinesSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface RuleItemProps {
  allowed?: boolean;
  text: string;
}

function RuleItem({ allowed = true, text }: RuleItemProps) {
  return (
    <View style={styles.ruleItem}>
      {allowed ? (
        <CheckCircle size={18} color="#4ade80" style={styles.ruleIcon} />
      ) : (
        <XCircle size={18} color="#ff6b6b" style={styles.ruleIcon} />
      )}
      <Text style={[styles.ruleText, !allowed && styles.ruleTextProhibited]}>
        {text}
      </Text>
    </View>
  );
}

/**
 * Community Guidelines Component
 * Displays comprehensive community guidelines for the app
 * Required for App Store approval (user safety and content policies)
 */
export default function CommunityGuidelines() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#1a1a2e', '#15151f']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield size={40} color="#ff0080" />
          </View>
          <Text style={styles.title}>Community Guidelines</Text>
          <Text style={styles.subtitle}>
            Nox is a community built on respect, safety, and celebrating nightlife responsibly.
            These guidelines help ensure everyone has a great experience.
          </Text>
        </View>

        <GuidelinesSection
          icon={<Heart size={24} color="#ff0080" />}
          title="Be Respectful"
        >
          <Text style={styles.description}>
            Treat everyone with kindness and respect. We&apos;re all here to have a good time.
          </Text>
          <RuleItem allowed text="Share positive nightlife experiences" />
          <RuleItem allowed text="Engage in friendly conversations" />
          <RuleItem allowed text="Celebrate the nightlife community" />
          <RuleItem allowed={false} text="Harassment, bullying, or hate speech" />
          <RuleItem allowed={false} text="Discriminatory content based on race, gender, religion, or sexuality" />
          <RuleItem allowed={false} text="Threatening or intimidating behavior" />
        </GuidelinesSection>

        <GuidelinesSection
          icon={<Camera size={24} color="#ff0080" />}
          title="Content Standards"
        >
          <Text style={styles.description}>
            Share authentic nightlife moments while respecting venue rules and others&apos; privacy.
          </Text>
          <RuleItem allowed text="Authentic videos and photos from nightlife venues" />
          <RuleItem allowed text="Content that captures the energy and atmosphere" />
          <RuleItem allowed text="Getting permission before filming others" />
          <RuleItem allowed={false} text="Nudity or sexually explicit content" />
          <RuleItem allowed={false} text="Graphic violence or disturbing imagery" />
          <RuleItem allowed={false} text="Content that violates venue policies" />
          <RuleItem allowed={false} text="Filming people without their consent" />
        </GuidelinesSection>

        <GuidelinesSection
          icon={<Users size={24} color="#ff0080" />}
          title="Privacy & Safety"
        >
          <Text style={styles.description}>
            Protect your privacy and respect others&apos; boundaries.
          </Text>
          <RuleItem allowed text="Keep personal information private" />
          <RuleItem allowed text="Report suspicious or harmful behavior" />
          <RuleItem allowed text="Use privacy settings to control your content" />
          <RuleItem allowed={false} text="Sharing others&apos; personal information (doxxing)" />
          <RuleItem allowed={false} text="Impersonating other users or venues" />
          <RuleItem allowed={false} text="Creating fake accounts or profiles" />
        </GuidelinesSection>

        <GuidelinesSection
          icon={<MessageCircle size={24} color="#ff0080" />}
          title="Interactions"
        >
          <Text style={styles.description}>
            Connect with others authentically and appropriately.
          </Text>
          <RuleItem allowed text="Genuine conversations and connections" />
          <RuleItem allowed text="Friendly meetups and social gatherings" />
          <RuleItem allowed text="Sharing recommendations and tips" />
          <RuleItem allowed={false} text="Spam or unsolicited promotional content" />
          <RuleItem allowed={false} text="Solicitation or prostitution" />
          <RuleItem allowed={false} text="Unwanted sexual advances or messages" />
        </GuidelinesSection>

        <GuidelinesSection
          icon={<AlertTriangle size={24} color="#ff0080" />}
          title="Safety & Responsibility"
        >
          <Text style={styles.description}>
            Nox promotes responsible nightlife experiences.
          </Text>
          <RuleItem allowed text="Promoting safe and responsible behavior" />
          <RuleItem allowed text="Looking out for friends and fellow patrons" />
          <RuleItem allowed text="Following venue rules and regulations" />
          <RuleItem allowed={false} text="Encouraging illegal drug use" />
          <RuleItem allowed={false} text="Promoting dangerous or reckless behavior" />
          <RuleItem allowed={false} text="Content depicting illegal activities" />
          <RuleItem allowed={false} text="Sale of alcohol, drugs, or weapons" />
        </GuidelinesSection>

        <View style={styles.ageWarning}>
          <AlertTriangle size={20} color="#ffa64d" />
          <View style={styles.ageWarningContent}>
            <Text style={styles.ageWarningTitle}>Age Requirement</Text>
            <Text style={styles.ageWarningText}>
              You must be 18 years or older to use Nox. This app contains content related to nightlife venues,
              events, and establishments that serve alcohol.
            </Text>
          </View>
        </View>

        <View style={styles.reportSection}>
          <Shield size={24} color="#4ade80" />
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>Report Violations</Text>
            <Text style={styles.reportText}>
              If you see content or behavior that violates these guidelines, please report it immediately.
              Our moderation team reviews all reports within 24 hours.
            </Text>
            <Text style={styles.reportNote}>
              False reports may result in account restrictions.
            </Text>
          </View>
        </View>

        <View style={styles.enforcementSection}>
          <Text style={styles.enforcementTitle}>Enforcement</Text>
          <Text style={styles.enforcementText}>
            Violations of these guidelines may result in:
          </Text>
          <View style={styles.enforcementList}>
            <Text style={styles.enforcementItem}>• Content removal</Text>
            <Text style={styles.enforcementItem}>• Temporary account suspension</Text>
            <Text style={styles.enforcementItem}>• Permanent account termination</Text>
            <Text style={styles.enforcementItem}>• Report to law enforcement (for illegal activity)</Text>
          </View>
          <Text style={styles.enforcementNote}>
            The severity of the action depends on the nature and frequency of the violation.
            We review each case individually.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These guidelines are subject to change. We&apos;ll notify you of any significant updates.
          </Text>
          <Text style={styles.footerDate}>Last updated: February 7, 2026</Text>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    minHeight: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 0, 128, 0.1)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 128, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#fff',
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 10,
  },
  ruleIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  ruleTextProhibited: {
    color: '#ffb3b3',
  },
  ageWarning: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: 'rgba(255, 166, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 166, 77, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  ageWarningContent: {
    flex: 1,
  },
  ageWarningTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#ffa64d',
    marginBottom: 6,
  },
  ageWarningText: {
    fontSize: 13,
    color: '#ffa64d',
    lineHeight: 19,
  },
  reportSection: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#4ade80',
    marginBottom: 6,
  },
  reportText: {
    fontSize: 13,
    color: '#4ade80',
    lineHeight: 19,
    marginBottom: 8,
  },
  reportNote: {
    fontSize: 11,
    color: '#86efac',
    fontStyle: 'italic' as const,
  },
  enforcementSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  enforcementTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  enforcementText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  enforcementList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  enforcementItem: {
    fontSize: 14,
    color: '#ff6b6b',
    lineHeight: 24,
  },
  enforcementNote: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    fontStyle: 'italic' as const,
  },
  footer: {
    alignItems: 'center' as const,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerText: {
    fontSize: 12,
    color: '#666680',
    textAlign: 'center' as const,
    lineHeight: 18,
    marginBottom: 8,
  },
  footerDate: {
    fontSize: 11,
    color: '#666680',
  },
});
