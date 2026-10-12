/**
 * Tests for the user-controlled search location feature:
 * - geocodeService.lookupCityCoordinates / geocodeCity (mock geocoder)
 * - locationService.resolveManualLocation / getDeviceLocation / describeLocationError
 *
 * The device-GPS path is covered via the module's graceful fallback: with no
 * `expo-location` native module available in the Jest environment, the lazy
 * import resolves to a module without `getCurrentPositionAsync`, so
 * getDeviceLocation() must return { ok: false, reason: 'unavailable' } rather
 * than throwing.
 */

import fc from 'fast-check';

import {
  geocodeCity,
  lookupCityCoordinates,
} from '@/data/geocodeService';
import {
  DEFAULT_USER_LOCATION,
  describeLocationError,
  getDeviceLocation,
  resolveManualLocation,
  type LocationError,
} from '@/data/locationService';

describe('lookupCityCoordinates (pure)', () => {
  it('resolves known Nashville-area cities (case-insensitive, trimmed)', () => {
    expect(lookupCityCoordinates('Nashville')).toEqual({
      latitude: 36.1627,
      longitude: -86.7816,
    });
    expect(lookupCityCoordinates('  nashville  ')).toEqual(
      lookupCityCoordinates('NASHVILLE')
    );
    expect(lookupCityCoordinates('Memphis')).not.toBeNull();
    expect(lookupCityCoordinates('Franklin')).not.toBeNull();
  });

  it('returns null for empty or unknown input', () => {
    expect(lookupCityCoordinates('')).toBeNull();
    expect(lookupCityCoordinates('   ')).toBeNull();
    expect(lookupCityCoordinates('Atlantis')).toBeNull();
  });

  it('never throws and only returns valid coords or null (property)', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = lookupCityCoordinates(s);
        if (result !== null) {
          expect(typeof result.latitude).toBe('number');
          expect(typeof result.longitude).toBe('number');
          expect(result.latitude).toBeGreaterThanOrEqual(-90);
          expect(result.latitude).toBeLessThanOrEqual(90);
          expect(result.longitude).toBeGreaterThanOrEqual(-180);
          expect(result.longitude).toBeLessThanOrEqual(180);
        }
      })
    );
  });
});

describe('geocodeCity (async mock)', () => {
  it('returns coordinates + a title-cased label for a known city', async () => {
    const result = await geocodeCity('nashville');
    expect(result).not.toBeNull();
    expect(result?.formattedAddress).toBe('Nashville');
    expect(result?.latitude).toBeCloseTo(36.1627, 3);
  });

  it('returns null for an unknown or empty city', async () => {
    expect(await geocodeCity('Narnia')).toBeNull();
    expect(await geocodeCity('')).toBeNull();
  });
});

describe('resolveManualLocation', () => {
  it('resolves a known city into a manual UserLocation', async () => {
    const result = await resolveManualLocation('Memphis');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.location.source).toBe('manual');
      expect(result.location.label).toBe('Memphis');
      expect(result.location.latitude).toBeCloseTo(35.1495, 3);
    }
  });

  it('reports "empty" for a blank query', async () => {
    const result = await resolveManualLocation('   ');
    expect(result).toEqual({ ok: false, reason: 'empty' });
  });

  it('reports "not-found" for an unknown city', async () => {
    const result = await resolveManualLocation('Gotham');
    expect(result).toEqual({ ok: false, reason: 'not-found' });
  });
});

describe('getDeviceLocation (graceful fallback without native module)', () => {
  it('returns a non-ok result instead of throwing when GPS is unavailable', async () => {
    const result = await getDeviceLocation();
    // In Jest there is no usable expo-location native module, so this must be a
    // handled failure (unavailable or permission-denied), never a throw.
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(['unavailable', 'permission-denied']).toContain(result.reason);
    }
  });
});

describe('describeLocationError', () => {
  it('returns a non-empty message for every known reason', () => {
    const reasons: LocationError[] = [
      'permission-denied',
      'unavailable',
      'not-found',
      'empty',
    ];
    for (const reason of reasons) {
      expect(describeLocationError(reason).length).toBeGreaterThan(0);
    }
  });
});

describe('DEFAULT_USER_LOCATION', () => {
  it('is Nashville with a default source', () => {
    expect(DEFAULT_USER_LOCATION.source).toBe('default');
    expect(DEFAULT_USER_LOCATION.label).toBe('Nashville, TN');
    expect(DEFAULT_USER_LOCATION.latitude).toBeCloseTo(36.1627, 3);
  });
});
