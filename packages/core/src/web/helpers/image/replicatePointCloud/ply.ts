import { cameraPointsToDisplayPositions } from './normalization';
import type { PointCloudConversionOptions } from './types';

type PlyFormat = 'ascii' | 'binary_big_endian' | 'binary_little_endian';

const PLY_TYPES = {
  char: { bytes: 1, read: (view: DataView, offset: number) => view.getInt8(offset) },
  double: { bytes: 8, read: (view: DataView, offset: number, little: boolean) => view.getFloat64(offset, little) },
  float: { bytes: 4, read: (view: DataView, offset: number, little: boolean) => view.getFloat32(offset, little) },
  float32: { bytes: 4, read: (view: DataView, offset: number, little: boolean) => view.getFloat32(offset, little) },
  float64: { bytes: 8, read: (view: DataView, offset: number, little: boolean) => view.getFloat64(offset, little) },
  int: { bytes: 4, read: (view: DataView, offset: number, little: boolean) => view.getInt32(offset, little) },
  int8: { bytes: 1, read: (view: DataView, offset: number) => view.getInt8(offset) },
  int16: { bytes: 2, read: (view: DataView, offset: number, little: boolean) => view.getInt16(offset, little) },
  int32: { bytes: 4, read: (view: DataView, offset: number, little: boolean) => view.getInt32(offset, little) },
  short: { bytes: 2, read: (view: DataView, offset: number, little: boolean) => view.getInt16(offset, little) },
  uchar: { bytes: 1, read: (view: DataView, offset: number) => view.getUint8(offset) },
  uint: { bytes: 4, read: (view: DataView, offset: number, little: boolean) => view.getUint32(offset, little) },
  uint8: { bytes: 1, read: (view: DataView, offset: number) => view.getUint8(offset) },
  uint16: { bytes: 2, read: (view: DataView, offset: number, little: boolean) => view.getUint16(offset, little) },
  uint32: { bytes: 4, read: (view: DataView, offset: number, little: boolean) => view.getUint32(offset, little) },
  ushort: { bytes: 2, read: (view: DataView, offset: number, little: boolean) => view.getUint16(offset, little) },
} as const;

type PlyType = keyof typeof PLY_TYPES;

interface PlyProperty {
  name: string;
  offset: number;
  type: PlyType;
}

const findHeaderEnd = (bytes: Uint8Array): number => {
  const marker = new TextEncoder().encode('end_header');

  for (let index = 0; index <= bytes.length - marker.length; index += 1) {
    if (marker.every((value, markerIndex) => bytes[index + markerIndex] === value)) {
      const lineFeed = bytes.indexOf(10, index + marker.length);

      return lineFeed >= 0 ? lineFeed + 1 : index + marker.length;
    }
  }

  throw new Error('PLY header has no end_header marker');
};

/** Read XYZ from the ASCII and binary PLY variants emitted by MoGe-2. */
export const parsePlyPositions = (buffer: ArrayBuffer): Float32Array => {
  const bytes = new Uint8Array(buffer);
  const dataOffset = findHeaderEnd(bytes);
  const header = new TextDecoder().decode(bytes.subarray(0, dataOffset));
  const lines = header.split(/\r?\n/);
  const format = lines.find((line) => line.startsWith('format '))?.split(/\s+/)[1] as PlyFormat | undefined;
  const vertexLineIndex = lines.findIndex((line) => line.startsWith('element vertex '));

  if (!format || !['ascii', 'binary_big_endian', 'binary_little_endian'].includes(format)) {
    throw new Error(`Unsupported PLY format: ${format ?? 'missing'}`);
  }

  if (vertexLineIndex < 0) throw new Error('PLY has no vertex element');

  const vertexCount = Number(lines[vertexLineIndex].split(/\s+/)[2]);
  const properties: PlyProperty[] = [];
  let stride = 0;

  for (let index = vertexLineIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith('element ') || line === 'end_header') break;

    if (!line.startsWith('property ') || line.startsWith('property list ')) continue;

    const [, typeName, name] = line.split(/\s+/);
    const type = typeName as PlyType;
    const descriptor = PLY_TYPES[type];

    if (!descriptor) throw new Error(`Unsupported PLY property type: ${typeName}`);

    properties.push({ name, offset: stride, type });
    stride += descriptor.bytes;
  }

  const xyz = ['x', 'y', 'z'].map((name) => properties.find((property) => property.name === name));

  if (xyz.some((property) => !property)) throw new Error('PLY vertex element must contain x, y and z');

  if (!Number.isSafeInteger(vertexCount) || vertexCount <= 0) throw new Error('PLY vertex count is invalid');

  if (format === 'ascii') {
    const propertyIndexes = xyz.map((property) => properties.indexOf(property!));
    const rows = new TextDecoder().decode(bytes.subarray(dataOffset)).trim().split(/\r?\n/);
    const result = new Float32Array(vertexCount * 3);

    if (rows.length < vertexCount) throw new Error('PLY vertex payload is truncated');

    for (let vertex = 0; vertex < vertexCount; vertex += 1) {
      const values = rows[vertex].trim().split(/\s+/);

      propertyIndexes.forEach((propertyIndex, axis) => {
        result[vertex * 3 + axis] = Number(values[propertyIndex]);
      });
    }

    return result;
  }

  if (dataOffset + vertexCount * stride > buffer.byteLength) throw new Error('PLY vertex payload is truncated');

  const view = new DataView(buffer);
  const littleEndian = format === 'binary_little_endian';
  const result = new Float32Array(vertexCount * 3);

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    xyz.forEach((property, axis) => {
      const descriptor = PLY_TYPES[property!.type];

      result[vertex * 3 + axis] = descriptor.read(view, dataOffset + vertex * stride + property!.offset, littleEndian);
    });
  }

  return result;
};

/** Convert MoGe-2's OpenGL camera-space PLY into proportionally scaled local BSPC positions. */
export const convertMoge2Output = (buffer: ArrayBuffer, options?: PointCloudConversionOptions): Float32Array =>
  cameraPointsToDisplayPositions(
    parsePlyPositions(buffer),
    {
      depth: { index: 2, sign: -1 },
      horizontal: { index: 0, sign: 1 },
      vertical: { index: 1, sign: 1 },
    },
    options,
  );
