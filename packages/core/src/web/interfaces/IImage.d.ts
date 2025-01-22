import type Jimp from 'jimp';

export interface IImageProcessor {
  AUTO: number;
  BLEND_OVERLAY: string;
  MIME_PNG: string;
  read: (data: Buffer) => Promise<Jimp>;
}

export interface IImageDataResult {
  blob: Blob;
  canvas: HTMLCanvasElement;
  data: ImageData;
  imageBinary: Uint8ClampedArray;
  pngBase64: string;
  size: {
    height: number;
    width: number;
  };
}
