import jimpHelper from '@core/helpers/jimp-helper';

import { posterize, trace } from '.';

onmessage = async ({ data: { imgUrl, imgBBox, method, options } }) => {
  if (!imgUrl || !imgBBox || !method) return;

  const startTime = performance.now();
  const image = await jimpHelper.urlToImage(imgUrl);
  const sx = imgBBox.width / image.bitmap.width;
  const sy = imgBBox.height / image.bitmap.height;
  const svg = await (method === 'trace' ? trace : posterize)(image, options);

  postMessage({ sx, sy, svg });

  console.log('potrace.worker.ts operationTime', performance.now() - startTime);
};
