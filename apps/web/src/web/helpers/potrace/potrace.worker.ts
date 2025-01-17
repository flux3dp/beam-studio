import jimpHelper from 'helpers/jimp-helper';

import { posterize, trace } from '.';

const ctx: Worker = self as unknown as Worker;
ctx.onmessage = async (e) => {
  const { imgUrl, imgBBox, method, options } = e.data;
  const image = await jimpHelper.urlToImage(imgUrl);
  const sx = imgBBox.width / image.bitmap.width;
  const sy = imgBBox.height / image.bitmap.height;
  const svgString = await (method === 'trace' ? trace : posterize)(image, options);
  ctx.postMessage({ sx, sy, svg: svgString }, null);
};

export default null;
