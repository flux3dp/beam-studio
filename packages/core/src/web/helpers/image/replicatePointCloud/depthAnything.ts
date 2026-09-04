import { depthMapToDisplayPositions } from './normalization';
import type { DepthAnythingOutput, HeightField, PointCloudConversionOptions, ReplicateTensor } from './types';

const decodeBase64 = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);

  return bytes;
};

const getTensorSize = (tensor: ReplicateTensor): number =>
  tensor.shape.reduce((size, dimension) => size * dimension, 1);

export const decodeFloatTensor = (tensor: ReplicateTensor): Float32Array => {
  if (!['<f4', 'float32'].includes(tensor.dtype)) throw new Error(`Unsupported float tensor dtype: ${tensor.dtype}`);

  const bytes = decodeBase64(tensor.data);
  const size = getTensorSize(tensor);

  if (bytes.byteLength !== size * Float32Array.BYTES_PER_ELEMENT) {
    throw new Error('Float tensor byte length does not match its shape');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = new Float32Array(size);

  for (let index = 0; index < size; index += 1) {
    result[index] = view.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true);
  }

  return result;
};

export const decodeByteTensor = (tensor: ReplicateTensor): Uint8Array => {
  if (!['bool', 'uint8', '|b1', '|u1'].includes(tensor.dtype)) {
    throw new Error(`Unsupported byte tensor dtype: ${tensor.dtype}`);
  }

  const bytes = decodeBase64(tensor.data);

  if (bytes.byteLength !== getTensorSize(tensor)) throw new Error('Byte tensor length does not match its shape');

  return bytes;
};

const decodeAlphaMask = (tensor?: ReplicateTensor): Float32Array | Uint8Array | undefined => {
  if (!tensor) return undefined;

  return ['<f4', 'float32'].includes(tensor.dtype) ? decodeFloatTensor(tensor) : decodeByteTensor(tensor);
};

export const parseDepthAnythingHeightField = (input: DepthAnythingOutput | string): HeightField => {
  const output = typeof input === 'string' ? (JSON.parse(input) as DepthAnythingOutput) : input;
  const [height, width] = output.depth.shape;

  if (output.depth.shape.length !== 2 || !Number.isSafeInteger(width) || !Number.isSafeInteger(height)) {
    throw new Error('Depth Anything output.depth must have a [height, width] shape');
  }

  const alphaMask = decodeAlphaMask(output.alpha_mask);
  const skyMask = output.sky_mask ? decodeByteTensor(output.sky_mask) : undefined;
  let mask: Float32Array | Uint8Array | undefined;

  if (alphaMask || skyMask) {
    mask = new Float32Array(width * height);

    for (let index = 0; index < mask.length; index += 1) {
      mask[index] = (alphaMask?.[index] ?? 1) > 0 && !skyMask?.[index] ? 1 : 0;
    }
  }

  return { data: decodeFloatTensor(output.depth), height, mask, width };
};

/** Back-project Depth Anything V3 Mono or Metric JSON into proportionally scaled local positions. */
export const convertDepthAnythingV3Output = (
  input: DepthAnythingOutput | string,
  options: PointCloudConversionOptions = {},
): Float32Array => {
  const { data, height, mask, width } = parseDepthAnythingHeightField(input);

  return depthMapToDisplayPositions(data, {
    ...options,
    alphaMask: mask,
    height,
    width,
  });
};

/** Turn the uint8 RGB(A) `image` tensor used by vufinder outputs into an importable PNG. */
export const tensorJsonImageToBlob = async (input: DepthAnythingOutput | string): Promise<Blob> => {
  const output = typeof input === 'string' ? (JSON.parse(input) as DepthAnythingOutput) : input;
  const tensor = output.image;

  if (!tensor || tensor.shape.length !== 3 || ![3, 4].includes(tensor.shape[2])) {
    throw new Error('Replicate tensor JSON has no uint8 RGB image');
  }

  const [height, width, channels] = tensor.shape;
  const source = decodeByteTensor(tensor);
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) throw new Error('Unable to decode Replicate sample image');

  const imageData = context.createImageData(width, height);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    imageData.data[pixel * 4] = source[pixel * channels];
    imageData.data[pixel * 4 + 1] = source[pixel * channels + 1];
    imageData.data[pixel * 4 + 2] = source[pixel * channels + 2];
    imageData.data[pixel * 4 + 3] = channels === 4 ? source[pixel * channels + 3] : 255;
  }

  context.putImageData(imageData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to encode Replicate sample image'));
    }, 'image/png');
  });
};
