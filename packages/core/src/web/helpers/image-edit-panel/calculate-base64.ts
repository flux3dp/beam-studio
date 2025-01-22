import imageData from '@core/helpers/image-data';
import type { IImageDataResult } from '@core/interfaces/IImage';

const calculateBase64 = (
  blobUrl: string,
  isShading: boolean,
  threshold: number,
  isFullColor = false,
): Promise<string> =>
  new Promise<string>((resolve) => {
    imageData(blobUrl, {
      grayscale: isFullColor
        ? undefined
        : {
            is_rgba: true,
            is_shading: isShading,
            is_svg: false,
            threshold,
          },
      isFullResolution: true,
      onComplete: (result: IImageDataResult) => {
        resolve(result.pngBase64);
      },
    });
  });

export default calculateBase64;
