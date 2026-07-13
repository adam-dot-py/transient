import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Genre } from '@/types';

const ALL_GENRES: Genre[] = [
  'rock',
  'jazz',
  'blues',
  'electronic',
  'folk',
  'classical',
  'pop',
  'country',
];

interface GenrePickerProps {
  selectedGenres: Genre[];
  onGenresChange: (genres: Genre[]) => void;
  error?: string;
}

/**
 * GenrePicker — a reusable multi-select genre picker rendered as a
 * horizontal wrapping row of tappable chips/pills.
 *
 * Used by both the Musician Profile editor and Gig Creation form.
 * Selected genres are highlighted, unselected are outlined.
 * Tapping toggles selection.
 */
export default function GenrePicker({
  selectedGenres,
  onGenresChange,
  error,
}: GenrePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const handleToggle = (genre: Genre) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Genres</Text>
      <View style={styles.chipsContainer}>
        {ALL_GENRES.map((genre) => {
          const isSelected = selectedGenres.includes(genre);
          const chipBackground = isSelected
            ? semantic.actionBlue
            : 'transparent';
          const chipBorderColor = isSelected
            ? semantic.actionBlue
            : colors.border;
          const chipTextColor = isSelected ? '#FFFFFF' : colors.text;

          return (
            <Pressable
              key={genre}
              onPress={() => handleToggle(genre)}
              style={[
                styles.chip,
                {
                  backgroundColor: chipBackground,
                  borderColor: chipBorderColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${capitalize(genre)}${isSelected ? ', selected' : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipText, { color: chipTextColor }]}>
                {capitalize(genre)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
});
