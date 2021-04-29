/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */

// Some Custom Function for Jimp Module
import binomialCoefficient from 'helpers/math/binomial-coefficient';

const Jimp = requireNode('jimp');

const urlToImage = async (url: string) => {
  const resp = await fetch(url);
  const respData = await resp.blob();
  const imageData = await new Response(respData).arrayBuffer();
  const image = await Jimp.read(imageData as Buffer);
  return image;
};

const imageToUrl = async (image, mimeType: string = Jimp.MIME_PNG) => {
  const jimpData = await image.getBufferAsync(mimeType);
  const jimpBlob = new Blob([jimpData]);
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
    return null;
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

const applyKernel = (
  image, kernel: number[][], x: number, y: number, transparentPixel = 255,
) => {
  const value = [0, 0, 0];
  const sizeX = (kernel.length - 1) / 2;
  const sizeY = (kernel[0].length - 1) / 2;

  for (let kx = 0; kx < kernel.length; kx += 1) {
    for (let ky = 0; ky < kernel[kx].length; ky += 1) {
      const idx = image.getPixelIndex(x + kx - sizeX, y + ky - sizeY);
      const alpha = image.bitmap.data[idx + 3] / 255;
      value[0] += (alpha * image.bitmap.data[idx] + (1 - alpha) * transparentPixel)
        * kernel[kx][ky];
      value[1] += (alpha * image.bitmap.data[idx + 1] + (1 - alpha) * transparentPixel)
        * kernel[kx][ky];
      value[2] += (alpha * image.bitmap.data[idx + 2] + (1 - alpha) * transparentPixel)
        * kernel[kx][ky];
    }
  }
  return value;
};

const convolute = (image, kernal: number[][]) => {
  const ksizeX = (kernal.length - 1) / 2;
  const ksizeY = (kernal[0].length - 1) / 2;
  const { width, height } = image.bitmap;
  const startX = ksizeX;
  const startY = ksizeY;
  const w = width - ksizeX;
  const h = height - ksizeY;
  const source = image.clone();
  image.scanQuiet(startX, startY, w, h, (x: number, y: number, idx: number) => {
    const value = applyKernel(source, kernal, x, y);
    image.bitmap.data[idx] = Jimp.limit255(value[0]);
    image.bitmap.data[idx + 1] = Jimp.limit255(value[1]);
    image.bitmap.data[idx + 2] = Jimp.limit255(value[2]);
  });
  return image;
};

const sharpImage = async (imgBlobUrl: string, sharpness: number) => {
  try {
    const image = await urlToImage(imgBlobUrl);
    const kEdge = -sharpness / 2;
    const kCorner = -sharpness / 4;
    const kMid = -4 * (kEdge + kCorner) + 1;
    const kernel = [[kCorner, kEdge, kCorner], [kEdge, kMid, kEdge], [kCorner, kEdge, kCorner]];
    image.convolute(kernel);
    const newImgUrl = imageToUrl(image);
    return await Promise.resolve(newImgUrl);
  } catch (error) {
    console.error('Error when sharping image:', error);
    return null;
  }
};

const unsharpMask = async (imgBlobUrl: string, sharpness: number, radius: number) => {
  try {
    if (sharpness * radius === 0) {
      return imgBlobUrl;
    }
    console.log(sharpness, radius);
    const image = await urlToImage(imgBlobUrl);
    const source = image.clone();
    const sum = 2 ** (2 * radius);
    const kernelH = binomialCoefficient(2 * radius).map((n) => [n / sum]);
    const kernelV = [binomialCoefficient(2 * radius).map((n) => n / sum)];
    convolute(image, kernelH);
    convolute(image, kernelV);
    for (let i = 0; i < image.bitmap.data.length; i += 1) {
      if (i % 4 !== 3) {
        const mask = source.bitmap.data[i] - image.bitmap.data[i];
        const value = Jimp.limit255(source.bitmap.data[i] + sharpness * mask);
        image.bitmap.data[i] = value;
      }
    }
    const newImgUrl = imageToUrl(image);
    return newImgUrl;
  } catch (error) {
    console.error('Error when applying unsharp mask:', error);
    return null;
  }
};

const oneDirectionalGaussianBlur = (image: any, r: number, dir: string): any => {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const r1 = r + 1;
  const blurDecay = 1 + 1 / r;
  const denominator = blurDecay > 1 ? (blurDecay ** r1 - 1) / (blurDecay - 1) : r1;
  const windowR = Array(r1).fill(0);
  const windowG = Array(r1).fill(0);
  const windowB = Array(r1).fill(0);
  const windowA = Array(r1).fill(0);
  let curR;
  let curG;
  let curB;
  let curA;
  let p;
  let iLimit;
  let jLimit;
  if (dir === 'left' || dir === 'right') {
    iLimit = h;
    jLimit = w;
  } else if (dir === 'up' || dir === 'down') {
    iLimit = w;
    jLimit = h;
  }
  for (let i = 0; i < iLimit; i += 1) {
    for (let j = 0; j < jLimit; j += 1) {
      let x;
      let y;
      if (dir === 'left') {
        x = w - 1 - j;
        y = i;
      } else if (dir === 'right') {
        x = j;
        y = i;
      } else if (dir === 'up') {
        x = i;
        y = h - 1 - j;
      } else if (dir === 'down') {
        x = i;
        y = j;
      }
      p = (w * y + x) * 4;
      if (j === 0) {
        curR = image.bitmap.data[p] * denominator;
        curG = image.bitmap.data[p + 1] * denominator;
        curB = image.bitmap.data[p + 2] * denominator;
        curA = image.bitmap.data[p + 3] * denominator;
        windowR.fill(image.bitmap.data[p]);
        windowG.fill(image.bitmap.data[p + 1]);
        windowB.fill(image.bitmap.data[p + 2]);
        windowA.fill(image.bitmap.data[p + 3]);
      } else {
        curR = (curR - windowR.shift()) / blurDecay + image.bitmap.data[p] * blurDecay ** r;
        curG = (curG - windowG.shift()) / blurDecay + image.bitmap.data[p + 1] * blurDecay ** r;
        curB = (curB - windowB.shift()) / blurDecay + image.bitmap.data[p + 2] * blurDecay ** r;
        curA = (curA - windowA.shift()) / blurDecay + image.bitmap.data[p + 3] * blurDecay ** r;
        windowR.push(image.bitmap.data[p]);
        windowG.push(image.bitmap.data[p + 1]);
        windowB.push(image.bitmap.data[p + 2]);
        windowA.push(image.bitmap.data[p + 3]);
      }
      image.bitmap.data[p] = Math.floor(curR / denominator);
      image.bitmap.data[p + 1] = Math.floor(curG / denominator);
      image.bitmap.data[p + 2] = Math.floor(curB / denominator);
      image.bitmap.data[p + 3] = 255;
    }
  }
  return image;
};

const oneDirectionalLinearBlur = (image: any, r: number, dir: string): any => {
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const r1 = r + 1;
  const interval = 0.3;
  const denominator = (1 + 1 + r * interval) * (r1 / 2);
  const windowR = Array(r1).fill(0);
  const windowG = Array(r1).fill(0);
  const windowB = Array(r1).fill(0);
  const windowA = Array(r1).fill(0);
  let curR;
  let curG;
  let curB;
  let sumR;
  let sumG;
  let sumB;
  let lastR;
  let lastG;
  let lastB;
  let p;
  let iLimit;
  let jLimit;
  if (dir === 'left' || dir === 'right') {
    iLimit = h;
    jLimit = w;
  } else if (dir === 'up' || dir === 'down') {
    iLimit = w;
    jLimit = h;
  }
  for (let i = 0; i < iLimit; i += 1) {
    for (let j = 0; j < jLimit; j += 1) {
      let x;
      let y;
      if (dir === 'left') {
        x = w - 1 - j;
        y = i;
      } else if (dir === 'right') {
        x = j;
        y = i;
      } else if (dir === 'up') {
        x = i;
        y = h - 1 - j;
      } else if (dir === 'down') {
        x = i;
        y = j;
      }

      p = (w * y + x) * 4;

      if (j === 0) {
        curR = image.bitmap.data[p] * denominator;
        sumR = image.bitmap.data[p] * r1;
        curG = image.bitmap.data[p + 1] * denominator;
        sumG = image.bitmap.data[p + 1] * r1;
        curB = image.bitmap.data[p + 2] * denominator;
        sumB = image.bitmap.data[p + 2] * r1;
        windowR.fill(image.bitmap.data[p]);
        windowG.fill(image.bitmap.data[p + 1]);
        windowB.fill(image.bitmap.data[p + 2]);
        windowA.fill(image.bitmap.data[p + 3]);
      } else {
        lastR = windowR.shift();
        lastG = windowG.shift();
        lastB = windowB.shift();
        curR += image.bitmap.data[p] * (1 + r * interval) - lastR - interval * (sumR - lastR);
        sumR += image.bitmap.data[p] - lastR;
        curG += image.bitmap.data[p + 1] * (1 + r * interval) - lastG - interval * (sumG - lastG);
        sumG += image.bitmap.data[p + 1] - lastG;
        curB += image.bitmap.data[p + 2] * (1 + r * interval) - lastB - interval * (sumB - lastB);
        sumB += image.bitmap.data[p + 2] - lastB;
        windowR.push(image.bitmap.data[p]);
        windowG.push(image.bitmap.data[p + 1]);
        windowB.push(image.bitmap.data[p + 2]);
        windowA.push(image.bitmap.data[p + 3]);
      }
      image.bitmap.data[p] = Math.floor(curR / denominator);
      image.bitmap.data[p + 1] = Math.floor(curG / denominator);
      image.bitmap.data[p + 2] = Math.floor(curB / denominator);
      image.bitmap.data[p + 3] = 255;
    }
  }
  return image;
};

// Do four directional blur and take max value
const stampBlur = (image, r: number) => {
  const blurredImages = [];
  blurredImages[0] = oneDirectionalLinearBlur(image.clone(), r, 'left');
  blurredImages[1] = oneDirectionalLinearBlur(image.clone(), r, 'right');
  blurredImages[2] = oneDirectionalLinearBlur(image.clone(), r, 'up');
  blurredImages[3] = oneDirectionalLinearBlur(image, r, 'down');
  for (let i = 0; i < image.bitmap.data.length; i += 1) {
    if (i % 4 !== 3) {
      image.bitmap.data[i] = Math.min(
        blurredImages[0].bitmap.data[i],
        blurredImages[1].bitmap.data[i],
        blurredImages[2].bitmap.data[i],
        blurredImages[3].bitmap.data[i],
      );
    }
  }
  return image;
};

const regulateBlurredImage = (image): void => {
  const brightness = image.bitmap.data.filter((p, i) => i % 4 === 0);
  let max = brightness[0];
  let min = brightness[0];
  brightness.forEach((v) => {
    max = Math.max(v, max);
    min = Math.min(v, min);
  });
  const BLACK_CAP = 0;
  for (let i = 0; i < image.bitmap.data.length; i += 4) {
    let v = image.bitmap.data[i];
    v = (v - min) / (max - min);
    if (v < 0.3) {
      v = Math.round((v) ** 1.5 * (255 - BLACK_CAP)) + BLACK_CAP;
    } else if (v < 0.7) {
      const power = 1.5 + 2.5 * (v - 0.3);
      v = Math.round((v) ** power * (255 - BLACK_CAP)) + BLACK_CAP;
    } else {
      const power = 2.5 + 5 * (v - 0.7);
      v = Math.round((v) ** power * (255 - BLACK_CAP)) + BLACK_CAP;
    }

    image.bitmap.data[i] = v;
    image.bitmap.data[i + 1] = v;
    image.bitmap.data[i + 2] = v;
    image.bitmap.data[i + 3] = 255;
  }
};

const binarizeImage = async (image, threshold: number): Promise<void> => {
  await image.greyscale();
  for (let i = 0; i < image.bitmap.data.length; i += 4) {
    if (image.bitmap.data[i] >= threshold || image.bitmap.data[i + 3] === 0) {
      image.bitmap.data[i] = 255;
      image.bitmap.data[i + 1] = 255;
      image.bitmap.data[i + 2] = 255;
      image.bitmap.data[i + 3] = 0;
    } else {
      image.bitmap.data[i] = 0;
      image.bitmap.data[i + 1] = 0;
      image.bitmap.data[i + 2] = 0;
      image.bitmap.data[i + 3] = 255;
    }
  }
};

const generateStampBevel = async (imgBlobUrl: string, threshold: number) => {
  try {
    const image = await urlToImage(imgBlobUrl);
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    await binarizeImage(image, threshold);
    const origImage = image.clone();
    await stampBlur(origImage, Math.ceil(Math.min(w, h) / 30));
    regulateBlurredImage(origImage);
    image.composite(origImage, 0, 0, {
      mode: Jimp.BLEND_OVERLAY,
      opacitySource: 1,
      opacityDest: 1,
    });
    const newImgUrl = imageToUrl(image);
    return await Promise.resolve(newImgUrl);
  } catch (error) {
    console.error('Error when generating stamp bevel:', error);
    return null;
  }
};

export default {
  oneDirectionalGaussianBlur,
  oneDirectionalLinearBlur,
  stampBlur,
  regulateBlurredImage,
  urlToImage,
  imageToUrl,
  colorInvert,
  cropImage,
  curveOperate,
  sharpImage,
  unsharpMask,
  generateStampBevel,
  binarizeImage,
};
