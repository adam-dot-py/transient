import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const MAX_FILE_SIZE = 5_242_880; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

interface AvatarUploaderProps {
  avatarUrl: string | null;
  onImageSelected: (file: { uri: string; size: number; mimeType: string }) => void;
  error?: string;
  size?: number; // diameter in pixels, default 120
}

/**
 * Validates a selected image file against size and MIME type constraints.
 * Returns an error message if invalid, or null if valid.
 */
function validateImageFile(file: { size: number; mimeType: string }): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    return 'Image must be JPEG or PNG format';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Image must be smaller than 5MB';
  }
  return null;
}

/**
 * AvatarUploader — circular avatar display with camera/edit overlay.
 *
 * Displays the user's avatar image (or a placeholder icon) and allows
 * tapping to pick a new image. Validates file size (≤5MB) and MIME type
 * (JPEG/PNG) before calling onImageSelected.
 */
export default function AvatarUploader({
  avatarUrl,
  onImageSelected,
  error,
  size = 120,
}: AvatarUploaderProps) {
  const handlePress = () => {
    // TODO: Integrate expo-image-picker for actual camera/gallery selection.
    // For now, simulate a gallery pick with a placeholder action.
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Choose from Gallery',
          onPress: () => {
            // Simulated file selection for mock-first development
            const mockFile = {
              uri: 'file:///mock/selected-image.jpg',
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
      ],
    );
  };

  const borderRadius = size / 2;
  const cameraIconSize = Math.round(size * 0.28);
  const cameraIconOffset = Math.round(size * 0.02);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={avatarUrl ? 'Change profile photo' : 'Add profile photo'}
        accessibilityHint="Opens image picker to select a new profile photo"
      >
        <View style={[styles.avatarContainer, { width: size, height: size, borderRadius }]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatarImage, { width: size, height: size, borderRadius }]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                { width: size, height: size, borderRadius },
              ]}
            >
              <Ionicons name="person" size={size * 0.45} color="#FFFFFF" />
            </View>
          )}

          {/* Camera/edit icon overlay */}
          <View
            style={[
              styles.cameraOverlay,
              {
                width: cameraIconSize,
                height: cameraIconSize,
                borderRadius: cameraIconSize / 2,
                bottom: cameraIconOffset,
                right: cameraIconOffset,
              },
            ]}
          >
            <Ionicons name="camera" size={cameraIconSize * 0.55} color="#FFFFFF" />
          </View>
        </View>
      </Pressable>

      {/* Error message display */}
      {error && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}

// Exported for testing
export { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, validateImageFile };

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    backgroundColor: '#E0E0E0',
  },
  placeholder: {
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    backgroundColor: '#38B5D7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#FF3B30',
    textAlign: 'center',
  },
});
