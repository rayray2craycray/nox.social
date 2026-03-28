import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Users, Sparkles } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';
import { UserRole } from '@/types';



const ROLES = [
  {
    id: 'VENUE' as UserRole,
    title: 'Venues',
    subtitle: 'Manage your nightclub',
    description: 'Access analytics, book talent, and grow your community',
    icon: Building2,
    gradient: ['#ff006e', '#8338ec'],
  },
  {
    id: 'PARTYGOER' as UserRole,
    title: 'Party-Goers',
    subtitle: 'Discover the nightlife',
    description: 'Find events, join venue servers, and connect with the scene',
    icon: Users,
    gradient: ['#ff0080', '#a855f7'],
  },
  {
    id: 'TALENT' as UserRole,
    title: 'Talents',
    subtitle: 'Promote your craft',
    description: 'Create promo videos, manage gigs, and grow your following',
    icon: Sparkles,
    gradient: ['#ffbe0b', '#fb5607'],
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { setUserRole } = useAppState();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;
    
    setUserRole(selectedRole);
    router.push('/create-account');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a0a2e', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.logo}>Nox</Text>
            <Text style={styles.tagline}>Where Nightlife Connects</Text>
          </View>

          <View style={styles.rolesContainer}>
            <Text style={styles.selectTitle}>Select Your Role</Text>
            
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <TouchableOpacity
                  key={role.id}
                  activeOpacity={0.8}
                  onPress={() => handleRoleSelect(role.id)}
                  style={styles.roleCardWrapper}
                >
                  <LinearGradient
                    colors={isSelected ? role.gradient as [string, string, ...string[]] : ['#1a1a2e', '#15152a'] as [string, string, ...string[]]}
                    style={[
                      styles.roleCard,
                      isSelected && styles.roleCardSelected,
                    ]}
                  >
                    <View style={styles.roleIconContainer}>
                      <Icon 
                        color={isSelected ? '#ffffff' : '#ff0080'} 
                        size={32} 
                        strokeWidth={2.5}
                      />
                    </View>
                    
                    <View style={styles.roleContent}>
                      <Text style={styles.roleTitle}>{role.title}</Text>
                      <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>

                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <View style={styles.selectedDot} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleContinue}
            disabled={!selectedRole}
            style={styles.continueButtonWrapper}
          >
            <LinearGradient
              colors={selectedRole ? ['#ff0080', '#a855f7'] as [string, string, ...string[]] : ['#333344', '#333344'] as [string, string, ...string[]]}
              style={[
                styles.continueButton,
                !selectedRole && styles.continueButtonDisabled,
              ]}
            >
              <Text style={[
                styles.continueButtonText,
                !selectedRole && styles.continueButtonTextDisabled,
              ]}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#ff0080',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 255, 204, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    fontSize: 16,
    color: '#8b8b9e',
    marginTop: 8,
    fontWeight: '500' as const,
  },
  rolesContainer: {
    flex: 1,
  },
  selectTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  roleCardWrapper: {
    marginBottom: 16,
  },
  roleCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  continueButtonWrapper: {
    marginBottom: 20,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
  },
  continueButtonTextDisabled: {
    color: '#666680',
  },
});
