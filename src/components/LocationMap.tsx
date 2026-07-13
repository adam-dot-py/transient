import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface LocationMapProps {
  latitude: number;
  longitude: number;
}

/**
 * Non-interactive MapView with a single marker pin.
 * Fixed height 200pt, full width, zoom level ~0.01 delta.
 * Disables all user interaction (scroll, zoom, rotate, pitch).
 */
function LocationMap({ latitude, longitude }: LocationMapProps): React.ReactElement {
  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      accessibilityLabel="Gig location map"
    >
      <Marker coordinate={{ latitude, longitude }} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 200,
    width: '100%',
  },
});

export default LocationMap;
