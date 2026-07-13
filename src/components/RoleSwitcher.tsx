import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useRole } from '@/context/RoleContext';
import { useThemeColor } from '@/hooks/useThemeColor';

interface RoleSwitcherProps {
  /** Optional callback invoked after the role is switched */
  onSwitch?: () => void;
}

/**
 * Displays the current user role with a button to switch between
 * "Musician" and "Hoster". Calls switchRole from RoleContext on press.
 */
export function RoleSwitcher({ onSwitch }: RoleSwitcherProps = {}) {
  const { role, switchRole } = useRole();

  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'backgroundElement');
  const buttonBackground = useThemeColor({}, 'backgroundSelected');

  const currentLabel = role === 'musician' ? 'Musician' : 'Hoster';
  const otherLabel = role === 'musician' ? 'Hoster' : 'Musician';

  return (
    <View style={[styles.container, { backgroundColor: cardBackground }]}>
      <Text style={[styles.roleLabel, { color: textColor }]}>
        {currentLabel}
      </Text>
      <Pressable
        style={[styles.switchButton, { backgroundColor: buttonBackground }]}
        onPress={() => {
          switchRole();
          onSwitch?.();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${otherLabel}`}
      >
        <Text style={[styles.buttonText, { color: secondaryTextColor }]}>
          Switch to {otherLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignSelf: 'flex-start',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
