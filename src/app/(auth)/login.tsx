import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signIn, signInWithProvider, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    signIn(email, password);
  };

  return (
    <View style={styles.container}>
      {/* Brand gradient background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle brand gradient glow (top area) */}
      <LinearGradient
        colors={['rgba(124, 58, 237, 0.15)', 'rgba(37, 99, 235, 0.08)', 'transparent']}
        style={styles.glowTop}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/transient-icon.svg')}
              style={styles.logoIcon}
              contentFit="contain"
              accessibilityLabel="Transient logo"
            />
            <Text style={styles.title}>TRANSIENT</Text>
            <Text style={styles.subtitle}>Connecting Artists. Venues. Moments.</Text>
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <Pressable
              style={[styles.socialButton, styles.appleButton]}
              onPress={() => signInWithProvider('apple')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Apple"
            >
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              <Text style={[styles.socialButtonText, styles.lightText]}>
                Continue with Apple
              </Text>
            </Pressable>

            <Pressable
              style={[styles.socialButton, styles.googleButton]}
              onPress={() => signInWithProvider('google')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text style={[styles.socialButtonText, styles.lightText]}>
                Continue with Google
              </Text>
            </Pressable>

            <Pressable
              style={[styles.socialButton, styles.facebookButton]}
              onPress={() => signInWithProvider('facebook')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Facebook"
            >
              <Ionicons name="logo-facebook" size={20} color="#FFFFFF" />
              <Text style={[styles.socialButtonText, styles.lightText]}>
                Continue with Facebook
              </Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email & Password Form */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
              accessibilityLabel="Password"
            />

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Sign In Button — brand gradient */}
            <Pressable
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              <LinearGradient
                colors={[Brand.purple, Brand.blue, Brand.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signInGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable accessibilityRole="link">
                <Text style={styles.footerLink}>Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    height: '40%',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginTop: 8,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  appleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  facebookButton: {
    backgroundColor: 'rgba(24,119,242,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(24,119,242,0.4)',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lightText: {
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  footerLink: {
    fontSize: 14,
    color: Brand.cyan,
    fontWeight: '600',
  },
});
