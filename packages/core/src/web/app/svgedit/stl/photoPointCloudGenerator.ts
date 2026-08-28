import { PHOTO_3D_ATTR } from './constants';
import type { StlEngravingParams } from './engravingParams';
import { getStlEngravingParams } from './engravingParams';
import { getPhotoTextureUrl } from './photoPlane';
import { encodePointCloud } from './pointCloud';

const MAX_SAMPLE_COUNT = 10_000_000;

interface PhotoPointCloudOptions {
  heightMm: number;
  layerHeight: number;
  pointSpacing: number;
  widthMm: number;
}

type RasterData = Pick<ImageData, 'data' | 'height' | 'width'>;

/**
 * Convert a processed grayscale bitmap into local XYZ points for the frontend-only relief preview.
 *
 * XY samples are distributed no farther apart than `pointSpacing`. Z uses 256 discrete levels:
 * opaque white is the base at zero, opaque black is 255 × `layerHeight`, and transparent pixels
 * are omitted. This intentionally simple mapping can be replaced by the relief API without changing
 * the BSPC storage and rendering path.
 */
export const createPhotoPointPositions = (
  imageData: RasterData,
  { heightMm, layerHeight, pointSpacing, widthMm }: PhotoPointCloudOptions,
): Float32Array => {
  if (!(widthMm > 0) || !(heightMm > 0) || !(layerHeight > 0) || !(pointSpacing > 0)) {
    throw new Error('Photo point-cloud dimensions and sampling parameters must be positive');
  }

  const columns = Math.max(1, Math.ceil(widthMm / pointSpacing));
  const rows = Math.max(1, Math.ceil(heightMm / pointSpacing));
  const sampleCount = columns * rows;

  if (sampleCount > MAX_SAMPLE_COUNT) {
    throw new Error(`Photo point cloud would exceed ${MAX_SAMPLE_COUNT} samples`);
  }

  const positions: number[] = [];

  for (let row = 0; row < rows; row += 1) {
    const yRatio = (row + 0.5) / rows;
    const pixelY = Math.min(imageData.height - 1, Math.floor(yRatio * imageData.height));

    for (let column = 0; column < columns; column += 1) {
      const xRatio = (column + 0.5) / columns;
      const pixelX = Math.min(imageData.width - 1, Math.floor(xRatio * imageData.width));
      const pixelIndex = (pixelY * imageData.width + pixelX) * 4;
      const alpha = imageData.data[pixelIndex + 3];

      if (alpha === 0) continue;

      const red = imageData.data[pixelIndex];
      const green = imageData.data[pixelIndex + 1];
      const blue = imageData.data[pixelIndex + 2];
      const grayscale = Math.round(red * 0.299 + green * 0.587 + blue * 0.114);
      const z = (255 - grayscale) * layerHeight;

      positions.push((xRatio - 0.5) * widthMm, (0.5 - yRatio) * heightMm, z);
    }
  }

  if (!positions.length) throw new Error('Photo point cloud has no visible pixels');

  return new Float32Array(positions);
};

const loadRasterData = async (source: string): Promise<RasterData> => {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to load the processed photo'));
    image.src = source;
  });

  const canvas = document.createElement('canvas');

  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context || !canvas.width || !canvas.height) throw new Error('Unable to read the processed photo');

  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

/** Generate a BSPC buffer from the photo's current processed SVG image. */
export const generatePhotoPointCloud = async (
  elem: SVGImageElement,
  params: StlEngravingParams = getStlEngravingParams(elem),
): Promise<ArrayBuffer> => {
  const source = getPhotoTextureUrl(elem);
  const widthMm = Number(elem.getAttribute(PHOTO_3D_ATTR.width));
  const heightMm = Number(elem.getAttribute(PHOTO_3D_ATTR.height));

  if (!source) throw new Error('Photo has no processed image source');

  const imageData = await loadRasterData(source);
  const positions = createPhotoPointPositions(imageData, {
    heightMm,
    layerHeight: params.layerHeight,
    pointSpacing: params.pointSpacing,
    widthMm,
  });

  return encodePointCloud(positions);
};
