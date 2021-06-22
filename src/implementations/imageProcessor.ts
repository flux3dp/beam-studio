import Jimp from 'jimp';
import { IImageProcessor } from 'interfaces/IImage';

export default {
  MIME_PNG: Jimp.MIME_PNG,
  BLEND_OVERLAY: Jimp.BLEND_OVERLAY,
  AUTO: Jimp.AUTO,
  read(data: Buffer): Promise<Jimp> {
    return Jimp.read(data);
  },
} as IImageProcessor;
