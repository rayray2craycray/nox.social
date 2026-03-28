/**
 * Business Registration Screen
 * Allows venue owners to register their business and become a venue moderator
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Globe,
  ChevronLeft,
  Check,
  AlertCircle,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useVenueManagement } from '@/contexts/VenueManagementContext';
import type { BusinessRegistrationData } from '@/types';
import {
  businessRegistrationStep1Schema,
  businessRegistrationStep2Schema,
  safeValidateData,
  venueNameSchema,
  businessEmailSchema,
  phoneSchema,
  websiteSchema,
  zipCodeSchema,
} from '@/utils/validation';

const COLORS = {
  background: '#000000',
  surface: '#1a1a1a',
  surfaceLight: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#999999',
  accent: '#ff0080',
  accentDark: '#cc0066',
  border: '#333333',
  error: '#ff3b30',
  success: '#34c759',
};

export default function BusinessRegisterScreen() {
  const { user } = useAuth();
  const { registerBusiness } = useVenueManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form data
  const [formData, setFormData] = useState<BusinessRegistrationData>({
    venueName: '',
    businessEmail: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    phone: '',
    website: '',
    businessType: 'BAR',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'valid' | 'invalid' | 'neutral'>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Real-time field validation
  const validateField = (fieldName: string, value: any) => {
    try {
      if (fieldName === 'venueName') {
        venueNameSchema.parse(value);
        setFieldStatus(prev => ({ ...prev, venueName: 'valid' }));
        setErrors(prev => ({ ...prev, venueName: '' }));
      } else if (fieldName === 'businessEmail') {
        businessEmailSchema.parse(value);
        setFieldStatus(prev => ({ ...prev, businessEmail: 'valid' }));
        setErrors(prev => ({ ...prev, businessEmail: '' }));
      } else if (fieldName === 'phone') {
        if (value) {
          phoneSchema.parse(value);
          setFieldStatus(prev => ({ ...prev, phone: 'valid' }));
        } else {
          setFieldStatus(prev => ({ ...prev, phone: 'neutral' }));
        }
        setErrors(prev => ({ ...prev, phone: '' }));
      } else if (fieldName === 'website') {
        if (value) {
          websiteSchema.parse(value);
          setFieldStatus(prev => ({ ...prev, website: 'valid' }));
        } else {
          setFieldStatus(prev => ({ ...prev, website: 'neutral' }));
        }
        setErrors(prev => ({ ...prev, website: '' }));
      } else if (fieldName === 'zipCode') {
        zipCodeSchema.parse(value);
        setFieldStatus(prev => ({ ...prev, zipCode: 'valid' }));
        setErrors(prev => ({ ...prev, zipCode: '' }));
      }
    } catch (error: any) {
      setFieldStatus(prev => ({ ...prev, [fieldName]: 'invalid' }));
      if (error.errors?.[0]?.message) {
        setErrors(prev => ({ ...prev, [fieldName]: error.errors[0].message }));
      }
    }
  };

  const validateStep1 = (): boolean => {
    const result = safeValidateData(businessRegistrationStep1Schema, {
      venueName: formData.venueName,
      businessEmail: formData.businessEmail,
      businessType: formData.businessType,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.errors.errors.forEach(err => {
        const field = err.path[0] as string;
        newErrors[field] = err.message;
        setFieldStatus(prev => ({ ...prev, [field]: 'invalid' }));
      });
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    const result = safeValidateData(businessRegistrationStep2Schema, {
      location: formData.location,
      phone: formData.phone,
      website: formData.website,
      description: formData.description,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.errors.errors.forEach(err => {
        const field = err.path.join('.');
        const displayField = field.replace('location.', '');
        newErrors[displayField] = err.message;
        setFieldStatus(prev => ({ ...prev, [displayField]: 'invalid' }));
      });
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    // Check if user is logged in
    if (!user) {
      Alert.alert(
        'Login Required',
        'You must be logged in to register a business. Please log in or create an account first.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/sign-in'),
          },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      // Call the real API
      await registerBusiness(formData);

      // Show success message
      Alert.alert(
        'Verification Email Sent!',
        `We've sent a verification email to ${formData.businessEmail}. Please check your inbox (and spam folder) and click the verification link to complete your registration.`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/business/verification-pending'),
          },
        ]
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Business registration error:', error);

      // Show specific error message if available
      const errorMessage = error?.message || 'Unable to register your business. Please try again later.';

      Alert.alert('Registration Failed', errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <>
      {/* Business Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Venue Name *</Text>
        <View style={[styles.inputContainer, errors.venueName && styles.inputError]}>
          <Building2 size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Your Venue Name"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.venueName}
            onChangeText={(text) => {
              setFormData({ ...formData, venueName: text });
              setErrors({ ...errors, venueName: '' });
            }}
            autoCapitalize="words"
          />
        </View>
        {errors.venueName && (
          <Text style={styles.errorText}>{errors.venueName}</Text>
        )}
      </View>

      {/* Business Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Email *</Text>
        <View style={[
          styles.inputContainer,
          errors.businessEmail && styles.inputError,
          fieldStatus.businessEmail === 'valid' && styles.inputValid,
        ]}>
          <Mail size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="business@venue.com"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.businessEmail}
            onChangeText={(text) => {
              setFormData({ ...formData, businessEmail: text.toLowerCase() });
              setTouched({ ...touched, businessEmail: true });
              if (text.includes('@') && text.includes('.')) {
                validateField('businessEmail', text.toLowerCase());
              } else {
                setFieldStatus(prev => ({ ...prev, businessEmail: 'neutral' }));
                setErrors(prev => ({ ...prev, businessEmail: '' }));
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, businessEmail: true });
              if (formData.businessEmail) {
                validateField('businessEmail', formData.businessEmail);
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {touched.businessEmail && fieldStatus.businessEmail === 'valid' && (
            <Check size={20} color={COLORS.success} />
          )}
          {touched.businessEmail && fieldStatus.businessEmail === 'invalid' && (
            <X size={20} color={COLORS.error} />
          )}
        </View>
        {errors.businessEmail && (
          <Text style={styles.errorText}>{errors.businessEmail}</Text>
        )}
        <Text style={styles.helperText}>
          You&apos;ll receive a verification email at this address
        </Text>
      </View>

      {/* Business Type */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Type *</Text>
        <View style={styles.businessTypeGrid}>
          {(['BAR', 'CLUB', 'LOUNGE', 'RESTAURANT', 'OTHER'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.businessTypeButton,
                formData.businessType === type && styles.businessTypeButtonActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFormData({ ...formData, businessType: type });
                setErrors({ ...errors, businessType: '' });
              }}
            >
              <Text
                style={[
                  styles.businessTypeText,
                  formData.businessType === type && styles.businessTypeTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.businessType && (
          <Text style={styles.errorText}>{errors.businessType}</Text>
        )}
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNextStep}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentDark]}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Street Address *</Text>
        <View style={[styles.inputContainer, errors.address && styles.inputError]}>
          <MapPin size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="123 Main Street"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.location.address}
            onChangeText={(text) => {
              setFormData({
                ...formData,
                location: { ...formData.location, address: text },
              });
              setErrors({ ...errors, address: '' });
            }}
            autoCapitalize="words"
          />
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>

      {/* City & State */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex2]}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={[styles.inputContainer, errors.city && styles.inputError]}
            placeholder="City"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.location.city}
            onChangeText={(text) => {
              setFormData({
                ...formData,
                location: { ...formData.location, city: text },
              });
              setErrors({ ...errors, city: '' });
            }}
            autoCapitalize="words"
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>State *</Text>
          <TextInput
            style={[styles.inputContainer, errors.state && styles.inputError]}
            placeholder="NY"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.location.state}
            onChangeText={(text) => {
              setFormData({
                ...formData,
                location: { ...formData.location, state: text.toUpperCase() },
              });
              setErrors({ ...errors, state: '' });
            }}
            maxLength={2}
            autoCapitalize="characters"
          />
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>
      </View>

      {/* ZIP Code */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>ZIP Code *</Text>
        <TextInput
          style={[styles.inputContainer, errors.zipCode && styles.inputError]}
          placeholder="10001"
          placeholderTextColor={COLORS.textSecondary}
          value={formData.location.zipCode}
          onChangeText={(text) => {
            setFormData({
              ...formData,
              location: { ...formData.location, zipCode: text },
            });
            setErrors({ ...errors, zipCode: '' });
          }}
          keyboardType="numeric"
        />
        {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
      </View>

      {/* Phone (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
          <Phone size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.phone}
            onChangeText={(text) => {
              setFormData({ ...formData, phone: text });
              setErrors({ ...errors, phone: '' });
            }}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Website (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Website (Optional)</Text>
        <View style={styles.inputContainer}>
          <Globe size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="https://yourvenue.com"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.website}
            onChangeText={(text) => setFormData({ ...formData, website: text })}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Submit Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentDark]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Check size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <ChevronLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Register Business</Text>
            <Text style={styles.headerSubtitle}>
              Step {currentStep} of 2
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: currentStep === 1 ? '50%' : '100%' },
              ]}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <AlertCircle size={20} color={COLORS.accent} />
          <Text style={styles.infoText}>
            After verification, you&apos;ll become the Head Moderator of your venue&apos;s server
            with full editing permissions.
          </Text>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backIcon: {
    padding: 4,
  },
  headerTitleContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputValid: {
    borderColor: COLORS.success,
    borderWidth: 1,
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  businessTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  businessTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  businessTypeButtonActive: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  businessTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  businessTypeTextActive: {
    color: COLORS.accent,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  nextButton: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
