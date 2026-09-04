import JSZip from 'jszip';

import { convertDepthAnythingV3Output, decodeByteTensor, decodeFloatTensor } from './depthAnything';
import { convertDepthProOutput, parseNpyFloat32 } from './depthPro';
import { parseGlbPositions } from './glb';
import { cameraPointsToDisplayPositions } from './normalization';
import { parsePlyPositions } from './ply';
import type { ReplicateTensor } from './types';

const toBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64');

const floatTensor = (values: number[], shape: number[]): ReplicateTensor => {
  const data = new Float32Array(values);

  return { data: toBase64(new Uint8Array(data.buffer)), dtype: 'float32', shape };
};

const createNpy = (values: number[], shape: number[]): Uint8Array => {
  const dict = `{'descr': '<f4', 'fortran_order': False, 'shape': (${shape.join(', ')},), }`;
  const padding = (16 - ((10 + dict.length + 1) % 16)) % 16;
  const header = new TextEncoder().encode(`${dict}${' '.repeat(padding)}\n`);
  const data = new Uint8Array(new Float32Array(values).buffer);
  const result = new Uint8Array(10 + header.length + data.length);

  result.set([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59, 1, 0], 0);
  new DataView(result.buffer).setUint16(8, header.length, true);
  result.set(header, 10);
  result.set(data, 10 + header.length);

  return result;
};

const createGlb = (jsonValue: object, binary: Uint8Array): ArrayBuffer => {
  const rawJson = new TextEncoder().encode(JSON.stringify(jsonValue));
  const jsonPadding = (4 - (rawJson.length % 4)) % 4;
  const binaryPadding = (4 - (binary.length % 4)) % 4;
  const json = new Uint8Array(rawJson.length + jsonPadding).fill(0x20);
  const binaryChunk = new Uint8Array(binary.length + binaryPadding);
  const length = 12 + 8 + json.length + 8 + binaryChunk.length;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  json.set(rawJson);
  binaryChunk.set(binary);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, length, true);
  view.setUint32(12, json.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(buffer, 20, json.length).set(json);

  const binaryHeader = 20 + json.length;

  view.setUint32(binaryHeader, binaryChunk.length, true);
  view.setUint32(binaryHeader + 4, 0x004e4942, true);
  new Uint8Array(buffer, binaryHeader + 8, binaryChunk.length).set(binaryChunk);

  return buffer;
};

describe('Replicate point-cloud converters', () => {
  test('decodes float and byte tensors with shape validation', () => {
    expect(Array.from(decodeFloatTensor(floatTensor([1.5, 2.5], [1, 2])))).toEqual([1.5, 2.5]);
    expect(
      Array.from(decodeByteTensor({ data: toBase64(new Uint8Array([0, 1])), dtype: 'bool', shape: [1, 2] })),
    ).toEqual([0, 1]);
    expect(() => decodeFloatTensor({ data: '', dtype: 'float32', shape: [1] })).toThrow(
      'Float tensor byte length does not match its shape',
    );
  });

  test('back-projects Depth Anything JSON while applying its masks', () => {
    const positions = convertDepthAnythingV3Output(
      {
        alpha_mask: floatTensor([1, 1, 1, 0], [2, 2]),
        depth: floatTensor([1, 2, 3, 4], [2, 2]),
        original_shape: { height: 1, width: 2 },
        sky_mask: { data: toBase64(new Uint8Array([0, 0, 1, 0])), dtype: 'bool', shape: [2, 2] },
      },
      { focalLengthPx: 2, maxPoints: 4, widthMm: 20 },
    );

    expect(positions).toHaveLength(6);
    expect(positions[0]).toBeCloseTo(-10);
    expect(positions[3]).toBeCloseTo(10);
    expect(positions[2]).toBeCloseTo(26.6667);
    expect(positions[5]).toBe(0);
  });

  test('uses one uniform scale for camera-space width and depth', () => {
    const positions = cameraPointsToDisplayPositions(
      new Float32Array([-1, -1, 1, 1, -1, 1, -1, 1, 3, 1, 1, 3]),
      {
        depth: { index: 2, sign: 1 },
        horizontal: { index: 0, sign: 1 },
        vertical: { index: 1, sign: 1 },
      },
      { maxPoints: 4, widthMm: 100 },
    );
    const xs = positions.filter((_, index) => index % 3 === 0);
    const zs = positions.filter((_, index) => index % 3 === 2);

    expect(Math.max(...xs) - Math.min(...xs)).toBe(100);
    expect(Math.max(...zs) - Math.min(...zs)).toBe(100);
  });

  test('reads ASCII and binary little-endian PLY positions', () => {
    const ascii = new TextEncoder().encode(
      [
        'ply',
        'format ascii 1.0',
        'element vertex 2',
        'property float x',
        'property float y',
        'property float z',
        'end_header',
        '1 2 3',
        '4 5 6',
        '',
      ].join('\n'),
    );

    expect(Array.from(parsePlyPositions(ascii.buffer))).toEqual([1, 2, 3, 4, 5, 6]);

    const header = new TextEncoder().encode(
      [
        'ply',
        'format binary_little_endian 1.0',
        'element vertex 1',
        'property uchar red',
        'property float x',
        'property float y',
        'property float z',
        'end_header',
        '',
      ].join('\n'),
    );
    const binary = new Uint8Array(header.length + 13);
    const view = new DataView(binary.buffer);

    binary.set(header);
    view.setUint8(header.length, 255);
    view.setFloat32(header.length + 1, -1, true);
    view.setFloat32(header.length + 5, 2, true);
    view.setFloat32(header.length + 9, -3, true);

    expect(Array.from(parsePlyPositions(binary.buffer))).toEqual([-1, 2, -3]);
  });

  test('reads GLB positions and applies node transforms', () => {
    const values = new Float32Array([1, 2, 3, 4, 5, 6]);
    const glb = createGlb(
      {
        accessors: [{ bufferView: 0, componentType: 5126, count: 2, type: 'VEC3' }],
        asset: { version: '2.0' },
        buffers: [{ byteLength: values.byteLength }],
        bufferViews: [{ buffer: 0, byteLength: values.byteLength }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, mode: 0 }] }],
        nodes: [{ mesh: 0, translation: [10, 20, 30] }],
        scene: 0,
        scenes: [{ nodes: [0] }],
      },
      new Uint8Array(values.buffer),
    );

    expect(Array.from(parseGlbPositions(glb))).toEqual([11, 22, 33, 14, 25, 36]);
  });

  test('reads Depth Pro NPY and NPZ output', async () => {
    const npy = createNpy([1, 2, 3, 4], [2, 2]);
    const parsed = parseNpyFloat32(npy);

    expect(parsed.shape).toEqual([2, 2]);
    expect(Array.from(parsed.data)).toEqual([1, 2, 3, 4]);

    const zip = new JSZip();

    zip.file('depth.npy', npy);

    const positions = await convertDepthProOutput(await zip.generateAsync({ type: 'arraybuffer' }), {
      focalLengthPx: 2,
      maxPoints: 4,
      widthMm: 20,
    });

    expect(positions).toHaveLength(12);
    expect(Math.max(...positions.filter((_, index) => index % 3 === 2))).toBeGreaterThan(20);
    expect(Math.min(...positions.filter((_, index) => index % 3 === 2))).toBe(0);
  });
});
