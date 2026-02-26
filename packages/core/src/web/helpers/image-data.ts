/**
 * To get image data
 */
import exifr from 'exifr';

import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import imageProcessor from '@core/implementations/imageProcessor';
import type { IImageDataResult } from '@core/interfaces/IImage';

import grayScale from './grayscale';
import getExifRotationFlag from './image/getExifRotationFlag';

const MAX_IMAGE_PIXEL = 1e8;

export const imageData = async (
  source: Blob | string,
  opts: {
    grayscale?: {
      is_rgba: boolean;
      is_shading: boolean;
      is_svg: boolean;
      threshold: number;
    };
    height?: number;
    isFullResolution?: boolean;
    onComplete?: (result: IImageDataResult) => Promise<void> | void;
    purpose?: string;
    rotationFlag?: number;
    type?: string;
    width?: number;
  },
) => {
  opts.onComplete = opts.onComplete || (() => {});
  opts.type = opts.type || 'image/png';

  // using jimp is slower, but generate correct white for full color image
  // using new Image() is faster, but generated white somehow chage from (255, 255, 255) into (252, 254, 255)
  // now we use jimp for full color image, and use new Image() for grayscale image
  if (opts.grayscale === undefined) {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    let exifrData;

    try {
      exifrData = await exifr.parse(url, { icc: true });
    } catch {
      console.error('Failed to parse exif data');
    }

    const isCMYK = exifrData?.ColorSpaceData === 'CMYK';
    const resp = await fetch(url);

    if (opts?.purpose !== 'splitting' && isCMYK) {
      const blob = await resp.blob();
      const jpgBase64 = await new Promise<string>((resolve) => {
        const fileReader = new FileReader();

        fileReader.onload = () => {
          const base64String = (fileReader.result as string).split(',')[1];

          resolve(`data:image/jpeg;base64,${base64String}`);
        };
        fileReader.readAsDataURL(blob);
      });

      // for cmyk image display, we use the source url to display icc profile color
      opts.onComplete({
        pngBase64: jpgBase64,
      });

      return;
    }

    const arrayBuffer = await resp.arrayBuffer();
    const image = await imageProcessor.read(arrayBuffer as unknown as Buffer);

    if (typeof source !== 'string') {
      URL.revokeObjectURL(url);
    }

    const imageCanvas = document.createElement('canvas');

    imageCanvas.width = image.bitmap.width;
    imageCanvas.height = image.bitmap.height;

    const imageCtx = imageCanvas.getContext('2d') as CanvasRenderingContext2D;
    const imageData = imageCtx.createImageData(imageCanvas.width, imageCanvas.height);

    imageData.data.set(image.bitmap.data);
    imageCtx.putImageData(imageData, 0, 0);

    const resultCanvas = document.createElement('canvas');
    const resultCtx = resultCanvas.getContext('2d') as CanvasRenderingContext2D;

    const size = {
      height: opts.height || image.bitmap.height,
      width: opts.width || image.bitmap.width,
    };

    // DownSampling
    if (!opts.isFullResolution) {
      const imageDownsampling = useGlobalPreferenceStore.getState()['image_downsampling'];

      if (imageDownsampling !== false) {
        const longSide = Math.max(size.width, size.height);
        const downRatio = Math.min(1, (1.5 * window.innerWidth) / longSide);

        if (downRatio < 1) {
          size.width = Math.round(size.width * downRatio);
          size.height = Math.round(size.height * downRatio);
        }
      }

      if (size.width * size.height > MAX_IMAGE_PIXEL) {
        const downRatio = Math.sqrt(MAX_IMAGE_PIXEL / (size.width * size.height));

        size.width = Math.floor(size.width * downRatio);
        size.height = Math.floor(size.height * downRatio);

        console.log(`Size exceeds MAX_IMAGE_PIXEL, downsample to ${size.width} * ${size.height}`);
      }
    }

    resultCanvas.width = size.width;
    resultCanvas.height = size.height;
    resultCtx.drawImage(imageCanvas, 0, 0, imageCanvas.width, imageCanvas.height, 0, 0, size.width, size.height);

    const resultImageData = resultCtx.getImageData(0, 0, size.width, size.height);

    if (typeof opts.grayscale !== 'undefined') {
      const grayScaledBinary = grayScale(resultImageData.data, opts.grayscale);

      resultImageData.data.set(grayScaledBinary);
      resultCtx.putImageData(resultImageData, 0, 0);
    }

    const pngBase64 = resultCanvas.toDataURL('image/png');

    await opts.onComplete?.({
      blob: new Blob([resultImageData.data], { type: opts.type }),
      canvas: resultCanvas,
      data: resultImageData,
      imageBinary: resultImageData.data,
      pngBase64,
      size,
    });
  } else {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const onload = async (e: any) => {
      const size = {
        height: opts.height || e.target.naturalHeight,
        width: opts.width || e.target.naturalWidth,
      };
      let imageBinary: Uint8ClampedArray;
      const response = await fetch(img.src);
      const arrayBuffer = await response.arrayBuffer();
      const rotationFlag = getExifRotationFlag(arrayBuffer);

      // DownSampling
      if (!opts.isFullResolution) {
        if (useGlobalPreferenceStore.getState()['image_downsampling']) {
          const longSide = Math.max(size.width, size.height);
          const downRatio = Math.min(1, (1.5 * window.innerWidth) / longSide);

          size.width = Math.round(size.width * downRatio);
          size.height = Math.round(size.height * downRatio);
        }

        if (size.width * size.height > MAX_IMAGE_PIXEL) {
          const downRatio = Math.sqrt(MAX_IMAGE_PIXEL / (size.width * size.height));

          size.width = Math.floor(size.width * downRatio);
          size.height = Math.floor(size.height * downRatio);

          console.log(`Size exceeds MAX_IMAGE_PIXEL, downsample to ${size.width} * ${size.height}`);
        }
      }

      let w = size.width;
      let h = size.height;
      let rotation = 0;
      let shouldFlip = false;

      ctx.save();

      if (rotationFlag && rotationFlag > 1) {
        if (rotationFlag > 4) {
          [w, h] = [h, w];
        }

        switch (rotationFlag) {
          case 2:
            shouldFlip = true;
            break;
          case 3:
            rotation = Math.PI;
            break;
          case 4:
            rotation = Math.PI;
            shouldFlip = true;
            break;
          case 5:
            shouldFlip = true;
            rotation = Math.PI / 2;
            break;
          case 6:
            rotation = Math.PI / 2;
            break;
          case 7:
            shouldFlip = true;
            rotation = -Math.PI / 2;
            break;
          case 8:
            rotation = -Math.PI / 2;
            break;
          default:
            break;
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.translate(w / 2, h / 2);

      if (shouldFlip) {
        ctx.scale(-1, 1);
      }

      ctx.rotate(rotation);
      ctx.drawImage(img, -size.width / 2, -size.height / 2, size.width, size.height);
      ctx.restore();

      const imageData = ctx.createImageData(w, h);

      imageBinary = ctx.getImageData(0, 0, w, h).data;

      if (typeof opts.grayscale !== 'undefined') {
        imageBinary = grayScale(imageBinary, opts.grayscale) as unknown as Uint8ClampedArray;
      }

      imageData.data.set(imageBinary);

      ctx.putImageData(imageData, 0, 0);

      const pngBase64 = canvas.toDataURL('image/png');

      await opts.onComplete?.({
        blob: new Blob([imageData.data], { type: opts.type }),
        canvas,
        data: imageData,
        imageBinary,
        pngBase64,
        size,
      });

      // remove event
      img.removeEventListener('load', onload, false);
    };

    img.addEventListener('load', onload, false);

    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    }
  }
};

export default imageData;
