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

import { Colors, SemanticColors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword } from '@/data/authService';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

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
    // Validate email
    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error ?? 'Invalid email');
      return;
    }
    setEmailError(null);

    // Validate password strength
    if (!passwordValidation.isValid) {
      return;
    }

    // Validate confirm password matches
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

          {error && (
            <View style={[styles.errorBanner, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                  borderColor: emailError ? semantic.statusDeclined : colors.border,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            {/* Password Requirement Indicators */}
            <View style={styles.requirements}>
              <PasswordRequirement met={hasMinLength} label="At least 8 characters" />
              <PasswordRequirement met={hasUppercase} label="1 uppercase letter" />
              <PasswordRequirement met={hasNumber} label="1 number" />
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                  borderColor: confirmPasswordError ? semantic.statusDeclined : colors.border,
                },
              ]}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textSecondary}
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

          {/* Sign Up Button */}
          <Pressable
            style={[
              styles.signUpButton,
              { backgroundColor: semantic.actionBlue },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </Pressable>

          {/* Navigate to Login */}
          <Pressable style={styles.loginLink} onPress={navigateToLogin} disabled={isLoading}>
            <Text style={[styles.loginLinkText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
              <Text style={{ color: semantic.actionBlue }}>Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.requirementRow}>
      <Text style={[styles.requirementIcon, met && styles.requirementMet]}>
        {met ? '✓' : '✗'}
      </Text>
      <Text style={[styles.requirementLabel, met && styles.requirementLabelMet]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  fieldError: {
    color: '#FF3B30',
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
    color: '#FF3B30',
    width: 16,
  },
  requirementMet: {
    color: '#34C759',
  },
  requirementLabel: {
    fontSize: 12,
    color: '#FF3B30',
  },
  requirementLabelMet: {
    color: '#34C759',
  },
  signUpButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
  },
});
