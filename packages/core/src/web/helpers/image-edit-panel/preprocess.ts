import type Jimp from 'jimp';

import jimpHelper from '@core/helpers/jimp-helper';

import imageProcessor from '@app/implementations/imageProcessor';

export interface CropperDimension {
  height: number;
  width: number;
  x: number;
  y: number;
}

export const preprocessByJimpImage = async (
  image: Jimp,
  blobUrl: string,
  { isFullResolution = false } = {},
): Promise<{
  blobUrl: string;
  dimension: CropperDimension;
  originalHeight: number;
  originalWidth: number;
}> => {
  const { height: originalHeight, width: originalWidth } = image.bitmap;
  let currentBlobUrl = blobUrl;

  if (!isFullResolution && Math.max(originalWidth, originalHeight) > 600) {
    if (originalWidth >= originalHeight) {
      image.resize(600, imageProcessor.AUTO);
    } else {
      image.resize(imageProcessor.AUTO, 600);
    }

    currentBlobUrl = await jimpHelper.imageToUrl(image);
  }

  const { height, width } = image.bitmap;
  const dimension: CropperDimension = { height, width, x: 0, y: 0 };

  return { blobUrl: currentBlobUrl, dimension, originalHeight, originalWidth };
};

export const preprocessByUrl = async (
  blobUrl: string,
  { isFullResolution = false } = {},
): Promise<{
  blobUrl: string;
  dimension: CropperDimension;
  originalHeight: number;
  originalWidth: number;
}> => {
  const image = await jimpHelper.urlToImage(blobUrl);

  return preprocessByJimpImage(image, blobUrl, { isFullResolution });
};
