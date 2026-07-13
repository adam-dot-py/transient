/**
 * Pure helper functions for authentication validation.
 *
 * All functions are pure — no side effects, no external dependencies.
 * They handle email format validation, password strength checks,
 * and session expiration logic.
 */

/**
 * Validates an email address format.
 *
 * - Empty string → error "Email is required"
 * - Invalid format → error "Invalid email address"
 * - Valid format → { isValid: true }
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  // Standard email regex: local@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Invalid email address' };
  }

  return { isValid: true };
}

/**
 * Validates password strength against the following criteria:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 *
 * Returns isValid: true with empty errors when all criteria pass.
 * Returns isValid: false with an array of all failing criteria messages.
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks whether a session has expired.
 *
 * Takes an expiration timestamp in Unix seconds and compares it
 * to the current time (Date.now() / 1000).
 *
 * Returns true if the session is expired (current time is past expiration).
 * Returns false if the session is still valid.
 */
export function isSessionExpired(expiresAt: number): boolean {
  const nowSeconds = Date.now() / 1000;
  return nowSeconds > expiresAt;
}
