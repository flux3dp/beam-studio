import arrayBuffer from '@core/helpers/arrayBuffer';

import { crc32 } from './crc32';

const MAGIC_LENGTH = 8;
/** magic(8) + 'FILE'(4) + u32 json length(4) */
const FILE_JSON_START = MAGIC_LENGTH + 8;

const u32Bytes = (value: number): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(4);

  new DataView(bytes.buffer).setUint32(0, value, true);

  return bytes;
};

/**
 * Add entries to the FILE json of a v2+ fcode (`FCx0002\n`…), whose chunk sits right after the magic:
 * `magic | 'FILE' u32 len | json | u32 crc32 | PREV… | CONT… | POST…`. Only the FILE chunk is read
 * and rebuilt; every chunk carries its own crc32, so the rest is passed through as a lazy Blob slice
 * and the cost does not grow with the task size.
 *
 * Anything else (v1 fcode, whose metadata is a `KEY=value\0` block, an empty upload, a malformed
 * header) is returned as is.
 */
export const addFcodeMetadata = async (blob: Blob, entries: Record<string, number | string>): Promise<Blob> => {
  if (blob.size < FILE_JSON_START) return blob;

  const header = new Uint8Array(await arrayBuffer(blob.slice(0, FILE_JSON_START)));
  const decoder = new TextDecoder();
  const magic = decoder.decode(header.subarray(0, MAGIC_LENGTH));
  const tag = decoder.decode(header.subarray(MAGIC_LENGTH, MAGIC_LENGTH + 4));

  if (!/^FCx000[2-9]\n$/.test(magic) || tag !== 'FILE') return blob;

  const jsonLength = new DataView(header.buffer).getUint32(MAGIC_LENGTH + 4, true);
  const jsonEnd = FILE_JSON_START + jsonLength;

  if (jsonEnd + 4 > blob.size) return blob;

  let metadata: Record<string, unknown>;

  try {
    metadata = JSON.parse(decoder.decode(await arrayBuffer(blob.slice(FILE_JSON_START, jsonEnd))));
  } catch (error) {
    console.error('Failed to parse the fcode metadata', error);

    return blob;
  }

  const json = new TextEncoder().encode(JSON.stringify({ ...metadata, ...entries }));

  return new Blob(
    [
      blob.slice(0, MAGIC_LENGTH + 4),
      u32Bytes(json.length),
      json,
      u32Bytes(crc32(json)),
      // the old json crc32 is skipped
      blob.slice(jsonEnd + 4),
    ],
    { type: blob.type },
  );
};
