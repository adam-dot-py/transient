import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

interface DateTimeFieldProps {
  /** Label displayed above the field */
  label: string;
  /** 'date' or 'time' mode */
  mode: 'date' | 'time';
  /** Current value as a string (YYYY-MM-DD for date, HH:MM for time) */
  value: string;
  /** Called with formatted string when user selects a value */
  onChange: (formatted: string) => void;
  /** Placeholder when no value is set */
  placeholder?: string;
  /** Error message */
  error?: string;
}

/**
 * DateTimeField — A styled field that opens the native iOS/Android date or
 * time picker on tap. Shows the selected value in a pressable input-style container.
 *
 * On iOS: uses inline spinner-style picker (Apple's scroll wheel).
 * On Android: opens the native dialog picker.
 */
export function DateTimeField({
  label,
  mode,
  value,
  onChange,
  placeholder,
  error,
}: DateTimeFieldProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [showPicker, setShowPicker] = useState(false);

  // Parse current value into a Date object
  const currentDate = parseValue(value, mode);

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(formatValue(selectedDate, mode));
    }
  };

  const handleDone = () => {
    setShowPicker(false);
  };

  const displayValue = value || undefined;
  const iconName = mode === 'date' ? 'calendar-outline' : 'time-outline';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      <Pressable
        style={[
          styles.field,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: error ? '#FF3B30' : colors.border,
          },
        ]}
        onPress={() => setShowPicker(true)}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
      >
        <Ionicons name={iconName as any} size={18} color={Brand.purple} />
        <Text
          style={[
            styles.fieldText,
            { color: displayValue ? colors.text : colors.textSecondary },
          ]}
        >
          {displayValue || placeholder || (mode === 'date' ? 'Select date' : 'Select time')}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Native picker */}
      {showPicker && (
        <View>
          {Platform.OS === 'ios' && (
            <Pressable style={styles.doneButton} onPress={handleDone}>
              <Text style={[styles.doneText, { color: Brand.purple }]}>Done</Text>
            </Pressable>
          )}
          <DateTimePicker
            value={currentDate}
            mode={mode}
            display={Platform.OS === 'ios' ? (mode === 'date' ? 'inline' : 'spinner') : 'default'}
            onChange={handleChange}
            minimumDate={mode === 'date' ? new Date() : undefined}
            themeVariant={scheme}
          />
        </View>
      )}
    </View>
  );
}

function parseValue(value: string, mode: 'date' | 'time'): Date {
  if (mode === 'date' && value) {
    const parsed = new Date(value + 'T12:00:00');
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (mode === 'time' && value) {
    const [hours, minutes] = value.split(':').map(Number);
    const d = new Date();
    if (!isNaN(hours) && !isNaN(minutes)) {
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
  }
  return new Date();
}

function formatValue(date: Date, mode: 'date' | 'time'): string {
  if (mode === 'date') {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`; // HH:MM
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  fieldText: {
    flex: 1,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
