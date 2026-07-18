import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword } from '@/data/authService';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // Real-time password validation
  const passwordValidation = validatePassword(password);
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      const result = validateEmail(text);
      if (result.isValid) {
        setEmailError(null);
      }
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError && text === password) {
      setConfirmPasswordError(null);
    }
  };

  const handleSignUp = async () => {
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error ?? 'Invalid email');
      return;
    }
    setEmailError(null);

    if (!passwordValidation.isValid) {
      return;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    setConfirmPasswordError(null);

    await signUp(email, password);
  };

  const navigateToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* Brand gradient background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(124, 58, 237, 0.12)', 'rgba(37, 99, 235, 0.06)', 'transparent']}
        style={styles.glowTop}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo + Title */}
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/transient-icon.svg')}
                style={styles.logoIcon}
                contentFit="contain"
                accessibilityLabel="Transient logo"
              />
              <Text style={styles.title}>Create Account</Text>
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError && styles.inputError]}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
              <View style={styles.requirements}>
                <PasswordRequirement met={hasMinLength} label="At least 8 characters" />
                <PasswordRequirement met={hasUppercase} label="1 uppercase letter" />
                <PasswordRequirement met={hasNumber} label="1 number" />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, confirmPasswordError && styles.inputError]}
                placeholder="Re-enter password"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
              {confirmPasswordError && (
                <Text style={styles.fieldError}>{confirmPasswordError}</Text>
              )}
            </View>

            {/* Sign Up Button — brand gradient */}
            <Pressable
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign Up"
            >
              <LinearGradient
                colors={[Brand.purple, Brand.blue, Brand.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signUpGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Navigate to Login */}
            <Pressable style={styles.loginLink} onPress={navigateToLogin} disabled={isLoading}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkAccent}>Log in</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[styles.requirementIcon, met && styles.requirementMet]}>
        {met ? '\u2713' : '\u2717'}
      </Text>
      <Text style={[styles.requirementLabel, met && styles.requirementLabelMet]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '35%',
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 56,
    height: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  fieldError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  requirements: {
    marginTop: 8,
    gap: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementIcon: {
    fontSize: 14,
    color: '#FF6B6B',
    width: 16,
  },
  requirementMet: {
    color: '#34C759',
  },
  requirementLabel: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  requirementLabelMet: {
    color: '#34C759',
  },
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpGradient: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  loginLinkAccent: {
    color: Brand.cyan,
    fontWeight: '600',
  },
});
