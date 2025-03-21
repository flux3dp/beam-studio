import { PrintingColors } from '@core/app/constants/color-constants';
import getUtilWS from '@core/helpers/api/utils-ws';

const handleRgb = async (rgbBlob: Blob): Promise<Partial<Record<PrintingColors, string>>> => {
  const utilWS = getUtilWS();

  try {
    const { c, k, m, y } = await utilWS.splitColor(rgbBlob, { colorType: 'rgb' });

    return {
      [PrintingColors.BLACK]: k,
      [PrintingColors.CYAN]: c,
      [PrintingColors.MAGENTA]: m,
      [PrintingColors.YELLOW]: y,
    };
  } catch (error) {
    console.error('Failed to split color', error);
  }

  // Handle when splitColor is not support by firmware in web version
  // Can remove this if make sure firmware is updated
  const blob = (await utilWS.transformRgbImageToCmyk(rgbBlob, { resultType: 'binary' })) as Blob;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  await new Promise<void>((resolve) => {
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve();
    };
    img.src = URL.createObjectURL(blob);
  });

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const channelDatas = [
    new Uint8ClampedArray(data.length),
    new Uint8ClampedArray(data.length),
    new Uint8ClampedArray(data.length),
    new Uint8ClampedArray(data.length),
  ];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    let kValue = 255 - Math.max(r, g, b);
    const cValue = Math.round(255 - r - kValue);
    const mValue = Math.round(255 - g - kValue);
    const yValue = Math.round(255 - b - kValue);

    kValue = Math.round(kValue);

    const colors = [255 - kValue, 255 - cValue, 255 - mValue, 255 - yValue];

    for (let j = 0; j < colors.length; j += 1) {
      channelDatas[j][i] = colors[j];
      channelDatas[j][i + 1] = colors[j];
      channelDatas[j][i + 2] = colors[j];
      channelDatas[j][i + 3] = a;
    }
  }

  const result = {
    [PrintingColors.BLACK]: '',
    [PrintingColors.CYAN]: '',
    [PrintingColors.MAGENTA]: '',
    [PrintingColors.YELLOW]: '',
  };

  imageData.data.set(channelDatas[0]);
  ctx.putImageData(imageData, 0, 0);
  [, result[PrintingColors.BLACK]] = canvas.toDataURL('image/jpeg', 1).split(',');
  imageData.data.set(channelDatas[1]);
  ctx.putImageData(imageData, 0, 0);
  [, result[PrintingColors.CYAN]] = canvas.toDataURL('image/jpeg', 1).split(',');
  imageData.data.set(channelDatas[2]);
  ctx.putImageData(imageData, 0, 0);
  [, result[PrintingColors.MAGENTA]] = canvas.toDataURL('image/jpeg', 1).split(',');
  imageData.data.set(channelDatas[3]);
  ctx.putImageData(imageData, 0, 0);
  [, result[PrintingColors.YELLOW]] = canvas.toDataURL('image/jpeg', 1).split(',');

  return result;
};

/**
 * split img into desired color channels, return null if empty
 */
// TODO: add unit test
const splitColor = async (
  rgbBlob: Blob,
  cmykBlob?: { c: Blob; k: Blob; m: Blob; y: Blob },
  opts: {
    includeWhite?: boolean;
  } = {},
): Promise<Array<{ color: PrintingColors; data: Blob | null }>> => {
  const { includeWhite = false } = opts;
  const rgbRes = await handleRgb(rgbBlob);
  const channelDatas: Uint8ClampedArray[] = [null, null, null, null] as any; // null as placeholder
  let width: number = 0;
  let height: number = 0;
  const colorOrder = [PrintingColors.BLACK, PrintingColors.CYAN, PrintingColors.MAGENTA, PrintingColors.YELLOW];
  const promises = colorOrder.map((color, i) => {
    const base64 = rgbRes[color];
    const img = new Image();

    return new Promise<Blob | null>((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');

        canvas.width = img.width;
        canvas.height = img.height;
        width = img.width;
        height = img.height;

        const ctx = canvas.getContext('2d')!;

        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => resolve(blob));

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        channelDatas[i] = new Uint8ClampedArray(data);
      };
      img.src = `data:image/jpeg;base64,${base64}`;
    });
  });

  await Promise.allSettled(promises);

  const whiteChannel = includeWhite ? new Uint8ClampedArray(channelDatas[0].length) : null;

  const empty = [true, true, true, true];

  for (let i = 0; i < channelDatas[0].length; i += 4) {
    let hasColor = false;

    for (let j = 0; j < 4; j += 1) {
      if (channelDatas[j][i] !== 255 && channelDatas[j][i + 3] !== 0) {
        hasColor = true;

        if (empty[j]) {
          empty[j] = false;
        }
      } else {
        channelDatas[j][i + 3] = 0;
      }
    }

    if (hasColor && whiteChannel) {
      // we print black part so set to black
      whiteChannel[i] = 0;
      whiteChannel[i + 1] = 0;
      whiteChannel[i + 2] = 0;
      whiteChannel[i + 3] = 255;
    }
  }

  if (cmykBlob) {
    const readBlob = async (blob: Blob): Promise<Uint8ClampedArray> => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      await new Promise<void>((resolve) => {
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve();
        };
        img.src = URL.createObjectURL(blob);
      });

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      return new Uint8ClampedArray(imageData.data);
    };
    const [cData, mData, yData, kData] = await Promise.all([
      readBlob(cmykBlob.c),
      readBlob(cmykBlob.m),
      readBlob(cmykBlob.y),
      readBlob(cmykBlob.k),
    ]);

    for (let i = 0; i < cData.length; i += 4) {
      const a = Math.max(cData[i + 3], mData[i + 3], yData[i + 3], kData[i + 3]);
      const colors = [kData[i], cData[i], mData[i], yData[i]];
      let hasColor = false;

      for (let j = 0; j < colors.length; j += 1) {
        if (a !== 0 && colors[j] !== 255) {
          channelDatas[j][i] = colors[j];
          channelDatas[j][i + 1] = colors[j];
          channelDatas[j][i + 2] = colors[j];
          channelDatas[j][i + 3] = a;

          if (empty[j]) {
            empty[j] = false;
          }

          hasColor = true;
        }
      }

      if (hasColor && whiteChannel) {
        // we print black part so set to black
        whiteChannel[i] = 0;
        whiteChannel[i + 1] = 0;
        whiteChannel[i + 2] = 0;
        whiteChannel[i + 3] = a;
      }
    }
  }

  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const channelToBlob = async (channelData: null | Uint8ClampedArray): Promise<Blob | null> => {
    if (!channelData) {
      return null;
    }

    imageData.data.set(channelData);
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b));
    });

    return blob;
  };
  const res: Array<{ color: PrintingColors; data: Blob | null }> = [];

  res.push({ color: PrintingColors.WHITE, data: await channelToBlob(whiteChannel) });
  for (let i = 0; i < channelDatas.length; i += 1) {
    if (!empty[i]) {
      res.push({ color: colorOrder[i], data: await channelToBlob(channelDatas[i]) });
    } else {
      res.push({ color: colorOrder[i], data: null });
    }
  }

  return res;
};

export default splitColor;
