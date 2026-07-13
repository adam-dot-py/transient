import { StyleSheet, View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

/**
 * A View wrapper that automatically applies the current theme's
 * background color. Accepts optional lightColor/darkColor overrides
 * that take precedence over the token value.
 */
export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );

  return <View style={[styles.container, { backgroundColor }, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
