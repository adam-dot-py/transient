import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExampleSongList from '@/components/ExampleSongList';
import GenrePicker from '@/components/GenrePicker';
import { Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { validateExampleSongs, validateGigInput } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { CreateGigInput, ExampleSong, Genre } from '@/types';

/**
 * Create tab screen — full multi-section gig creation form.
 *
 * Sections: Basic Info, Location, Date & Time, Genres,
 * Pay, Example Songs, Push Notifications, Submit.
 */
export default function CreateScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const semantic = SemanticColors[scheme];
  const router = useRouter();
  const { createGig } = useGigs();

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Location
  const [venueName, setVenueName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');

  // Date & Time
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Genres
  const [genres, setGenres] = useState<Genre[]>([]);

  // Pay
  const [pay, setPay] = useState('');

  // Example Songs
  const [exampleSongs, setExampleSongs] = useState<ExampleSong[]>([]);

  // Push Notifications
  const [pushNotifications, setPushNotifications] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [songsError, setSongsError] = useState<string | undefined>(undefined);

  const handleSubmit = () => {
    // Build the input
    const input: Partial<CreateGigInput> = {
      title: title.trim(),
      venueName: venueName.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      postcode: postcode.trim(),
      country: country.trim(),
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      genres,
      pay: pay ? Number(pay) : undefined,
      description: description.trim() || undefined,
    };

    // Validate gig input
    const gigValidation = validateGigInput(input);

    // Validate example songs
    const songsValidation = validateExampleSongs(exampleSongs);

    const newErrors: Record<string, string> = {};

    if (gigValidation) {
      Object.assign(newErrors, gigValidation.fields);
    }

    if (!songsValidation.isValid) {
      setSongsError(songsValidation.error);
    } else {
      setSongsError(undefined);
    }

    if (gigValidation || !songsValidation.isValid) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSongsError(undefined);

    // Submit
    const result = createGig(input as CreateGigInput);

    if ('type' in result && result.type === 'validation') {
      setErrors(result.fields);
      return;
    }

    // Success
    Alert.alert('Success', 'Your gig has been created!', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ]);
  };

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return <Text style={styles.errorText}>{errors[field]}</Text>;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Create a Gig</Text>

        {/* Section: Basic Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Info</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.title ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Gig title"
            placeholderTextColor={colors.textSecondary}
            maxLength={100}
            accessibilityLabel="Gig title"
          />
          {renderError('title')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Description (optional)
          </Text>
          <TextInput
            style={[
              styles.textArea,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you're looking for..."
            placeholderTextColor={colors.textSecondary}
            maxLength={2000}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Gig description"
          />
        </View>

        {/* Section: Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Venue Name</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.venueName ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={venueName}
            onChangeText={setVenueName}
            placeholder="e.g. The Blue Note"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Venue name"
          />
          {renderError('venueName')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Address Line 1</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.addressLine1 ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Address line 1"
          />
          {renderError('addressLine1')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Address Line 2 (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.addressLine2 ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Apt, suite, floor..."
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Address line 2"
          />
          {renderError('addressLine2')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>City</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.city ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={city}
            onChangeText={setCity}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="City"
          />
          {renderError('city')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Postcode</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.postcode ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={postcode}
            onChangeText={setPostcode}
            placeholder="Postcode"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Postcode"
          />
          {renderError('postcode')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Country</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.country ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={country}
            onChangeText={setCountry}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Country"
          />
          {renderError('country')}
        </View>

        {/* Section: Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Date & Time</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.date ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Date"
          />
          {renderError('date')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Start Time</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.startTime ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Start time"
          />
          {renderError('startTime')}

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>End Time</Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.endTime ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
            ]}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="End time"
          />
          {renderError('endTime')}
        </View>

        {/* Section: Genres */}
        <View style={styles.section}>
          <GenrePicker
            selectedGenres={genres}
            onGenresChange={setGenres}
            error={errors.genres}
          />
        </View>

        {/* Section: Pay */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pay</Text>

          <View style={styles.payRow}>
            <Text style={[styles.currencyPrefix, { color: colors.text }]}>£</Text>
            <TextInput
              style={[
                styles.payInput,
                { color: colors.text, borderColor: errors.pay ? '#FF3B30' : colors.border, backgroundColor: colors.backgroundElement },
              ]}
              value={pay}
              onChangeText={setPay}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              accessibilityLabel="Pay amount"
            />
          </View>
          {renderError('pay')}
        </View>

        {/* Section: Example Songs */}
        <View style={styles.section}>
          <ExampleSongList
            songs={exampleSongs}
            onSongsChange={setExampleSongs}
            error={songsError}
            maxSongs={10}
          />
        </View>

        {/* Section: Push Notifications */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              Send push notifications to matching musicians
            </Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: semantic.actionBlue }}
              accessibilityLabel="Send push notifications to matching musicians"
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          style={[styles.submitButton, { backgroundColor: semantic.actionBlue }]}
          accessibilityRole="button"
          accessibilityLabel="Create Gig"
        >
          <Text style={styles.submitButtonText}>Create Gig</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.four,
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 100,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '600',
  },
  payInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: {
    fontSize: 15,
    flex: 1,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});
