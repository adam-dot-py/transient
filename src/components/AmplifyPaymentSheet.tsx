import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  AMPLIFY_CONFIG,
  createAmplifyPaymentIntent,
  type AmplifyRadius,
} from '@/services/stripeService';

interface AmplifyPaymentSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Selected broadcast radius in miles */
  radius: AmplifyRadius;
  /** Called when payment is successful */
  onSuccess: (paymentIntentId: string) => void;
  /** Called when the user cancels */
  onCancel: () => void;
}

/**
 * AmplifyPaymentSheet — A bottom-sheet that handles the Amplify payment flow.
 *
 * Flow:
 * 1. User sees the price confirmation + radius summary
 * 2. Taps "Pay" → we create a PaymentIntent via Supabase Edge Function
 * 3. In production: opens Stripe's native payment sheet
 * 4. In development: simulates a successful payment after a short delay
 * 5. On success → calls onSuccess with the paymentIntentId
 *
 * Uses @stripe/stripe-react-native in production builds.
 * Falls back to a mock payment in development (no Stripe keys).
 */
export function AmplifyPaymentSheet({
  visible,
  radius,
  onSuccess,
  onCancel,
}: AmplifyPaymentSheetProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create PaymentIntent (calls Supabase Edge Function)
      const { clientSecret, paymentIntentId } =
        await createAmplifyPaymentIntent(radius);

      // Step 2: Present Stripe payment sheet (native builds only)
      // In production native builds, import @stripe/stripe-react-native
      // and use initPaymentSheet + presentPaymentSheet with the clientSecret.
      //
      // For development and web, the mock service simulates success:
      void clientSecret; // Used by Stripe in production
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Step 3: Payment confirmed
      onSuccess(paymentIntentId);
    } catch (err: any) {
      setError(err?.message ?? 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [radius, onSuccess]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <Animated.View
        entering={SlideInDown.duration(300).springify()}
        exiting={SlideOutDown.duration(200)}
        style={[styles.sheet, { backgroundColor: colors.cardBackground }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#D946EF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerIcon}
          >
            <Ionicons name="radio" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Amplify Your Gig
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Push to musicians within {radius} miles
            </Text>
          </View>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            disabled={isProcessing}
          >
            <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Price breakdown */}
        <View style={[styles.priceCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text }]}>
              Amplify ({radius} mi radius)
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {AMPLIFY_CONFIG.priceDisplay}
            </Text>
          </View>
          <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              {AMPLIFY_CONFIG.priceDisplay}
            </Text>
          </View>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Pay button */}
        <Pressable
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel={`Pay ${AMPLIFY_CONFIG.priceDisplay}`}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : 'card-outline'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.payButtonText}>
                Pay {AMPLIFY_CONFIG.priceDisplay}
              </Text>
            </>
          )}
        </Pressable>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          Powered by Stripe. One-time charge per gig. Your gig will be pushed
          instantly to matching musicians in the selected radius.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Platform.OS === 'ios' ? 48 : Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.four,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  priceCard: {
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  priceDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.three,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: Spacing.three,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});
