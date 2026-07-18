import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { ALL_GENRES, GENRE_LABELS } from '@/data/genres';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Genre } from '@/types';

interface GenrePickerProps {
  selectedGenres: Genre[];
  onGenresChange: (genres: Genre[]) => void;
  error?: string;
}

/**
 * GenrePicker — Shows selected genres as removable pills with a "+" button
 * that opens a searchable modal list of all available genres.
 */
export default function GenrePicker({
  selectedGenres,
  onGenresChange,
  error,
}: GenrePickerProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const handleRemove = (genre: Genre) => {
    onGenresChange(selectedGenres.filter((g) => g !== genre));
  };

  const handleAdd = (genre: Genre) => {
    if (!selectedGenres.includes(genre)) {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const filteredGenres = ALL_GENRES.filter((genre) =>
    GENRE_LABELS[genre].toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Genres</Text>

      {/* Selected genre pills + Add button */}
      <View style={styles.pillsRow}>
        {selectedGenres.map((genre) => (
          <View key={genre} style={[styles.selectedPill, { backgroundColor: Brand.purple }]}>
            <Text style={styles.selectedPillText}>{GENRE_LABELS[genre]}</Text>
            <Pressable
              onPress={() => handleRemove(genre)}
              hitSlop={6}
              accessibilityLabel={`Remove ${GENRE_LABELS[genre]}`}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}

        {/* Add genre button */}
        <Pressable
          style={[styles.addPill, { borderColor: Brand.purple }]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add genre"
        >
          <Ionicons name="add" size={16} color={Brand.purple} />
          <Text style={[styles.addPillText, { color: Brand.purple }]}>Add</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Genre selection modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Genres</Text>
            <Pressable
              onPress={() => { setModalVisible(false); setSearch(''); }}
              accessibilityLabel="Done"
            >
              <Text style={[styles.modalDone, { color: Brand.purple }]}>Done</Text>
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search genres..."
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Genre list */}
          <FlatList
            data={filteredGenres}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedGenres.includes(item);
              return (
                <Pressable
                  style={[styles.genreRow, { borderColor: colors.border }]}
                  onPress={() => isSelected ? handleRemove(item) : handleAdd(item)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text style={[styles.genreRowText, { color: colors.text }]}>
                    {GENRE_LABELS[item]}
                  </Text>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={Brand.purple} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No genres match "{search}"
              </Text>
            }
          />
        </View>
      </Modal>
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
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  selectedPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  genreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  genreRowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    paddingTop: 32,
    fontSize: 15,
  },
});
