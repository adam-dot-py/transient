import type { BottomTabBarProps } from 'expo-router/tabs';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Floating, capability-gated tab bar following Apple's iOS 26 "Liquid Glass" HIG.
 *
 * Apple's design principles applied here:
 *  - The bar FLOATS above content (inset from the screen edges, fully rounded,
 *    casting a soft shadow) rather than sitting flush as an opaque dock.
 *  - It uses the REAL system glass material (`GlassView`) only where the OS can
 *    render it — iOS 26+ with `isLiquidGlassAvailable()`. Everywhere else
 *    (Android, web, iOS < 26) it degrades gracefully to the app's existing clean
 *    opaque bar, per `deployment.md`'s requireOptionalNativeModule rule.
 *  - It DEFERS TO ACCESSIBILITY: Apple requires Liquid Glass to fall back to an
 *    opaque surface when "Reduce Transparency" is on. We honor that explicitly.
 *  - The glass follows the app's own theme toggle via `colorScheme`, so it never
 *    clashes with a user-forced light/dark preference.
 *
 * This is a drop-in `tabBar={}` renderer for expo-router's <Tabs>; all screen
 * config (icons, labels, badges, hidden routes) stays in `_layout.tsx`.
 */
export default function GlassTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const isDark = scheme === 'dark';

  // Apple HIG: Liquid Glass must fall back to opaque when the user has enabled
  // Reduce Transparency. We can only know this at runtime, so we track it.
  const [reduceTransparency, setReduceTransparency] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled()
      .then((v) => mounted && setReduceTransparency(v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      (v) => setReduceTransparency(v),
    );
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);

  const useGlass = isLiquidGlassAvailable() && !reduceTransparency;

  // Bottom offset: lift the floating pill off the home indicator / nav bar.
  const bottomOffset = Math.max(insets.bottom, Spacing.two) + Spacing.one;

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];

    // expo-router implements `href: null` (e.g. Create hidden for musicians) by
    // setting `tabBarItemStyle: { display: 'none' }` and a null tabBarButton,
    // leaving the route in state. Honor that here so hidden tabs stay hidden.
    const itemStyle = StyleSheet.flatten(options.tabBarItemStyle);
    if (itemStyle?.display === 'none') {
      return null;
    }

    const label =
      options.title !== undefined ? options.title : route.name;
    const isFocused = state.index === index;
    const color = isFocused ? Brand.purple : colors.textSecondary;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    const badge = options.tabBarBadge;

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.item}
        hitSlop={8}
      >
        <View>
          {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
          {badge != null && badge !== '' ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  });

  const content = <View style={styles.row}>{items}</View>;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: bottomOffset }]}
    >
      {useGlass ? (
        <GlassView
          style={styles.pill}
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          isInteractive
        >
          {content}
        </GlassView>
      ) : (
        <View
          style={[
            styles.pill,
            styles.pillOpaque,
            {
              backgroundColor: isDark ? '#141422' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    // `bottom` is applied inline from safe-area insets.
    alignItems: 'center',
  },
  pill: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    // Soft float shadow so the pill reads as hovering above content.
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  // Opaque fallback keeps a hairline edge so the pill stays defined without glass.
  pillOpaque: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FE2C55',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
