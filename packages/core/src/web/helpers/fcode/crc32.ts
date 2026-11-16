const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;

  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;

  return c;
});

/** CRC-32 (IEEE, zlib's) that guards every fcode chunk. */
export const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff;

  for (let i = 0; i < bytes.length; i += 1) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);

  return (c ^ 0xffffffff) >>> 0;
};
