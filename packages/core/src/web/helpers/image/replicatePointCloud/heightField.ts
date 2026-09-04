import { BufferGeometry, Float32BufferAttribute, Mesh } from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

import type { HeightField, PointCloudConversionOptions } from './types';

const DEFAULT_GRID_SIZE = 256;
const DEFAULT_RELIEF_DEPTH_RATIO = 0.22;
const DEFAULT_WIDTH_MM = 100;

const getGridSize = (width: number, height: number, maxGridSize: number): [number, number] => {
  const scale = Math.min(1, maxGridSize / Math.max(width, height));

  return [Math.max(2, Math.round(width * scale)), Math.max(2, Math.round(height * scale))];
};

const getPercentile = (values: number[], percentile: number): number =>
  values[Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * percentile)))];

/** Build an indexed, lit height-field surface from raw scalar depth or height values. */
export const createReliefGeometry = (field: HeightField, options: PointCloudConversionOptions = {}): BufferGeometry => {
  const { data, height, mask, width } = field;

  if (width < 2 || height < 2 || data.length !== width * height || (mask && mask.length !== data.length)) {
    throw new Error('Relief height field dimensions are invalid');
  }

  const validValues = Array.from(data).filter((value, index) => Number.isFinite(value) && (!mask || mask[index] > 0));

  if (validValues.length < 2) throw new Error('Relief height field has no usable depth values');

  validValues.sort((first, second) => first - second);

  const lower = getPercentile(validValues, 0.01);
  const upper = getPercentile(validValues, 0.99);
  const range = upper - lower;

  if (!(range > 0)) throw new Error('Relief height field has no depth variation');

  const maxGridSize = Math.max(2, Math.round(options.maxGridSize ?? DEFAULT_GRID_SIZE));
  const [gridWidth, gridHeight] = getGridSize(width, height, maxGridSize);
  const widthMm = options.widthMm ?? DEFAULT_WIDTH_MM;
  const heightMm = widthMm * (height / width);
  const depthMm = widthMm * (options.reliefDepthRatio ?? DEFAULT_RELIEF_DEPTH_RATIO);
  const positions = new Float32Array(gridWidth * gridHeight * 3);

  for (let row = 0; row < gridHeight; row += 1) {
    const sourceY = Math.round((row * (height - 1)) / (gridHeight - 1));

    for (let column = 0; column < gridWidth; column += 1) {
      const sourceX = Math.round((column * (width - 1)) / (gridWidth - 1));
      const sourceIndex = sourceY * width + sourceX;
      const targetIndex = (row * gridWidth + column) * 3;
      const isValid = Number.isFinite(data[sourceIndex]) && (!mask || mask[sourceIndex] > 0);
      const normalized = isValid ? Math.min(1, Math.max(0, (data[sourceIndex] - lower) / range)) : 0;
      const heightRatio = isValid && options.invertDepth ? 1 - normalized : normalized;

      positions[targetIndex] = (column / (gridWidth - 1) - 0.5) * widthMm;
      positions[targetIndex + 1] = (0.5 - row / (gridHeight - 1)) * heightMm;
      positions[targetIndex + 2] = heightRatio * depthMm;
    }
  }

  const indices: number[] = [];

  for (let row = 0; row < gridHeight - 1; row += 1) {
    for (let column = 0; column < gridWidth - 1; column += 1) {
      const topLeft = row * gridWidth + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + gridWidth;
      const bottomRight = bottomLeft + 1;

      indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
    }
  }

  const geometry = new BufferGeometry();

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  return geometry;
};

/** Use the same normalized height field as the relief mesh, but retain only its vertices. */
export const createReliefPointPositions = (
  field: HeightField,
  options: PointCloudConversionOptions = {},
): Float32Array => {
  const positions = createReliefGeometry(field, options).getAttribute('position').array;

  return Float32Array.from(positions);
};

/** Decode a fetched grayscale depth/height image through the browser image pipeline. */
export const imageBlobToHeightField = async (blob: Blob): Promise<HeightField> => {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();

    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to decode relief depth image'));
    });

    const canvas = document.createElement('canvas');

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) throw new Error('Unable to read relief depth image');

    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const data = new Float32Array(canvas.width * canvas.height);
    const mask = new Uint8Array(data.length);

    for (let pixel = 0; pixel < data.length; pixel += 1) {
      const offset = pixel * 4;

      data[pixel] = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
      mask[pixel] = pixels[offset + 3];
    }

    return { data, height: canvas.height, mask, width: canvas.width };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const exportReliefGeometry = (geometry: BufferGeometry): ArrayBuffer => {
  const exported = new STLExporter().parse(new Mesh(geometry), { binary: true }) as DataView;

  return exported.buffer.slice(exported.byteOffset, exported.byteOffset + exported.byteLength) as ArrayBuffer;
};
