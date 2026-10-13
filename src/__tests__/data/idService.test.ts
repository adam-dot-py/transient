/**
 * Tests for the cross-runtime ID generator.
 *
 * Guards the regression that crashed gig creation and the apply/payment flow on
 * device: `crypto.randomUUID()` does not exist in React Native's Hermes engine.
 */

import { generateId } from '@/data/idService';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateId', () => {
  it('returns a valid RFC 4122 v4 UUID', () => {
    expect(generateId()).toMatch(UUID_V4);
  });

  it('produces unique values across many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) ids.add(generateId());
    expect(ids.size).toBe(1000);
  });

  describe('fallback when crypto.randomUUID is unavailable (Hermes-like)', () => {
    const original = (globalThis as any).crypto;

    afterEach(() => {
      (globalThis as any).crypto = original;
    });

    it('does not throw and still returns a valid UUID without crypto.randomUUID', () => {
      // Simulate Hermes: a crypto object with getRandomValues but no randomUUID.
      (globalThis as any).crypto = {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) arr[i] = (i * 37 + 11) % 256;
          return arr;
        },
      };
      expect(() => generateId()).not.toThrow();
      expect(generateId()).toMatch(UUID_V4);
    });

    it('does not throw with no crypto object at all', () => {
      (globalThis as any).crypto = undefined;
      expect(() => generateId()).not.toThrow();
      expect(generateId()).toMatch(UUID_V4);
    });
  });
});
