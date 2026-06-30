import type { Buffer } from 'buffer';

const detectMimeType = (bytes: Uint8Array): string => {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';

  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';

  return 'image/png';
};

export const bufferToBlob = (buf: Buffer, offset: number, length: number): Blob => {
  // Copy the data out of the Buffer so the original can be GC'd
  const copy = new Uint8Array(length);

  for (let i = 0; i < length; i += 1) {
    copy[i] = buf[offset + i];
  }

  return new Blob([copy], { type: detectMimeType(copy) });
};
