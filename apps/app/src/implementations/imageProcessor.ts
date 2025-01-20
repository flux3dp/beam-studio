import Jimp from 'jimp';

import type { IImageProcessor } from '@core/interfaces/IImage';

export default {
  AUTO: Jimp.AUTO,
  BLEND_OVERLAY: Jimp.BLEND_OVERLAY,
  MIME_PNG: Jimp.MIME_PNG,
  read(data: Buffer): Promise<Jimp> {
    return Jimp.read(data);
  },
} as unknown as IImageProcessor;
