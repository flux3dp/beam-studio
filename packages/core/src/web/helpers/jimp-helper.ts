import type Jimp from 'jimp/*';

import imageProcessor from '@core/implementations/imageProcessor';

const urlToImage = async (url: string) => {
  const resp = await fetch(url);
  const arrayBuffer = await resp.arrayBuffer();
  const image = await imageProcessor.read(arrayBuffer as unknown as Buffer);

  return image;
};

const imageToUrl = async (image: Jimp, mimeType: string = imageProcessor.MIME_PNG) => {
  const jimpData = await image.getBufferAsync(mimeType);
  const jimpBlob = new Blob([jimpData as unknown as ArrayBuffer], { type: mimeType });
  const src = URL.createObjectURL(jimpBlob);

  return src;
};

const colorInvert = async (imgBlobUrl: string): Promise<string> => {
  try {
    const image = await urlToImage(imgBlobUrl);

    image.invert();

    const newImgUrl = imageToUrl(image);

    return await Promise.resolve(newImgUrl);
  } catch (error) {
    console.error('Error when inverting color:', error);

    return '';
  }
};

const cropImage = async (imgBlobUrl: string, x: number, y: number, w: number, h: number) => {
  try {
    const image = await urlToImage(imgBlobUrl);

    image.crop(x, y, w, h);

    const newImgUrl = imageToUrl(image);

    return await Promise.resolve(newImgUrl);
  } catch (error) {
    console.error('Error when croping image', error);

    return null;
  }
};

const curveOperate = async (imgBlobUrl: string, curveMap: number[]) => {
  try {
    const image = await urlToImage(imgBlobUrl);

    for (let i = 0; i < image.bitmap.data.length; i += 1) {
      if (i % 4 !== 3) {
        image.bitmap.data[i] = curveMap[image.bitmap.data[i]];
      }
    }

    const newImgUrl = imageToUrl(image);

    return await Promise.resolve(newImgUrl);
  } catch (error) {
    console.error('Error when curve operating', error);

    return null;
  }
};

const sharpImage = async (imgBlobUrl: string, sharpness: number) => {
  try {
    const image = await urlToImage(imgBlobUrl);
    const kEdge = -sharpness / 2;
    const kCorner = -sharpness / 4;
    const kMid = -4 * (kEdge + kCorner) + 1;
    const kernel = [
      [kCorner, kEdge, kCorner],
      [kEdge, kMid, kEdge],
      [kCorner, kEdge, kCorner],
    ];

    image.convolute(kernel);

    const newImgUrl = imageToUrl(image);

    return await Promise.resolve(newImgUrl);
  } catch (error) {
    console.error('Error when sharping image:', error);

    return null;
  }
};

export default {
  colorInvert,
  cropImage,
  curveOperate,
  imageToUrl,
  sharpImage,
  urlToImage,
};
