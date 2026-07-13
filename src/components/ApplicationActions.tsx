import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { ApplicationStatus } from '@/types';

export interface ApplicationActionsProps {
  status: ApplicationStatus;
  onApprove: () => void;
  onDeny: () => void;
}

/**
 * ApplicationActions — approve/deny buttons for host view.
 *
 * Buttons are disabled when the application is no longer pending
 * (already accepted or declined).
 */
export default function ApplicationActions({
  status,
  onApprove,
  onDeny,
}: ApplicationActionsProps) {
  const isDisabled = status !== 'pending';

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, styles.approveButton, isDisabled && styles.disabledButton]}
        onPress={onApprove}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel="Approve application"
        accessibilityState={{ disabled: isDisabled }}
      >
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={styles.buttonText}>Approve</Text>
      </Pressable>

      <Pressable
        style={[styles.button, styles.denyButton, isDisabled && styles.disabledButton]}
        onPress={onDeny}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel="Deny application"
        accessibilityState={{ disabled: isDisabled }}
      >
        <Ionicons name="close-circle" size={18} color="#FFFFFF" />
        <Text style={styles.buttonText}>Deny</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  denyButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
