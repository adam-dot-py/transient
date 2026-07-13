/**
 * Unit tests for the LocationMap component.
 * Verifies props passed to MapView and Marker, non-interactive flags,
 * and container dimensions.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.7
 */

import { render } from '@testing-library/react-native';

import LocationMap from '@/components/LocationMap';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');

  const MockMapView = ({ children, testID, ...props }: any) => (
    <View testID={testID || 'map-view'} {...props}>
      {children}
    </View>
  );

  const MockMarker = (props: any) => {
    const { View: V } = require('react-native');
    return <V testID="map-marker" {...props} />;
  };

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
  };
});

// ─── MapView initialRegion ───────────────────────────────────────────────────

describe('LocationMap — initialRegion', () => {
  it('passes the correct initialRegion with lat, lng, and deltas of 0.01', async () => {
    const result = await render(
      <LocationMap latitude={36.16} longitude={-86.78} />
    );

    const mapView = result.getByTestId('map-view');

    expect(mapView.props.initialRegion).toEqual({
      latitude: 36.16,
      longitude: -86.78,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  });
});

// ─── Marker coordinate ───────────────────────────────────────────────────────

describe('LocationMap — Marker', () => {
  it('renders a Marker with the correct coordinate prop', async () => {
    const result = await render(
      <LocationMap latitude={51.5074} longitude={-0.1278} />
    );

    const marker = result.getByTestId('map-marker');

    expect(marker.props.coordinate).toEqual({
      latitude: 51.5074,
      longitude: -0.1278,
    });
  });
});

// ─── Non-interactive flags ───────────────────────────────────────────────────

describe('LocationMap — non-interactive flags', () => {
  it('has scrollEnabled={false}', async () => {
    const result = await render(
      <LocationMap latitude={36.16} longitude={-86.78} />
    );
    const mapView = result.getByTestId('map-view');
    expect(mapView.props.scrollEnabled).toBe(false);
  });

  it('has zoomEnabled={false}', async () => {
    const result = await render(
      <LocationMap latitude={36.16} longitude={-86.78} />
    );
    const mapView = result.getByTestId('map-view');
    expect(mapView.props.zoomEnabled).toBe(false);
  });

  it('has rotateEnabled={false}', async () => {
    const result = await render(
      <LocationMap latitude={36.16} longitude={-86.78} />
    );
    const mapView = result.getByTestId('map-view');
    expect(mapView.props.rotateEnabled).toBe(false);
  });

  it('has pitchEnabled={false}', async () => {
    const result = await render(
      <LocationMap latitude={36.16} longitude={-86.78} />
    );
    const mapView = result.getByTestId('map-view');
    expect(mapView.props.pitchEnabled).toBe(false);
  });
});

// ─── Container dimensions ────────────────────────────────────────────────────

describe('LocationMap — container dimensions', () => {
  it('has height: 200 and width: 100%', async () => {
    const result = await render(
      <LocationMap latitude={36.16} longitude={-86.78} />
    );

    const mapView = result.getByTestId('map-view');
    const style = mapView.props.style;

    // StyleSheet.create flattens styles — check for height and width
    expect(style).toMatchObject({
      height: 200,
      width: '100%',
    });
  });
});
