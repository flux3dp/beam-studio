import JSZip from 'jszip';

import { depthMapToDisplayPositions } from './normalization';
import type { HeightField, PointCloudConversionOptions } from './types';

interface NpyFloat32 {
  data: Float32Array;
  shape: number[];
}

/** Minimal NumPy reader for the C-order little-endian float32 depth array produced by Depth Pro. */
export const parseNpyFloat32 = (bytes: Uint8Array): NpyFloat32 => {
  if (bytes.byteLength < 10 || bytes[0] !== 0x93 || new TextDecoder().decode(bytes.subarray(1, 6)) !== 'NUMPY') {
    throw new Error('NPY has an invalid header');
  }

  const majorVersion = bytes[6];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerLengthBytes = majorVersion === 1 ? 2 : 4;
  const headerLength = majorVersion === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
  const headerOffset = 8 + headerLengthBytes;
  const dataOffset = headerOffset + headerLength;
  const header = new TextDecoder().decode(bytes.subarray(headerOffset, dataOffset));
  const dtype = header.match(/['"]descr['"]\s*:\s*['"]([^'"]+)['"]/)?.[1];
  const fortranOrder = header.match(/['"]fortran_order['"]\s*:\s*(True|False)/)?.[1];
  const shapeText = header.match(/['"]shape['"]\s*:\s*\(([^)]*)\)/)?.[1];

  if (dtype !== '<f4' || fortranOrder !== 'False' || shapeText === undefined) {
    throw new Error('Depth Pro NPY must be a C-order little-endian float32 array');
  }

  const shape = shapeText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);
  const valueCount = shape.reduce((count, dimension) => count * dimension, 1);

  if (!shape.length || shape.some((dimension) => !Number.isSafeInteger(dimension) || dimension <= 0)) {
    throw new Error('NPY shape is invalid');
  }

  if (dataOffset + valueCount * Float32Array.BYTES_PER_ELEMENT !== bytes.byteLength) {
    throw new Error('NPY data length does not match its shape');
  }

  const dataView = new DataView(
    bytes.buffer,
    bytes.byteOffset + dataOffset,
    valueCount * Float32Array.BYTES_PER_ELEMENT,
  );
  const data = new Float32Array(valueCount);

  for (let index = 0; index < valueCount; index += 1) {
    data[index] = dataView.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
  }

  return { data, shape };
};

/** Back-project Depth Pro's `out.npz` response into local proportionally scaled positions. */
export const convertDepthProOutput = async (
  buffer: ArrayBuffer,
  options?: PointCloudConversionOptions,
): Promise<Float32Array> => {
  const { data, height, width } = await parseDepthProHeightField(buffer);

  return depthMapToDisplayPositions(data, { ...options, height, width });
};

export const parseDepthProHeightField = async (buffer: ArrayBuffer): Promise<HeightField> => {
  const zip = await JSZip.loadAsync(buffer);
  const depthFile = zip.file('depth.npy');

  if (!depthFile) throw new Error('Depth Pro NPZ has no depth.npy');

  const { data, shape } = parseNpyFloat32(await depthFile.async('uint8array'));

  if (shape.length !== 2) throw new Error('Depth Pro depth.npy must be two-dimensional');

  return { data, height: shape[0], width: shape[1] };
};
