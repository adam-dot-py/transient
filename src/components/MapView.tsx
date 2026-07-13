import { StyleSheet } from 'react-native';
import NativeMapView, { Marker } from 'react-native-maps';

import type { Gig, MapRegion } from '@/types';

export interface AppMapViewProps {
  gigs: Gig[];
  initialRegion: MapRegion;
  onMarkerPress: (gig: Gig) => void;
}

/**
 * AppMapView — Mobile map implementation using react-native-maps.
 *
 * Renders a full-size map centered on the provided `initialRegion` with
 * markers for each gig at their coordinates. Pan and pinch-to-zoom are
 * supported by default. Pressing a marker calls `onMarkerPress` with
 * the corresponding gig object.
 */
export function AppMapView({ gigs, initialRegion, onMarkerPress }: AppMapViewProps) {
  return (
    <NativeMapView
      style={styles.map}
      initialRegion={initialRegion}
      accessibilityLabel="Gig locations map"
    >
      {gigs.map((gig) => (
        <Marker
          key={gig.id}
          coordinate={{ latitude: gig.latitude, longitude: gig.longitude }}
          title={gig.title}
          onPress={() => onMarkerPress(gig)}
        />
      ))}
    </NativeMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
