import imageData from 'helpers/image-data';

import { IImageDataResult } from 'interfaces/IImage';

const calculateBase64 = (
  blobUrl: string,
  isShading: boolean,
  threshold: number,
  isFullColor = false
): Promise<string> =>
  new Promise<string>((resolve) => {
    imageData(blobUrl, {
      grayscale: isFullColor
        ? undefined
        : {
            is_rgba: true,
            is_shading: isShading,
            threshold,
            is_svg: false,
          },
      isFullResolution: true,
      onComplete: (result: IImageDataResult) => {
        resolve(result.pngBase64);
      },
    });
  });

export default calculateBase64;
