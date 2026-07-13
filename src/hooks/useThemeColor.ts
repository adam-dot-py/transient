import { Colors, type ThemeColor } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Returns the appropriate color value for the current color scheme.
 *
 * If an explicit override is provided via props (light or dark key),
 * that value is used. Otherwise, the color is looked up from the
 * Colors constant using the provided colorName.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColor,
): string {
  const scheme = useColorScheme();
  const colorFromProps = props[scheme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Colors[scheme][colorName];
}
