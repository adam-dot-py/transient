import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useProfile } from '@/context/ProfileContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Genre, MusicLink } from '@/types';

interface ValidationErrors {
  displayName?: string;
  bio?: string;
  genres?: string;
}

/**
 * Edit Profile screen — full form for updating musician profile.
 * Accessible from the Profile hub via "Edit Profile" menu item.
 */
export default function EditProfileScreen() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme];

  const { profile, error: contextError, updateProfile, uploadAvatar } = useProfile();

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
    if (!displayName.trim()) newErrors.displayName = 'Display name is required';
    if (bio.length > BIO_MAX_LENGTH) newErrors.bio = `Bio must be ${BIO_MAX_LENGTH} characters or fewer`;
    if (genres.length === 0) newErrors.genres = 'Select at least one genre';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    setSaveSuccess(false);
    if (!validate()) return;

    updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
      genres,
      musicLinks,
    });

    if (!contextError) {
      router.back();
    }
  };

  const handleAvatarSelected = (file: { uri: string; size: number; mimeType: string }) => {
    uploadAvatar(file);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Error / Success banners */}
        {contextError && (
          <View style={[styles.banner, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
            <Text style={styles.bannerError}>{contextError}</Text>
          </View>
        )}
        {saveSuccess && !contextError && (
          <View style={[styles.banner, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
            <Text style={styles.bannerSuccess}>Profile saved</Text>
          </View>
        )}

        {/* Avatar */}
        <AvatarUploader
          avatarUrl={profile?.avatarUrl ?? null}
          onImageSelected={handleAvatarSelected}
        />

        {/* Display Name */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: errors.displayName ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement }]}
            value={displayName}
            onChangeText={(t) => { setDisplayName(t); if (errors.displayName) setErrors((p) => ({ ...p, displayName: undefined })); }}
            placeholder="Your display name"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
        </View>

        {/* Bio */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: errors.bio ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement }]}
            value={bio}
            onChangeText={(t) => { setBio(t); if (errors.bio) setErrors((p) => ({ ...p, bio: undefined })); }}
            placeholder="Tell hosts about yourself..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={BIO_MAX_LENGTH}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{bio.length}/{BIO_MAX_LENGTH}</Text>
          {errors.bio && <Text style={styles.errorText}>{errors.bio}</Text>}
        </View>

        {/* City */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>City</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
            value={city}
            onChangeText={setCity}
            placeholder="Your city"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Country */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Country</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
            value={country}
            onChangeText={setCountry}
            placeholder="Your country"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Genres */}
        <GenrePicker
          selectedGenres={genres}
          onGenresChange={(g) => { setGenres(g); if (errors.genres) setErrors((p) => ({ ...p, genres: undefined })); }}
          error={errors.genres}
        />

        {/* Music Links */}
        <MusicLinkList links={musicLinks} onLinksChange={setMusicLinks} />

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          <LinearGradient
            colors={[Brand.purple, Brand.blue, Brand.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: { width: 24 },
  banner: {
    padding: Spacing.two,
    borderRadius: 8,
  },
  bannerError: { color: '#FF3B30', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  bannerSuccess: { color: '#34C759', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  fieldContainer: { gap: 4 },
  label: { fontSize: 16, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  charCount: { fontSize: 12, textAlign: 'right' },
  errorText: { fontSize: 12, color: '#FF3B30' },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
