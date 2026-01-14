import SHA256 from 'crypto-js/sha256';

/**
 * Computes SHA-256 hash of the given message.
 */
export const sha256 = (message = ''): string => SHA256(message).toString();
