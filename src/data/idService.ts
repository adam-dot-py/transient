/**
 * Cross-runtime unique ID generation.
 *
 * `crypto.randomUUID()` exists in browsers and recent Node, but NOT in React
 * Native's Hermes engine — calling it there throws "crypto does not exist",
 * which crashed gig creation and the apply/payment flow on device.
 *
 * `generateId()` uses the native `crypto.randomUUID()` when it is actually
 * available, and otherwise falls back to a pure, dependency-free RFC 4122
 * version-4 UUID generator. It is a plain function with no side effects, so the
 * pure service layer stays easy to test.
 */

/** Returns a random UUID v4 string, safe on web, Node, and React Native. */
export function generateId(): string {
  // Use the platform UUID generator when present (browsers, modern runtimes).
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    return g.crypto.randomUUID();
  }
  return uuidv4Fallback();
}

/**
 * Pure RFC 4122 version-4 UUID fallback for runtimes without
 * `crypto.randomUUID` (e.g. Hermes). Uses `crypto.getRandomValues` when
 * available for better randomness, otherwise `Math.random()`.
 */
function uuidv4Fallback(): string {
  const bytes = new Uint8Array(16);

  const g = globalThis as {
    crypto?: { getRandomValues?: (arr: Uint8Array) => Uint8Array };
  };
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set the version (4) and variant (10xx) bits per RFC 4122.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex: string[] = [];
  for (let i = 0; i < 256; i++) {
    hex.push((i + 0x100).toString(16).slice(1));
  }

  return (
    hex[bytes[0]] +
    hex[bytes[1]] +
    hex[bytes[2]] +
    hex[bytes[3]] +
    '-' +
    hex[bytes[4]] +
    hex[bytes[5]] +
    '-' +
    hex[bytes[6]] +
    hex[bytes[7]] +
    '-' +
    hex[bytes[8]] +
    hex[bytes[9]] +
    '-' +
    hex[bytes[10]] +
    hex[bytes[11]] +
    hex[bytes[12]] +
    hex[bytes[13]] +
    hex[bytes[14]] +
    hex[bytes[15]]
  );
}
