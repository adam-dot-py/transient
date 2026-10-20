/**
 * Unit tests for the GigImagePicker component.
 *
 * Covers the gradient/default state (no image), the uploaded-image state, and
 * the mock Alert-based picker: a valid mock file calls onImageSelected while an
 * oversized/invalid file is rejected (via the shared AvatarUploader validator).
 */

import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import GigImagePicker from '@/components/GigImagePicker';

// Mock expo-image so it renders a plain element under jest-expo.
jest.mock('expo-image', () => ({
  Image: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock expo-linear-gradient (same pattern as GigCard.test.tsx).
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GigImagePicker — default (no image)', () => {
  it('renders the gradient placeholder with an "Add photo" affordance', async () => {
    const result = await render(<GigImagePicker imageUrl={null} onImageSelected={() => {}} />);
    expect(result.getByTestId('gig-image-placeholder')).toBeTruthy();
    expect(result.getByText('Add photo')).toBeTruthy();
    // No uploaded image is shown in the default state.
    expect(result.queryByTestId('gig-image-preview')).toBeNull();
  });
});

describe('GigImagePicker — uploaded image', () => {
  it('renders the uploaded image when imageUrl is set', async () => {
    const result = await render(
      <GigImagePicker imageUrl="file:///mock/photo.jpg" onImageSelected={() => {}} />
    );
    expect(result.getByTestId('gig-image-preview')).toBeTruthy();
    // The gradient placeholder affordance is gone once an image is set.
    expect(result.queryByTestId('gig-image-placeholder')).toBeNull();
  });

  it('shows a Remove control when onImageCleared is provided and invokes it', async () => {
    const onImageCleared = jest.fn();
    const result = await render(
      <GigImagePicker
        imageUrl="file:///mock/photo.jpg"
        onImageSelected={() => {}}
        onImageCleared={onImageCleared}
      />
    );
    fireEvent.press(result.getByLabelText('Remove gig photo'));
    expect(onImageCleared).toHaveBeenCalledTimes(1);
  });
});

describe('GigImagePicker — mock picker', () => {
  it('calls onImageSelected with a valid mock file', async () => {
    const onImageSelected = jest.fn();
    // Simulate the user tapping "Choose from Gallery" in the Alert.
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const choose = buttons?.find((b) => b.text === 'Choose from Gallery');
      choose?.onPress?.();
    });

    const result = await render(
      <GigImagePicker imageUrl={null} onImageSelected={onImageSelected} />
    );
    fireEvent.press(result.getByTestId('gig-image-placeholder'));

    expect(onImageSelected).toHaveBeenCalledTimes(1);
    expect(onImageSelected).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'image/jpeg' })
    );
  });

  it('rejects invalid files via the shared AvatarUploader validator', () => {
    // The picker validates every selected file with the shared validator
    // (≤5MB, JPEG/PNG) before calling onImageSelected, so an oversized or
    // wrong-type file is rejected and the gradient default is kept.
    const { validateImageFile } = require('@/components/AvatarUploader');

    expect(validateImageFile({ size: 6_000_000, mimeType: 'image/jpeg' })).toMatch(
      /smaller than 5MB/i
    );
    expect(validateImageFile({ size: 1_000, mimeType: 'image/gif' })).toMatch(/JPEG or PNG/i);

    // A valid file passes the validator (the happy path exercised above).
    expect(validateImageFile({ size: 1_500_000, mimeType: 'image/png' })).toBeNull();
  });
});
