import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import { Brand } from '@/constants/theme';

// iPhone screen corner radius (modern devices: ~44-47px)
const DEVICE_RADIUS = Platform.OS === 'ios' ? 44 : 16;

interface GradientBorderProps {
  /** Whether the gradient border is visible */
  active: boolean;
  /** Content to wrap */
  children: React.ReactNode;
  /** Border thickness in pixels. Defaults to 5. */
  thickness?: number;
}

/**
 * GradientBorder — Wraps content with a gradient border that follows
 * the device's rounded screen corners. Uses the brand gradient.
 *
 * The outer gradient has a borderRadius matching the iPhone's screen
 * curvature, so it hugs the edges naturally.
 */
export function GradientBorder({ active, children, thickness = 5 }: GradientBorderProps) {
  if (!active) {
    return <>{children}</>;
  }

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={[Brand.purple, Brand.blue, Brand.cyan, Brand.magenta, Brand.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: DEVICE_RADIUS }]}
      />
      <View style={[styles.inner, { margin: thickness, borderRadius: DEVICE_RADIUS - thickness }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
  },
});
