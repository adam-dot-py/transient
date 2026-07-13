import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AvatarUploader from '@/components/AvatarUploader';
import GenrePicker from '@/components/GenrePicker';
import MusicLinkList from '@/components/MusicLinkList';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useProfile } from '@/context/ProfileContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Genre, MusicLink } from '@/types';

interface ValidationErrors {
  displayName?: string;
  bio?: string;
  genres?: string;
}

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];

  const { profile, isLoading, error: contextError, updateProfile, uploadAvatar } = useProfile();

  // Local form state initialised from profile
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? '');
  const [genres, setGenres] = useState<Genre[]>(profile?.genres ?? []);
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>(profile?.musicLinks ?? []);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const BIO_MAX_LENGTH = 500;

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (bio.length > BIO_MAX_LENGTH) {
      newErrors.bio = `Bio must be ${BIO_MAX_LENGTH} characters or fewer`;
    }

    if (genres.length === 0) {
      newErrors.genres = 'Select at least one genre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setSaveSuccess(false);

    if (!validate()) {
      return;
    }

    updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      genres,
      musicLinks,
    });

    // If no context error after update, show success
    if (!contextError) {
      setSaveSuccess(true);
    }
  };

  const handleAvatarSelected = (file: { uri: string; size: number; mimeType: string }) => {
    uploadAvatar(file);
  };

  const handleRoleSwitch = () => {
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={semantic.actionBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={[styles.header, { color: colors.text }]}>Edit Profile</Text>

        {/* Context-level error */}
        {contextError && (
          <View style={styles.contextErrorContainer}>
            <Text style={styles.contextErrorText}>{contextError}</Text>
          </View>
        )}

        {/* Success message */}
        {saveSuccess && !contextError && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>Profile saved successfully</Text>
          </View>
        )}

        {/* Avatar Uploader */}
        <AvatarUploader
          avatarUrl={profile?.avatarUrl ?? null}
          onImageSelected={handleAvatarSelected}
        />

        {/* Display Name */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: errors.displayName ? '#FF3B30' : colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
            value={displayName}
            onChangeText={(text) => {
              setDisplayName(text);
              if (errors.displayName) {
                setErrors((prev) => ({ ...prev, displayName: undefined }));
              }
            }}
            placeholder="Your display name"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Display name"
          />
          {errors.displayName && (
            <Text style={styles.errorText}>{errors.displayName}</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[
              styles.textArea,
              {
                color: colors.text,
                borderColor: errors.bio ? '#FF3B30' : colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
            value={bio}
            onChangeText={(text) => {
              setBio(text);
              if (errors.bio) {
                setErrors((prev) => ({ ...prev, bio: undefined }));
              }
            }}
            placeholder="Tell hosts about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            maxLength={BIO_MAX_LENGTH}
            textAlignVertical="top"
            accessibilityLabel="Bio"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {bio.length}/{BIO_MAX_LENGTH}
          </Text>
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>

        {/* City */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>City</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
            value={city}
            onChangeText={setCity}
            placeholder="Your city"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="City"
          />
        </View>

        {/* Country */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Country</Text>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.backgroundElement,
              },
            ]}
            value={country}
            onChangeText={setCountry}
            placeholder="Your country"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Country"
          />
        </View>

        {/* Genre Picker */}
        <GenrePicker
          selectedGenres={genres}
          onGenresChange={(newGenres) => {
            setGenres(newGenres);
            if (errors.genres) {
              setErrors((prev) => ({ ...prev, genres: undefined }));
            }
          }}
          error={errors.genres}
        />

        {/* Music Links */}
        <MusicLinkList
          links={musicLinks}
          onLinksChange={setMusicLinks}
        />

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: semantic.actionBlue }]}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
        </Pressable>

        {/* Role Switcher */}
        <RoleSwitcher onSwitch={handleRoleSwitch} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
  },
  contextErrorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  contextErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: Spacing.two,
    borderRadius: Spacing.one,
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '500',
  },
  fieldContainer: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
