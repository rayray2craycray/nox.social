import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import { useAppState } from '@/contexts/AppStateContext';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { createAccount } = useAppState();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const validateUsername = (text: string): boolean => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(text);
  };

  const validatePassword = (text: string): boolean => {
    return text.length >= 8;
  };

  const isFormValid = 
    validateUsername(username) && 
    validatePassword(password) && 
    password === confirmPassword;

  const handleCreateAccount = () => {
    if (!isFormValid) return;

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    createAccount.mutate(
      { username, password },
      {
        onSuccess: () => {
          router.replace('/feed');
        },
        onError: (error: any) => {
          Alert.alert('Error', error.message || 'Failed to create account');
        },
      }
    );
  };

  const usernameValid = username.length === 0 || validateUsername(username);
  const passwordValid = password.length === 0 || validatePassword(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a0a2e', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              <View style={styles.header}>
                <Text style={styles.logo}>Nox</Text>
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Join the nightlife community</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <View style={[
                    styles.inputWrapper,
                    !usernameValid && styles.inputWrapperError
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Choose a unique username"
                      placeholderTextColor="#666680"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                    />
                    {validateUsername(username) && (
                      <Check color="#00ff88" size={20} />
                    )}
                  </View>
                  {username.length > 0 && !usernameValid && (
                    <Text style={styles.errorText}>
                      Username must be 3-20 characters (letters, numbers, underscore)
                    </Text>
                  )}
                  {usernameValid && username.length > 0 && (
                    <Text style={styles.successText}>Username is available</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    !passwordValid && styles.inputWrapperError
                  ]}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder="Create a secure password"
                      placeholderTextColor="#666680"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff color="#666680" size={20} />
                      ) : (
                        <Eye color="#666680" size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {password.length > 0 && !passwordValid && (
                    <Text style={styles.errorText}>
                      Password must be at least 8 characters
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    !passwordsMatch && styles.inputWrapperError
                  ]}>
                    <TextInput
                      style={[styles.input, styles.inputFlex]}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#666680"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      {showConfirmPassword ? (
                        <EyeOff color="#666680" size={20} />
                      ) : (
                        <Eye color="#666680" size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                  {passwordsMatch && confirmPassword.length > 0 && password.length > 0 && (
                    <Text style={styles.successText}>Passwords match</Text>
                  )}
                </View>

                <View style={styles.requirementsBox}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <Text style={styles.requirementItem}>• At least 8 characters</Text>
                  <Text style={styles.requirementItem}>• Letters and numbers recommended</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleCreateAccount}
                disabled={!isFormValid || createAccount.isPending}
                style={styles.createButtonWrapper}
              >
                <LinearGradient
                  colors={isFormValid ? ['#ff0080', '#a855f7'] : ['#333344', '#333344']}
                  style={[
                    styles.createButton,
                    !isFormValid && styles.createButtonDisabled,
                  ]}
                >
                  <Text style={[
                    styles.createButtonText,
                    !isFormValid && styles.createButtonTextDisabled,
                  ]}>
                    {createAccount.isPending ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#ff0080',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 255, 204, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8b8b9e',
    fontWeight: '500' as const,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  inputWrapperError: {
    borderColor: '#ff3366',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 14,
  },
  inputFlex: {
    flex: 1,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#ff3366',
    marginTop: 6,
    marginLeft: 4,
  },
  successText: {
    fontSize: 13,
    color: '#00ff88',
    marginTop: 6,
    marginLeft: 4,
  },
  requirementsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: '#8b8b9e',
    marginBottom: 4,
  },
  createButtonWrapper: {
    marginTop: 24,
    marginBottom: 24,
  },
  createButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000000',
  },
  createButtonTextDisabled: {
    color: '#666680',
  },
});
