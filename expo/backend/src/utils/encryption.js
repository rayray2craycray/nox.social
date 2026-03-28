/**
 * Encryption Utility for Sensitive Data
 * Uses AES-256-CBC encryption for API keys and tokens
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Get encryption key from environment (must be 32 bytes for AES-256)
const getEncryptionKey = () => {
  const key = process.env.POS_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('POS_ENCRYPTION_KEY environment variable is not set');
  }

  // Ensure key is exactly 32 bytes
  if (Buffer.from(key, 'hex').length !== 32) {
    throw new Error('POS_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return Buffer.from(key, 'hex');
};

/**
 * Encrypt sensitive text (API keys, tokens, etc.)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format "iv:encryptedData"
 */
function encrypt(text) {
  if (!text) return null;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Return IV and encrypted data separated by colon
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt encrypted text
 * @param {string} text - Encrypted text in format "iv:encryptedData"
 * @returns {string} - Decrypted plain text
 */
function decrypt(text) {
  if (!text) return null;

  try {
    const key = getEncryptionKey();
    const textParts = text.split(':');

    if (textParts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure encryption key (for setup)
 * Run this once to generate POS_ENCRYPTION_KEY
 * @returns {string} - 32-byte hex key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash sensitive data for comparison (one-way)
 * Use for comparing tokens without storing plain text
 * @param {string} text - Text to hash
 * @returns {string} - SHA-256 hash
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  hash,
};
