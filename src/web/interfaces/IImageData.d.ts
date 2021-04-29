export interface IImageDataResult {
  canvas: HTMLCanvasElement,
  size: {
    width: number,
    height: number,
  },
  data: ImageData,
  imageBinary: Uint8ClampedArray,
  blob: Blob,
  pngBase64: string,
}
