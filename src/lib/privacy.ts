/**
 * Privacy sanitization utility to strip phone numbers, Aadhaar-like patterns,
 * PAN cards, card numbers, and other PII before passing text to LLM or saving.
 */

export function sanitizeFreeText(text: string): { sanitized: string; hadRedactions: boolean } {
  if (!text) return { sanitized: '', hadRedactions: false };

  let hadRedactions = false;
  let result = text;

  // 1. Aadhaar-like patterns (12 digits, grouped as 4-4-4 or continuous 12 digits)
  const aadhaarRegex = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;
  if (aadhaarRegex.test(result)) {
    hadRedactions = true;
    result = result.replace(aadhaarRegex, '[ID REDACTED]');
  }

  // 2. Indian Phone numbers (+91-9876543210, 09876543210, 9876543210, etc.)
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b|\b[6-9]\d{9}\b/g;
  if (phoneRegex.test(result)) {
    hadRedactions = true;
    result = result.replace(phoneRegex, '[PHONE REDACTED]');
  }

  // 3. Indian PAN cards (e.g. ABCDE1234F)
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi;
  if (panRegex.test(result)) {
    hadRedactions = true;
    result = result.replace(panRegex, '[GOVT ID REDACTED]');
  }

  // 4. Credit / Debit card patterns (16 digits in 4 groups)
  const cardRegex = /\b(?:\d{4}[\s\-]?){3}\d{4}\b/g;
  if (cardRegex.test(result)) {
    hadRedactions = true;
    result = result.replace(cardRegex, '[CARD REDACTED]');
  }

  // 5. UPI IDs (e.g. user@okhdfcbank, someone@upi)
  const upiRegex = /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g;
  // Exclude common safe words if any, but replace potential handles
  if (upiRegex.test(result)) {
    hadRedactions = true;
    result = result.replace(upiRegex, '[UPI REDACTED]');
  }

  return { sanitized: result, hadRedactions };
}

/**
 * Wraps user free-text in strict data delimiters with prompt defense instructions
 */
export function wrapAsUntrustedData(sanitizedText: string): string {
  return `<<<USER_PREFERENCES_DATA_ONLY>>>
${sanitizedText.trim() || 'No additional preferences entered.'}
<<<END_USER_PREFERENCES_DATA>>>`;
}
