import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { Brand } from '@/constants/theme';

interface GradientIconProps {
  /** Ionicons icon name */
  name: React.ComponentProps<typeof Ionicons>['name'];
  /** Icon size */
  size: number;
  /** Whether to show gradient (active) or a plain color (inactive) */
  active: boolean;
  /** Color used when inactive */
  inactiveColor: string;
}

/**
 * GradientIcon — Renders an Ionicon with the brand gradient fill when active,
 * or a plain color when inactive.
 *
 * Uses MaskedView to apply a LinearGradient through the icon shape.
 */
export function GradientIcon({ name, size, active, inactiveColor }: GradientIconProps) {
  if (!active) {
    return <Ionicons name={name} size={size} color={inactiveColor} />;
  }

  return (
    <MaskedView
      style={{ width: size, height: size }}
      maskElement={
        <Ionicons name={name} size={size} color="#000" style={styles.mask} />
      }
    >
      <LinearGradient
        colors={[Brand.purple, Brand.blue, Brand.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
  },
});
