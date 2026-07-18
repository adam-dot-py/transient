import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Colors } from '@/constants/theme';
import { useRole } from '@/context/RoleContext';
import { useColorScheme } from '@/hooks/useColorScheme';

const COLLAPSED_SIZE = 38;
const EXPANDED_WIDTH = 160;

/**
 * RoleToggle — Animated expanding pill toggle.
 *
 * Collapsed: Shows a compact icon (music note or building).
 * Expanded: Smoothly animates wider to reveal Musician/Host options.
 *
 * Uses position: absolute on the animated view so it floats over
 * surrounding content without pushing layout.
 */
export function RoleToggle() {
  const { role, switchRole } = useRole();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [expanded, setExpanded] = useState(false);
  const width = useSharedValue(COLLAPSED_SIZE);

  const isMusician = role === 'musician';

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  const handleExpand = useCallback(() => {
    setExpanded(true);
    width.value = withTiming(EXPANDED_WIDTH, { duration: 250 });
  }, [width]);

  const handleSelect = useCallback((target: 'musician' | 'hoster') => {
    if (target !== role) {
      switchRole();
    }
    setExpanded(false);
    width.value = withTiming(COLLAPSED_SIZE, { duration: 200 });
  }, [role, switchRole, width]);

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.pill,
          { backgroundColor: colors.backgroundElement, borderColor: colors.border },
          animatedStyle,
        ]}
      >
        {!expanded ? (
          <Pressable
            style={styles.iconButton}
            onPress={handleExpand}
            accessibilityRole="button"
            accessibilityLabel={`Current: ${isMusician ? 'Musician' : 'Host'}. Tap to switch.`}
          >
            <Ionicons
              name="swap-horizontal"
              size={18}
              color={Brand.purple}
            />
          </Pressable>
        ) : (
          <View style={styles.expandedRow}>
            <Pressable
              style={[styles.option, isMusician && styles.optionActive]}
              onPress={() => handleSelect('musician')}
              accessibilityRole="radio"
              accessibilityState={{ selected: isMusician }}
            >
              <Text style={[styles.optionText, { color: isMusician ? '#FFFFFF' : colors.textSecondary }]}>
                Musician
              </Text>
            </Pressable>
            <Pressable
              style={[styles.option, !isMusician && styles.optionActive]}
              onPress={() => handleSelect('hoster')}
              accessibilityRole="radio"
              accessibilityState={{ selected: !isMusician }}
            >
              <Text style={[styles.optionText, { color: !isMusician ? '#FFFFFF' : colors.textSecondary }]}>
                Host
              </Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Fixed size in layout — the pill expands via absolute/overflow
    width: COLLAPSED_SIZE,
    height: COLLAPSED_SIZE,
    alignItems: 'flex-end',
  },
  pill: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: COLLAPSED_SIZE,
    borderRadius: COLLAPSED_SIZE / 2,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 90,
  },
  iconButton: {
    width: COLLAPSED_SIZE,
    height: COLLAPSED_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  option: {
    flex: 1,
    height: COLLAPSED_SIZE - 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (COLLAPSED_SIZE - 6) / 2,
  },
  optionActive: {
    backgroundColor: Brand.purple,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
