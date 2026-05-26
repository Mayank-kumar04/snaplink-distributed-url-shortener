// src/utils/hashUtils.js
// This is the CORE of URL shortening — how we generate short codes
//
// INTERVIEW EXPLANATION:
// We use nanoid to generate random 7-character alphanumeric strings.
// Character set: a-z, A-Z, 0-9 = 62 characters (base62 encoding)
// With 7 characters: 62^7 = 3,521,614,606,208 possible combinations
// That's 3.5 TRILLION URLs — essentially collision-free for any real app.
//
// Why not MD5/SHA256 of the URL?
// - Same URL would always give same hash (fine, but less flexible)
// - You'd need to take first N chars, which increases collision risk
// - nanoid is simpler, faster, and purpose-built for this

const { nanoid } = require('nanoid');

// Base62 alphabet — no confusing chars like 0/O, 1/l
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CODE_LENGTH = 7;

/**
 * Generate a unique short code
 * @returns {string} 7-character alphanumeric code, e.g. "aB3kR9z"
 */
function generateShortCode() {
  return nanoid(CODE_LENGTH);
}

/**
 * Validate that a string looks like one of our short codes
 * @param {string} code 
 * @returns {boolean}
 */
function isValidShortCode(code) {
  // Must be exactly CODE_LENGTH chars, all alphanumeric
  const regex = new RegExp(`^[a-zA-Z0-9]{${CODE_LENGTH}}$`);
  return regex.test(code);
}

/**
 * Generate a custom alias — user provides their own short code
 * We validate it's URL-safe and reasonable length
 * @param {string} alias 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCustomAlias(alias) {
  if (!alias || alias.length < 3) {
    return { valid: false, error: 'Alias must be at least 3 characters' };
  }
  if (alias.length > 50) {
    return { valid: false, error: 'Alias must be 50 characters or less' };
  }
  // Only allow alphanumeric and hyphens
  if (!/^[a-zA-Z0-9-_]+$/.test(alias)) {
    return { valid: false, error: 'Alias can only contain letters, numbers, hyphens, underscores' };
  }
  return { valid: true };
}

module.exports = { generateShortCode, isValidShortCode, validateCustomAlias };
