/**
 * Unit tests for authService pure validation functions.
 * Covers email format validation, password strength rules, and session expiration logic.
 */

import { isSessionExpired, validateEmail, validatePassword } from '@/data/authService';

// ─── validateEmail ───────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it('returns isValid true for a valid email', () => {
    const result = validateEmail('user@example.com');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns error for empty string', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('returns error for whitespace only', () => {
    const result = validateEmail('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('returns error for missing @ sign', () => {
    const result = validateEmail('userexample.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });

  it('returns error for missing domain', () => {
    const result = validateEmail('user@');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });

  it('returns error for missing TLD', () => {
    const result = validateEmail('user@example');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });

  it('returns isValid true for email with plus sign', () => {
    const result = validateEmail('user+tag@example.com');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// ─── validatePassword ────────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('returns isValid true and empty errors for valid password', () => {
    const result = validatePassword('Password1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns error for too short password', () => {
    const result = validatePassword('Pass1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('returns error for password without uppercase', () => {
    const result = validatePassword('password1');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('returns error for password without number', () => {
    const result = validatePassword('Password');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('returns all three errors for completely failing password', () => {
    const result = validatePassword('abc');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
    expect(result.errors).toContain('Password must contain at least one number');
    expect(result.errors).toHaveLength(3);
  });

  it('returns isValid true for exactly 8 chars meeting all requirements', () => {
    const result = validatePassword('Abcdef1x');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

// ─── isSessionExpired ────────────────────────────────────────────────────────

describe('isSessionExpired', () => {
  it('returns false for a future timestamp', () => {
    const futureTimestamp = Date.now() / 1000 + 3600; // 1 hour from now
    expect(isSessionExpired(futureTimestamp)).toBe(false);
  });

  it('returns true for a past timestamp', () => {
    const pastTimestamp = Date.now() / 1000 - 3600; // 1 hour ago
    expect(isSessionExpired(pastTimestamp)).toBe(true);
  });

  it('returns true for a just-expired timestamp', () => {
    const justExpired = Date.now() / 1000 - 1; // 1 second ago
    expect(isSessionExpired(justExpired)).toBe(true);
  });
});
