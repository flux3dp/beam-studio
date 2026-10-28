import { BufferAttribute, BufferGeometry } from 'three';

/** `BSPC` — Beam Studio Point Cloud. */
const MAGIC = [0x42, 0x53, 0x50, 0x43] as const;
const HEADER_SIZE = 12;
const POSITION_COMPONENTS = 3;

export const POINT_CLOUD_FORMAT_VERSION = 1;

export interface DecodedPointCloud {
  /** Local millimetres, interleaved XYZ: X right, Y towards the back, Z up. */
  positions: Float32Array<ArrayBuffer>;
  version: number;
}

const assertFinitePositions = (positions: Float32Array): void => {
  if (!positions.length || positions.length % POSITION_COMPONENTS !== 0) {
    throw new Error('Point cloud positions must contain one or more XYZ triples');
  }

  for (const value of positions) {
    if (!Number.isFinite(value)) throw new Error('Point cloud positions must be finite');
  }
};

/**
 * Encode the API-facing point-cloud contract.
 *
 * Layout, all little-endian:
 * - 4 bytes: ASCII `BSPC`
 * - uint8: format version
 * - uint8: components per point (3 for XYZ)
 * - uint16: reserved, zero
 * - uint32: point count
 * - point count × 3 × float32: local XYZ in millimetres (X right, Y back, Z up)
 *
 * There is deliberately no colour payload: inner-engraving objects are displayed with their
 * layer's single colour, and per-point colour would make two sources of truth for the same object.
 */
export const encodePointCloud = (positions: Float32Array): ArrayBuffer => {
  assertFinitePositions(positions);

  const buffer = new ArrayBuffer(HEADER_SIZE + positions.length * Float32Array.BYTES_PER_ELEMENT);
  const view = new DataView(buffer);

  MAGIC.forEach((value, index) => view.setUint8(index, value));
  view.setUint8(4, POINT_CLOUD_FORMAT_VERSION);
  view.setUint8(5, POSITION_COMPONENTS);
  view.setUint16(6, 0, true);
  view.setUint32(8, positions.length / POSITION_COMPONENTS, true);

  positions.forEach((value, index) => {
    view.setFloat32(HEADER_SIZE + index * Float32Array.BYTES_PER_ELEMENT, value, true);
  });

  return buffer;
};

/** Decode and fully validate a point-cloud block before it reaches three.js or the store. */
export const decodePointCloud = (buffer: ArrayBuffer): DecodedPointCloud => {
  if (buffer.byteLength < HEADER_SIZE) throw new Error('Point cloud buffer is shorter than its header');

  const view = new DataView(buffer);

  if (MAGIC.some((value, index) => view.getUint8(index) !== value)) {
    throw new Error('Point cloud buffer has an invalid magic value');
  }

  const version = view.getUint8(4);

  if (version !== POINT_CLOUD_FORMAT_VERSION) throw new Error(`Unsupported point cloud version: ${version}`);

  const components = view.getUint8(5);

  if (components !== POSITION_COMPONENTS) throw new Error(`Unsupported point cloud component count: ${components}`);

  const pointCount = view.getUint32(8, true);
  const valueCount = pointCount * POSITION_COMPONENTS;
  const expectedSize = HEADER_SIZE + valueCount * Float32Array.BYTES_PER_ELEMENT;

  if (!pointCount || buffer.byteLength !== expectedSize) {
    throw new Error(`Point cloud buffer size does not match its point count: ${pointCount}`);
  }

  const positions = new Float32Array(valueCount);

  for (let index = 0; index < valueCount; index += 1) {
    positions[index] = view.getFloat32(HEADER_SIZE + index * Float32Array.BYTES_PER_ELEMENT, true);
  }

  assertFinitePositions(positions);

  return { positions, version };
};

export const createPointCloudGeometry = (buffer: ArrayBuffer): BufferGeometry => {
  const { positions } = decodePointCloud(buffer);
  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new BufferAttribute(positions, POSITION_COMPONENTS));
  geometry.computeBoundingBox();

  return geometry;
};
