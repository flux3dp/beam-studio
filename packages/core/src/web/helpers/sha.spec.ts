/**
 * @jest-environment jsdom
 */
import crypto from 'crypto';

import { sha256 } from './sha';

// Polyfill crypto.subtle for Node.js test environment
beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      subtle: crypto.webcrypto.subtle,
    },
  });
});

describe('sha256', () => {
  it('should produce correct hash for empty string', async () => {
    const result = await sha256('');

    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('should produce correct hash for "test"', async () => {
    const result = await sha256('test');

    expect(result).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });

  it('should produce correct hash for "hello world"', async () => {
    const result = await sha256('hello world');

    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('should handle UTF-8 characters', async () => {
    const result = await sha256('こんにちは');

    expect(result).toBe('125aeadf27b0459b8760c13a3d80912dfa8a81a68261906f60d87f4a0268646c');
  });

  it('should return 64 character lowercase hex string', async () => {
    const result = await sha256('any input');

    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
