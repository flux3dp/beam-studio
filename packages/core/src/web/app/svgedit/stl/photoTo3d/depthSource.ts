/** `BSDM` — Beam Studio Depth Map. */
const MAGIC = [0x42, 0x53, 0x44, 0x4d] as const;
const HEADER_SIZE = 16;

export const DEPTH_SOURCE_FORMAT_VERSION = 1;

/**
 * What the photo-to-3D API returned for one photo: kept with the object so its point cloud can be
 * recomputed with other parameters without calling the API (and charging) again.
 */
export interface DepthSource {
  /** Relative depth, row-major, `width × height`; larger is farther from the camera. */
  depth: Float32Array<ArrayBuffer>;
  height: number;
  /** 1 where the depth belongs to the subject (not background, not sky), row-major. */
  mask: Uint8Array<ArrayBuffer>;
  width: number;
}

/**
 * Layout, all little-endian:
 * - 4 bytes: ASCII `BSDM`
 * - uint8: format version
 * - 3 bytes: reserved, zero
 * - uint32: width
 * - uint32: height
 * - width × height × float32: depth
 * - width × height × uint8: mask
 */
export const encodeDepthSource = ({ depth, height, mask, width }: DepthSource): ArrayBuffer => {
  const count = width * height;

  if (!(count > 0) || depth.length !== count || mask.length !== count) {
    throw new Error('Depth source size does not match its dimensions');
  }

  const buffer = new ArrayBuffer(HEADER_SIZE + count * 5);
  const view = new DataView(buffer);

  MAGIC.forEach((value, index) => view.setUint8(index, value));
  view.setUint8(4, DEPTH_SOURCE_FORMAT_VERSION);
  view.setUint32(8, width, true);
  view.setUint32(12, height, true);
  depth.forEach((value, index) => view.setFloat32(HEADER_SIZE + index * 4, value, true));
  new Uint8Array(buffer, HEADER_SIZE + count * 4, count).set(mask);

  return buffer;
};

export const decodeDepthSource = (buffer: ArrayBuffer): DepthSource => {
  if (buffer.byteLength < HEADER_SIZE) throw new Error('Depth source is shorter than its header');

  const view = new DataView(buffer);

  if (MAGIC.some((value, index) => view.getUint8(index) !== value)) {
    throw new Error('Depth source has an invalid magic value');
  }

  const version = view.getUint8(4);

  if (version !== DEPTH_SOURCE_FORMAT_VERSION) throw new Error(`Unsupported depth source version: ${version}`);

  const width = view.getUint32(8, true);
  const height = view.getUint32(12, true);
  const count = width * height;

  if (!count || buffer.byteLength !== HEADER_SIZE + count * 5) {
    throw new Error('Depth source size does not match its dimensions');
  }

  const depth = new Float32Array(count);

  for (let index = 0; index < count; index += 1) depth[index] = view.getFloat32(HEADER_SIZE + index * 4, true);

  return { depth, height, mask: new Uint8Array(buffer.slice(HEADER_SIZE + count * 4)), width };
};

const fromBase64 = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

  return bytes;
};

/** The flux-id `/api/photo-to-3d` payload: base64 float32 LE depth and uint8 mask. */
export const depthSourceFromApi = ({
  depth,
  height,
  mask,
  width,
}: {
  depth: string;
  height: number;
  mask: string;
  width: number;
}): DepthSource => {
  const depthBytes = fromBase64(depth);
  const maskBytes = fromBase64(mask);
  const count = width * height;

  if (!(count > 0) || depthBytes.byteLength !== count * 4 || maskBytes.byteLength !== count) {
    throw new Error('Photo-to-3D response does not match its dimensions');
  }

  const view = new DataView(depthBytes.buffer);
  const values = new Float32Array(count);

  for (let index = 0; index < count; index += 1) values[index] = view.getFloat32(index * 4, true);

  return { depth: values, height, mask: maskBytes, width };
};
