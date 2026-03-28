/**
 * Input Sanitization Utilities
 * Protects against XSS, injection attacks, and malicious user input
 */

// ============================================================================
// HTML/XSS SANITIZATION
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param input - Raw user input string
 * @returns Sanitized string with HTML entities escaped
 */
export function escapeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Strips all HTML tags from input
 * @param input - Raw user input string
 * @returns String with all HTML tags removed
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Removes potentially dangerous characters and patterns
 * @param input - Raw user input string
 * @returns Sanitized string
 */
export function sanitizeText(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Strip HTML tags
  sanitized = stripHtml(sanitized);

  // Escape remaining special characters
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

// ============================================================================
// USERNAME SANITIZATION
// ============================================================================

/**
 * Sanitizes username input to alphanumeric + underscore only
 * @param username - Raw username input
 * @returns Sanitized username
 */
export function sanitizeUsername(username: string): string {
  // Remove all characters except letters, numbers, and underscores
  let sanitized = username.replace(/[^a-zA-Z0-9_]/g, '');

  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');

  // Collapse multiple underscores into single underscore
  sanitized = sanitized.replace(/_+/g, '_');

  return sanitized;
}

// ============================================================================
// DISPLAY NAME SANITIZATION
// ============================================================================

/**
 * Sanitizes display name to safe characters
 * @param displayName - Raw display name input
 * @returns Sanitized display name
 */
export function sanitizeDisplayName(displayName: string): string {
  // Allow letters, numbers, spaces, hyphens, and apostrophes
  let sanitized = displayName.replace(/[^a-zA-Z0-9\s\-']/g, '');

  // Normalize whitespace (remove leading/trailing, collapse multiple spaces)
  sanitized = sanitized.trim().replace(/\s+/g, ' ');

  // Prevent excessively long runs of the same character
  sanitized = sanitized.replace(/(.)\1{4,}/g, '$1$1$1');

  return sanitized;
}

// ============================================================================
// BIO/DESCRIPTION SANITIZATION
// ============================================================================

/**
 * Sanitizes bio/description text while preserving basic formatting
 * @param bio - Raw bio input
 * @returns Sanitized bio
 */
export function sanitizeBio(bio: string): string {
  // Strip HTML tags
  let sanitized = stripHtml(bio);

  // Remove null bytes and other control characters except newlines/tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize line breaks (CRLF -> LF)
  sanitized = sanitized.replace(/\r\n/g, '\n');

  // Limit consecutive newlines to 2
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

// ============================================================================
// URL SANITIZATION
// ============================================================================

/**
 * Validates and sanitizes URLs to prevent javascript: and data: schemes
 * @param url - Raw URL input
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    return '';
  }

  // Only allow http, https, and mailto protocols
  const allowedProtocols = /^(https?|mailto):/i;
  if (!allowedProtocols.test(trimmed) && !trimmed.startsWith('/')) {
    return '';
  }

  return trimmed;
}

// ============================================================================
// SQL INJECTION PREVENTION (for raw queries - use ORMs/parameterized queries instead)
// ============================================================================

/**
 * Escapes single quotes for SQL strings (USE PARAMETERIZED QUERIES INSTEAD!)
 * This is a last resort - always prefer parameterized queries
 * @param input - Raw input
 * @returns Escaped string
 */
export function escapeSql(input: string): string {
  // Replace single quotes with two single quotes
  return input.replace(/'/g, "''");
}

// ============================================================================
// COMMAND INJECTION PREVENTION
// ============================================================================

/**
 * Sanitizes input that might be used in shell commands
 * IMPORTANT: Avoid passing user input to shell commands. Use libraries instead.
 * @param input - Raw input
 * @returns Sanitized string with shell metacharacters removed
 */
export function sanitizeShellInput(input: string): string {
  // Remove shell metacharacters
  return input.replace(/[;&|`$(){}[\]<>!\\'"]/g, '');
}

// ============================================================================
// FILE PATH SANITIZATION
// ============================================================================

/**
 * Sanitizes file names to prevent directory traversal attacks
 * @param filename - Raw filename input
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');

  // Remove path separators
  sanitized = sanitized.replace(/[/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Allow only safe characters (alphanumeric, dash, underscore, dot)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  return sanitized;
}

// ============================================================================
// PHONE NUMBER SANITIZATION
// ============================================================================

/**
 * Sanitizes phone number to digits only
 * @param phone - Raw phone input
 * @returns Digits-only phone number
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

// ============================================================================
// EMAIL SANITIZATION
// ============================================================================

/**
 * Basic email sanitization (lowercase, trim)
 * Use proper email validation (like Zod) for verification
 * @param email - Raw email input
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ============================================================================
// COMPREHENSIVE INPUT SANITIZER
// ============================================================================

/**
 * Main sanitization function that applies appropriate sanitization based on input type
 * @param input - Raw user input
 * @param type - Type of input to determine sanitization strategy
 * @returns Sanitized input
 */
export function sanitizeInput(
  input: string,
  type: 'username' | 'displayName' | 'bio' | 'text' | 'url' | 'email' | 'phone' | 'filename'
): string {
  switch (type) {
    case 'username':
      return sanitizeUsername(input);
    case 'displayName':
      return sanitizeDisplayName(input);
    case 'bio':
      return sanitizeBio(input);
    case 'url':
      return sanitizeUrl(input);
    case 'email':
      return sanitizeEmail(input);
    case 'phone':
      return sanitizePhone(input);
    case 'filename':
      return sanitizeFilename(input);
    case 'text':
    default:
      return sanitizeText(input);
  }
}

// ============================================================================
// REACT NATIVE SPECIFIC SANITIZATION
// ============================================================================

/**
 * Sanitizes input for React Native TextInput components
 * Removes or replaces characters that could cause rendering issues
 * @param input - Raw input from TextInput
 * @returns Sanitized input safe for React Native
 */
export function sanitizeTextInput(input: string): string {
  // Remove zero-width characters that can cause layout issues
  let sanitized = input.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Remove RTL/LTR override characters that could be used for spoofing
  sanitized = sanitized.replace(/[\u202A-\u202E]/g, '');

  // Remove other problematic Unicode characters
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  return sanitized;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Checks if input contains potentially malicious patterns
 * @param input - Input to check
 * @returns True if input appears malicious
 */
export function containsMaliciousPatterns(input: string): boolean {
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /data:text\/html/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /\.\.\//g, // Directory traversal
    /base64/i,
  ];

  return maliciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Checks if input length is within acceptable bounds
 * @param input - Input to check
 * @param maxLength - Maximum allowed length
 * @returns True if input length is valid
 */
export function isValidLength(input: string, maxLength: number): boolean {
  return input.length > 0 && input.length <= maxLength;
}
