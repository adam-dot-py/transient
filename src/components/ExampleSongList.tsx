import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Colors, SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { ExampleSong } from '@/types';

interface ExampleSongListProps {
  songs: ExampleSong[];
  onSongsChange: (songs: ExampleSong[]) => void;
  error?: string;
  maxSongs?: number;
}

/**
 * ExampleSongList — displays and edits a list of example song references.
 *
 * Shows existing songs with title, artist, and remove buttons.
 * Provides inline form to add new songs with validation.
 * Limited to maxSongs (default 10).
 */
export default function ExampleSongList({
  songs,
  onSongsChange,
  error,
  maxSongs = 10,
}: ExampleSongListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const atMax = songs.length >= maxSongs;

  const handleRemove = (id: string) => {
    const updated = songs.filter((song) => song.id !== id);
    onSongsChange(updated);
  };

  const handleAdd = () => {
    setValidationError(null);

    if (!newTitle.trim()) {
      setValidationError('Title is required');
      return;
    }

    if (!newArtist.trim()) {
      setValidationError('Artist is required');
      return;
    }

    const newSong: ExampleSong = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      artist: newArtist.trim(),
      sortOrder: songs.length,
    };

    onSongsChange([...songs, newSong]);
    setNewTitle('');
    setNewArtist('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewTitle('');
    setNewArtist('');
    setValidationError(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Example Songs</Text>

      {songs.map((song) => (
        <View
          key={song.id}
          style={[styles.songRow, { backgroundColor: colors.backgroundElement }]}
        >
          <Ionicons
            name="musical-note"
            size={20}
            color={semantic.actionBlue}
            style={styles.songIcon}
          />
          <View style={styles.songInfo}>
            <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={[styles.songArtist, { color: colors.textSecondary }]} numberOfLines={1}>
              {song.artist}
            </Text>
          </View>
          <Pressable
            onPress={() => handleRemove(song.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${song.title}`}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={semantic.statusDeclined} />
          </Pressable>
        </View>
      ))}

      {isAdding && (
        <View style={[styles.addForm, { borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="e.g. Fly Me to the Moon"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Song title"
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Artist</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={newArtist}
            onChangeText={setNewArtist}
            placeholder="e.g. Frank Sinatra"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Song artist"
          />

          {validationError && (
            <Text style={styles.validationError}>{validationError}</Text>
          )}

          <View style={styles.formActions}>
            <Pressable
              onPress={handleCancel}
              style={[styles.cancelButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel adding song"
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              style={[styles.confirmButton, { backgroundColor: semantic.actionBlue }]}
              accessibilityRole="button"
              accessibilityLabel="Confirm add song"
            >
              <Text style={styles.confirmButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>
      )}

      {!isAdding && (
        <Pressable
          onPress={() => setIsAdding(true)}
          disabled={atMax}
          style={[
            styles.addButton,
            { borderColor: atMax ? colors.border : semantic.actionBlue },
            atMax && styles.addButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add Song"
          accessibilityState={{ disabled: atMax }}
        >
          <Ionicons
            name="add"
            size={18}
            color={atMax ? colors.textSecondary : semantic.actionBlue}
          />
          <Text
            style={[
              styles.addButtonText,
              { color: atMax ? colors.textSecondary : semantic.actionBlue },
            ]}
          >
            Add Song
          </Text>
        </Pressable>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
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
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  songIcon: {
    marginRight: 10,
  },
  songInfo: {
    flex: 1,
    marginRight: 8,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  songArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  addForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  validationError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 6,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
});
