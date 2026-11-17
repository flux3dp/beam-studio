import { readFileSync } from 'fs';
import { join } from 'path';

import arrayBuffer from '@core/helpers/arrayBuffer';

import { addFcodeMetadata } from './addFcodeMetadata';
import { crc32 } from './crc32';

const encoder = new TextEncoder();

const u32 = (value: number): Uint8Array => {
  const bytes = new Uint8Array(4);

  new DataView(bytes.buffer).setUint32(0, value, true);

  return bytes;
};

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;

  parts.forEach((p) => {
    out.set(p, offset);
    offset += p.length;
  });

  return out;
};

const chunk = (tag: string, payload: Uint8Array) => concat(encoder.encode(tag), u32(payload.length), payload);

/** `magic | FILE json crc | PREV | CONT … crc` */
const buildFcode = (magic: string, metadata: Record<string, unknown>) => {
  const json = encoder.encode(JSON.stringify(metadata));
  const content = new Uint8Array([1, 2, 3, 4, 5]);
  const rest = concat(chunk('PREV', new Uint8Array([9, 9])), chunk('CONT', content), u32(crc32(content)));

  return { bytes: concat(encoder.encode(magic), chunk('FILE', json), u32(crc32(json))), rest };
};

const readBytes = async (blob: Blob) => new Uint8Array(await arrayBuffer(blob));

const readFile = (bytes: Uint8Array) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  const length = view.getUint32(12, true);
  const json = bytes.subarray(16, 16 + length);

  return {
    crcMatches: view.getUint32(16 + length, true) === crc32(json),
    metadata: JSON.parse(new TextDecoder().decode(json)),
    rest: bytes.subarray(20 + length),
    tag: new TextDecoder().decode(bytes.subarray(8, 12)),
  };
};

describe('test addFcodeMetadata', () => {
  test('crc32 matches zlib', () => {
    expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926);
  });

  test.each(['FCx0002\n', 'FCx0003\n'])('adds entries to the FILE json of %j', async (magic) => {
    const { bytes, rest } = buildFcode(magic, { FORBIDDEN_HEADTYPE: 8, IGNORE_AIR_ASSIST_WARNING: '0', SOFTWARE: 'x' });
    const result = await readBytes(
      await addFcodeMetadata(new Blob([concat(bytes, rest)]), { IGNORE_AIR_ASSIST_WARNING: '1' }),
    );
    const file = readFile(result);

    expect(new TextDecoder().decode(result.subarray(0, 8))).toBe(magic);
    expect(file.tag).toBe('FILE');
    expect(file.crcMatches).toBe(true);
    expect(file.metadata).toEqual({ FORBIDDEN_HEADTYPE: 8, IGNORE_AIR_ASSIST_WARNING: '1', SOFTWARE: 'x' });
    expect(file.rest).toEqual(rest);
  });

  test('patches a real calibration task', async () => {
    const original = new Uint8Array(readFileSync(join(__dirname, '../../assets/fcode/bm2-4c.fc')));
    const before = readFile(original);
    const after = readFile(
      await readBytes(await addFcodeMetadata(new Blob([original]), { IGNORE_AIR_ASSIST_WARNING: '1' })),
    );

    expect(after.crcMatches).toBe(true);
    expect(after.metadata).toEqual({ ...before.metadata, IGNORE_AIR_ASSIST_WARNING: '1' });
    expect(after.rest).toEqual(before.rest);
  });

  test('leaves anything but a v2+ fcode untouched', async () => {
    const v1 = new Blob([encoder.encode('FCx0001\n'), u32(0)]);
    const empty = new Blob(['']);
    const { bytes, rest } = buildFcode('FCx0002\n', {});
    const truncated = new Blob([bytes.subarray(0, bytes.length - 2)]);
    const badJson = new Blob([concat(encoder.encode('FCx0002\n'), chunk('FILE', encoder.encode('{')), u32(0), rest)]);
    const entries = { IGNORE_AIR_ASSIST_WARNING: '1' };

    jest.spyOn(console, 'error').mockImplementation(() => {});

    for (const blob of [v1, empty, truncated, badJson]) {
      expect(await addFcodeMetadata(blob, entries)).toBe(blob);
    }
  });
});
