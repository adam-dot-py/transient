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

import { ConfirmationBanner } from '@/components/ConfirmationBanner';
import { Colors, Spacing } from '@/constants/theme';
import { useGigs } from '@/context/GigContext';
import { validateGigInput } from '@/data/gigService';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { CreateGigInput, Genre } from '@/types';

const GENRES: Genre[] = [
  'rock',
  'jazz',
  'blues',
  'electronic',
  'folk',
  'classical',
  'pop',
  'country',
];

export default function CreateGigScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const router = useRouter();
  const { createGig } = useGigs();

  const [title, setTitle] = useState('');
  const [venueName, setVenueName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pay, setPay] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBanner, setShowBanner] = useState(false);

  const handleSubmit = () => {
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
      genres: genres.length > 0 ? genres : undefined,
      pay: pay ? Number(pay) : undefined,
      description: description.trim() || undefined,
    };

    const validationError = validateGigInput(input);

    if (validationError) {
      setErrors(validationError.fields);
      return;
    }

    setErrors({});

    const result = createGig(input as CreateGigInput);

    if ('type' in result && result.type === 'validation') {
      setErrors(result.fields);
      return;
    }

    // Success
    setShowBanner(true);
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ConfirmationBanner
        message="Gig created!"
        visible={showBanner}
        durationMs={3000}
        onDismiss={handleBannerDismiss}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.heading, { color: colors.text }]}>Create Gig</Text>

        {/* Title */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            placeholder="Gig title"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Title"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Venue Name */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Venue Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={venueName}
            onChangeText={setVenueName}
            maxLength={100}
            placeholder="Venue name"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Venue Name"
          />
          {errors.venueName && <Text style={styles.errorText}>{errors.venueName}</Text>}
        </View>

        {/* Address Line 1 */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Address Line 1 *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={addressLine1}
            onChangeText={setAddressLine1}
            maxLength={100}
            placeholder="Street address"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Address Line 1"
          />
          {errors.addressLine1 && <Text style={styles.errorText}>{errors.addressLine1}</Text>}
        </View>

        {/* Address Line 2 */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Address Line 2 (optional)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={addressLine2}
            onChangeText={setAddressLine2}
            maxLength={100}
            placeholder="Suite, floor, unit"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Address Line 2"
          />
          {errors.addressLine2 && <Text style={styles.errorText}>{errors.addressLine2}</Text>}
        </View>

        {/* City */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>City *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={city}
            onChangeText={setCity}
            maxLength={50}
            placeholder="City"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="City"
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        {/* Postcode */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Postcode *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={postcode}
            onChangeText={setPostcode}
            maxLength={15}
            placeholder="Postcode"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Postcode"
          />
          {errors.postcode && <Text style={styles.errorText}>{errors.postcode}</Text>}
        </View>

        {/* Country */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Country *</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={country}
            onChangeText={setCountry}
            maxLength={60}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Country"
          />
          {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
        </View>

        {/* Date */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Date</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Date"
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Start Time */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Start Time</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:mm"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Start Time"
          />
          {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
        </View>

        {/* End Time */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="HH:mm"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="End Time"
          />
          {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
        </View>

        {/* Genre */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Genre</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.genreScroll}
            contentContainerStyle={styles.genreScrollContent}
          >
            {GENRES.map((g) => (
              <Pressable
                key={g}
                style={[
                  styles.genreChip,
                  {
                    backgroundColor:
                      genres.includes(g) ? colors.backgroundSelected : colors.backgroundElement,
                  },
                ]}
                onPress={() =>
                  setGenres((prev) =>
                    prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`Select genre ${g}`}
                accessibilityState={{ selected: genres.includes(g) }}
              >
                <Text
                  style={[
                    styles.genreChipText,
                    { color: genres.includes(g) ? colors.text : colors.textSecondary },
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {errors.genres && <Text style={styles.errorText}>{errors.genres}</Text>}
        </View>

        {/* Pay */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Pay ($)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={pay}
            onChangeText={setPay}
            keyboardType="numeric"
            placeholder="1 - 99999"
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel="Pay"
          />
          {errors.pay && <Text style={styles.errorText}>{errors.pay}</Text>}
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.backgroundElement, color: colors.text },
            ]}
            value={description}
            onChangeText={setDescription}
            maxLength={500}
            placeholder="Describe the gig..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Description"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, { backgroundColor: colors.backgroundSelected }]}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Create Gig"
        >
          <Text style={[styles.submitButtonText, { color: colors.text }]}>Create Gig</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.four,
  },
  fieldContainer: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.two + 4,
  },
  errorText: {
    // Intentional accent color: red for validation error text (no error token in theme)
    color: '#E53935',
    fontSize: 12,
    marginTop: Spacing.one,
  },
  genreScroll: {
    flexGrow: 0,
  },
  genreScrollContent: {
    gap: Spacing.two,
  },
  genreChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  genreChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
