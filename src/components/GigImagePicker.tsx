import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { SemanticColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

import { validateImageFile } from '@/components/AvatarUploader';

interface GigImagePickerProps {
  /** Current image uri, or null to show the gradient placeholder. */
  imageUrl: string | null;
  /** Called with a validated mock file when the user picks an image. */
  onImageSelected: (file: { uri: string; size: number; mimeType: string }) => void;
  /** Called when the user clears/removes the current image. */
  onImageCleared?: () => void;
  /** Inline validation/error message. */
  error?: string;
}

/**
 * GigImagePicker — rectangular image chooser for a gig's hero/card image.
 *
 * Mirrors the mock-first pattern in AvatarUploader (no real expo-image-picker is
 * wired yet): tapping opens an Alert that returns a mock { uri, size, mimeType }
 * file, validated with AvatarUploader's shared validateImageFile (≤5MB,
 * JPEG/PNG). The image is OPTIONAL — when `imageUrl` is null the component
 * renders the SAME gradient placeholder the gig hero card / GigCard use so the
 * default is visually identical; when set it shows the uploaded image with
 * Replace and Remove controls.
 */
export default function GigImagePicker({
  imageUrl,
  onImageSelected,
  onImageCleared,
  error,
}: GigImagePickerProps) {
  const scheme = useColorScheme();
  const semantic = SemanticColors[scheme];

  const handlePick = () => {
    // TODO: Integrate expo-image-picker for real camera/gallery selection.
    // For now, simulate a gallery pick with a placeholder file (mock-first).
    Alert.alert('Add Gig Photo', 'Choose an option', [
      {
        text: 'Choose from Gallery',
        onPress: () => {
          const mockFile = {
            uri: 'file:///mock/selected-gig-image.jpg',
            size: 1_500_000,
            mimeType: 'image/jpeg',
          };

          const validationError = validateImageFile(mockFile);
          if (validationError) {
            Alert.alert('Invalid Image', validationError);
            return;
          }

          onImageSelected(mockFile);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      {imageUrl ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            testID="gig-image-preview"
          />

          {/* Edit / Remove controls overlaid on the image */}
          <View style={styles.controlsRow}>
            <Pressable
              style={styles.controlButton}
              onPress={handlePick}
              accessibilityRole="button"
              accessibilityLabel="Replace gig photo"
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
              <Text style={styles.controlText}>Replace</Text>
            </Pressable>
            {onImageCleared && (
              <Pressable
                style={styles.controlButton}
                onPress={onImageCleared}
                accessibilityRole="button"
                accessibilityLabel="Remove gig photo"
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <Text style={styles.controlText}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          onPress={handlePick}
          accessibilityRole="button"
          accessibilityLabel="Add gig photo"
          testID="gig-image-placeholder"
          style={styles.previewContainer}
        >
          {/* Same gradient placeholder the gig hero card / GigCard use. */}
          <LinearGradient
            colors={[semantic.cardImageGradientStart, semantic.cardImageGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.placeholderContent}>
            <Ionicons name="image-outline" size={32} color="#FFFFFF" />
            <Text style={styles.placeholderText}>Add photo</Text>
          </View>
        </Pressable>
      )}

      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  previewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E0E0E0',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controlsRow: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
  },
});
