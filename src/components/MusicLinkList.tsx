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
import type { MusicLink } from '@/types';

type Platform = MusicLink['platform'];

interface MusicLinkListProps {
  links: MusicLink[];
  onLinksChange: (links: MusicLink[]) => void;
  error?: string;
  maxLinks?: number;
}

/**
 * MusicLinkList — displays and edits a list of music platform links.
 *
 * Shows existing links with platform icons and remove buttons.
 * Provides inline form to add new links with URL validation and
 * platform selection. Limited to maxLinks (default 10).
 */
export default function MusicLinkList({
  links,
  onLinksChange,
  error,
  maxLinks = 10,
}: MusicLinkListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const semantic = SemanticColors[colorScheme];

  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState<Platform>('apple_music');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const atMax = links.length >= maxLinks;

  const getPlatformIcon = (platform: Platform): keyof typeof Ionicons.glyphMap => {
    return platform === 'apple_music' ? 'musical-notes' : 'play';
  };

  const getPlatformLabel = (platform: Platform): string => {
    return platform === 'apple_music' ? 'Apple Music' : 'Google Music';
  };

  const handleRemove = (index: number) => {
    const updated = links.filter((_, i) => i !== index);
    onLinksChange(updated);
  };

  const handleAdd = () => {
    setValidationError(null);

    if (!newTitle.trim()) {
      setValidationError('Title is required');
      return;
    }

    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      setValidationError('URL must start with http:// or https://');
      return;
    }

    const newLink: MusicLink = {
      platform: newPlatform,
      url: newUrl.trim(),
      title: newTitle.trim(),
    };

    onLinksChange([...links, newLink]);
    setNewUrl('');
    setNewTitle('');
    setNewPlatform('apple_music');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewUrl('');
    setNewTitle('');
    setNewPlatform('apple_music');
    setValidationError(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Music Links</Text>

      {links.map((link, index) => (
        <View
          key={`${link.url}-${index}`}
          style={[styles.linkRow, { backgroundColor: colors.backgroundElement }]}
        >
          <Ionicons
            name={getPlatformIcon(link.platform)}
            size={20}
            color={semantic.actionBlue}
            style={styles.platformIcon}
          />
          <View style={styles.linkInfo}>
            <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
              {link.title}
            </Text>
            <Text style={[styles.linkPlatform, { color: colors.textSecondary }]}>
              {getPlatformLabel(link.platform)}
            </Text>
          </View>
          <Pressable
            onPress={() => handleRemove(index)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${link.title}`}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={22} color={semantic.statusDeclined} />
          </Pressable>
        </View>
      ))}

      {isAdding && (
        <View style={[styles.addForm, { borderColor: colors.border }]}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Platform</Text>
          <View style={styles.platformPicker}>
            <Pressable
              onPress={() => setNewPlatform('apple_music')}
              style={[
                styles.platformOption,
                {
                  backgroundColor:
                    newPlatform === 'apple_music' ? semantic.actionBlue : 'transparent',
                  borderColor:
                    newPlatform === 'apple_music' ? semantic.actionBlue : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Apple Music"
              accessibilityState={{ selected: newPlatform === 'apple_music' }}
            >
              <Ionicons
                name="musical-notes"
                size={16}
                color={newPlatform === 'apple_music' ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.platformOptionText,
                  { color: newPlatform === 'apple_music' ? '#FFFFFF' : colors.text },
                ]}
              >
                Apple Music
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setNewPlatform('google_music')}
              style={[
                styles.platformOption,
                {
                  backgroundColor:
                    newPlatform === 'google_music' ? semantic.actionBlue : 'transparent',
                  borderColor:
                    newPlatform === 'google_music' ? semantic.actionBlue : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Google Music"
              accessibilityState={{ selected: newPlatform === 'google_music' }}
            >
              <Ionicons
                name="play"
                size={16}
                color={newPlatform === 'google_music' ? '#FFFFFF' : colors.text}
              />
              <Text
                style={[
                  styles.platformOptionText,
                  { color: newPlatform === 'google_music' ? '#FFFFFF' : colors.text },
                ]}
              >
                Google Music
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="e.g. My Jazz Playlist"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Link title"
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>URL</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={newUrl}
            onChangeText={setNewUrl}
            placeholder="https://music.apple.com/..."
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="url"
            accessibilityLabel="Link URL"
          />

          {validationError && (
            <Text style={styles.validationError}>{validationError}</Text>
          )}

          <View style={styles.formActions}>
            <Pressable
              onPress={handleCancel}
              style={[styles.cancelButton, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel adding link"
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              style={[styles.confirmButton, { backgroundColor: semantic.actionBlue }]}
              accessibilityRole="button"
              accessibilityLabel="Confirm add link"
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
          accessibilityLabel="Add Link"
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
            Add Link
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  platformIcon: {
    marginRight: 10,
  },
  linkInfo: {
    flex: 1,
    marginRight: 8,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  linkPlatform: {
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
  platformPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  platformOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  platformOptionText: {
    fontSize: 13,
    fontWeight: '500',
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
