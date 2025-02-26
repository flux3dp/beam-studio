/// <reference lib="webworker" />
import type { IImageProcessor } from '@core/interfaces/IImage';

// run this in global scope of window or worker. since window.self = window, we're ok
if (typeof WorkerGlobalScope !== 'undefined' && global instanceof WorkerGlobalScope) {
  importScripts('https://unpkg.com/jimp@0.16.1/browser/lib/jimp.js');
}

// @ts-expect-error This line is intentionally invalid.
const { Jimp } = global;
const cachedJpegDecoder = Jimp.decoders['image/jpeg'];

Jimp.decoders['image/jpeg'] = (data: any) => cachedJpegDecoder(data, { maxMemoryUsageInMB: 1024 });

export default {
  AUTO: Jimp.AUTO,
  BLEND_OVERLAY: Jimp.BLEND_OVERLAY,
  Jimp,
  MIME_PNG: Jimp.MIME_PNG,
  read(data: Buffer) {
    return Jimp.read(data);
  },
} as IImageProcessor;
