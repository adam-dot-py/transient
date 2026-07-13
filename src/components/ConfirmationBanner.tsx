import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';

export interface ConfirmationBannerProps {
  message: string;
  /** How long the banner stays visible before auto-dismissing (ms) */
  durationMs?: number;
  /** Whether the banner is currently visible */
  visible: boolean;
  /** Called when the banner auto-dismisses */
  onDismiss?: () => void;
}

const SLIDE_DURATION = 300;
const BANNER_HEIGHT = 60;

/**
 * Animated banner that slides in from the top and auto-dismisses
 * after `durationMs` milliseconds. Uses a green/success background
 * with white text to indicate a positive action was completed.
 */
export function ConfirmationBanner({
  message,
  durationMs = 3000,
  visible,
  onDismiss,
}: ConfirmationBannerProps) {
  const translateY = useSharedValue(-BANNER_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: SLIDE_DURATION });

      const timeout = setTimeout(() => {
        translateY.value = withTiming(
          -BANNER_HEIGHT,
          { duration: SLIDE_DURATION },
          (finished) => {
            if (finished && onDismiss) {
              runOnJS(onDismiss)();
            }
          },
        );
      }, durationMs);

      return () => clearTimeout(timeout);
    } else {
      translateY.value = withTiming(-BANNER_HEIGHT, { duration: SLIDE_DURATION });
    }
  }, [visible, durationMs, onDismiss, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

// Intentional accent colors: The ConfirmationBanner uses a green success background
// (#2E7D32) with white text (#FFFFFF) as a semantic success indicator. These are not
// part of the theme token system since no accent/status colors are defined.
const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
