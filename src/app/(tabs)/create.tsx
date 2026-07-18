import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmplifyPaymentSheet } from '@/components/AmplifyPaymentSheet';
import { DateTimeField } from '@/components/DateTimeField';
import ExampleSongList from '@/components/ExampleSongList';
import GenrePicker from '@/components/GenrePicker';
import { Brand, Colors, SemanticColors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { useGigPush } from '@/context/GigPushContext';
import { validateExampleSongs, validateGigInput } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { CreateGigInput, ExampleSong, Genre, Gig } from '@/types';

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
  const { pushGig } = useGigPush();

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
  const [amplifyRadius, setAmplifyRadius] = useState(10);

  // Payment sheet
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

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

    // If Amplify is enabled, show payment sheet before creating
    if (pushNotifications) {
      setShowPaymentSheet(true);
      return;
    }

    // No Amplify — create gig directly
    finalizeGigCreation();
  };

  /** Creates the gig and optionally pushes it (called after payment or directly) */
  const finalizeGigCreation = () => {
    const input: CreateGigInput = {
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
      pay: Number(pay),
      description: description.trim() || undefined,
    };

    const result = createGig(input);

    if ('type' in result && result.type === 'validation') {
      setErrors(result.fields);
      return;
    }

    // Push the gig to matching musicians if Amplify was enabled
    if (pushNotifications && !('type' in result)) {
      pushGig(result as Gig);
    }

    // Success — offer to add to calendar
    Alert.alert('Success', 'Your gig has been created!', [
      {
        text: 'Add to Calendar',
        onPress: async () => {
          const { addGigToCalendar } = await import('@/services/calendarService');
          const added = await addGigToCalendar(result as Gig);
          if (added) {
            Alert.alert('Added', 'Gig added to your calendar.', [
              { text: 'OK', onPress: () => router.replace('/(tabs)') },
            ]);
          } else {
            router.replace('/(tabs)');
          }
        },
      },
      { text: 'Skip', onPress: () => router.replace('/(tabs)'), style: 'cancel' },
    ]);
  };

  /** Called when payment is confirmed in the AmplifyPaymentSheet */
  const handlePaymentConfirm = (_paymentIntentId: string) => {
    // Create the gig first, then dismiss the payment sheet
    finalizeGigCreation();
    setShowPaymentSheet(false);
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
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Create a Gig</Text>
        </View>

        {/* Amplify Toggle */}
        <Pressable
          onPress={() => setPushNotifications(!pushNotifications)}
          accessibilityRole="switch"
          accessibilityState={{ checked: pushNotifications }}
          accessibilityLabel="Amplify — push this gig to nearby musicians"
          style={styles.amplifyContainer}
        >
          <LinearGradient
            colors={pushNotifications ? ['#6366F1', '#8B5CF6', '#D946EF'] : [colors.backgroundElement, colors.backgroundElement]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.amplifyPill}
          >
            <Ionicons
              name="radio-outline"
              size={18}
              color={pushNotifications ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[styles.amplifyText, { color: pushNotifications ? '#FFFFFF' : colors.text }]}>
              Amplify
            </Text>
            <Text style={[styles.amplifySubtext, { color: pushNotifications ? 'rgba(255,255,255,0.8)' : colors.textSecondary }]}>
              {pushNotifications ? 'ON — pushes to musicians' : 'Push to nearby musicians'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Amplify Radius Selector — shown when Amplify is on */}
        {pushNotifications && (
          <View style={styles.radiusSection}>
            <Text style={[styles.radiusLabel, { color: colors.textSecondary }]}>
              Broadcast radius
            </Text>
            <View style={[styles.radiusRow, { backgroundColor: colors.backgroundElement }]}>
              {([5, 10, 15, 25] as const).map((miles) => {
                const isSelected = amplifyRadius === miles;
                return (
                  <Pressable
                    key={miles}
                    onPress={() => setAmplifyRadius(miles)}
                    style={[
                      styles.radiusOption,
                      isSelected && styles.radiusOptionSelected,
                      isSelected && { backgroundColor: colors.text },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${miles} mile radius`}
                  >
                    <Text
                      style={[
                        styles.radiusOptionText,
                        { color: isSelected ? colors.background : colors.textSecondary },
                      ]}
                    >
                      {miles} mi
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.radiusCost, { color: colors.textSecondary }]}>
              Amplify costs £1.79 per gig
            </Text>
          </View>
        )}

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

          <DateTimeField
            label="Date"
            mode="date"
            value={date}
            onChange={setDate}
            placeholder="Select date"
            error={errors.date}
          />

          <DateTimeField
            label="Start Time"
            mode="time"
            value={startTime}
            onChange={setStartTime}
            placeholder="Select start time"
            error={errors.startTime}
          />

          <DateTimeField
            label="End Time"
            mode="time"
            value={endTime}
            onChange={setEndTime}
            placeholder="Select end time"
            error={errors.endTime}
          />
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

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          style={styles.submitButton}
          accessibilityRole="button"
          accessibilityLabel="Create Gig"
        >
          <LinearGradient
            colors={[Brand.purple, Brand.blue, Brand.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>Create Gig</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* Amplify Payment Sheet */}
      <AmplifyPaymentSheet
        visible={showPaymentSheet}
        radius={amplifyRadius as 5 | 10 | 15 | 25}
        onSuccess={handlePaymentConfirm}
        onCancel={() => setShowPaymentSheet(false)}
      />
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.four,
  },
  amplifyContainer: {
    marginBottom: Spacing.four,
  },
  amplifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 50,
  },
  amplifyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  amplifySubtext: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  radiusSection: {
    marginTop: -Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radiusRow: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  radiusOptionSelected: {
    // backgroundColor set dynamically
  },
  radiusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  radiusCost: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
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
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: Spacing.three,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});
