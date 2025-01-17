import imageProcessor from 'implementations/imageProcessor';
import jimpHelper from 'helpers/jimp-helper';
import Jimp from 'jimp';

export interface CropperDimension {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const preprocessByJimpImage = async (
  image: Jimp,
  blobUrl: string,
  { isFullResolution = false } = {}
): Promise<{
  blobUrl: string;
  dimension: CropperDimension;
  originalWidth: number;
  originalHeight: number;
}> => {
  const { width: originalWidth, height: originalHeight } = image.bitmap;
  let currentBlobUrl = blobUrl;

  if (!isFullResolution && Math.max(originalWidth, originalHeight) > 600) {
    if (originalWidth >= originalHeight) {
      image.resize(600, imageProcessor.AUTO);
    } else {
      image.resize(imageProcessor.AUTO, 600);
    }
    currentBlobUrl = await jimpHelper.imageToUrl(image);
  }

  const { width, height } = image.bitmap;
  const dimension: CropperDimension = { x: 0, y: 0, width, height };

  return { blobUrl: currentBlobUrl, dimension, originalWidth, originalHeight };
};

export const preprocessByUrl = async (
  blobUrl: string,
  { isFullResolution = false } = {}
): Promise<{
  blobUrl: string;
  dimension: CropperDimension;
  originalWidth: number;
  originalHeight: number;
}> => {
  const image = await jimpHelper.urlToImage(blobUrl);

  return preprocessByJimpImage(image, blobUrl, { isFullResolution });
};
