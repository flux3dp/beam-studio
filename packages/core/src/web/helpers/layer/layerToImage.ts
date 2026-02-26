import constant from '@core/app/actions/beambox/constant';
import findDefs from '@core/app/svgedit/utils/findDef';
import workareaManager from '@core/app/svgedit/workarea';
import getUtilWS from '@core/helpers/api/utils-ws';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';

import updateImageForSplitting from './full-color/updateImageForSplitting';

const layerToImage = async (
  layer: SVGGElement,
  opt?: { dpmm?: number; isFullColor?: boolean; shapesOnly?: boolean },
): Promise<{
  bbox: { height: number; width: number; x: number; y: number };
  cmykBlob?: { c: Blob; k: Blob; m: Blob; y: Blob };
  rgbBlob: Blob | null;
}> => {
  const { dpmm = 300 / 25.4, isFullColor = false, shapesOnly = false } = opt || {};
  const layerClone = layer.cloneNode(true) as SVGGElement;

  if (shapesOnly) {
    layerClone.querySelectorAll('image').forEach((image) => image.remove());
  }

  if (isFullColor) {
    await updateImageForSplitting(layerClone);
  }

  const cmykLayer = layerClone.cloneNode(true) as SVGGElement;

  cmykLayer.querySelectorAll('*').forEach((elem) => {
    if (elem.getAttribute('cmyk') !== '1' && !elem.querySelector('image[cmyk="1"]')) {
      elem.remove();
    }
  });
  layerClone.querySelectorAll('image').forEach((image) => {
    if (image.getAttribute('cmyk') === '1') {
      image.remove();
    }
  });

  const ratio = dpmm / constant.dpmm;
  const { height, minY, width } = workareaManager;
  const canvasWidth = Math.round(width * ratio);
  const canvasHeight = Math.round(height * ratio);
  const svgDefs = findDefs();
  const getCanvas = async (element: SVGElement) => {
    const svgString = `
      <svg
        width="${canvasWidth}"
        height="${canvasHeight}"
        viewBox="0 ${minY} ${width} ${height}"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        ${svgDefs.outerHTML}
        ${element.outerHTML}
      </svg>`;

    return svgStringToCanvas(svgString, canvasWidth, canvasHeight);
  };
  const rgbCanvas = await getCanvas(layerClone);
  let cmykCanvas: Record<'c' | 'k' | 'm' | 'y', HTMLCanvasElement> | undefined = undefined;

  if (isFullColor && cmykLayer.querySelector('image[cmyk="1"]')) {
    const utilWS = getUtilWS();
    const cLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const mLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const yLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const kLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const cmykImages = cmykLayer.querySelectorAll('image[cmyk="1"]');

    for (let i = 0; i < cmykImages.length; i++) {
      const base64 = (cmykImages[i].getAttribute('origImage') || cmykImages[i].getAttribute('xlink:href')) as string;

      const blob = await (await fetch(base64)).blob();

      const { c, k, m, y } = await utilWS.splitColor(blob, { colorType: 'cmyk' });

      cLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${c}`);
      mLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${m}`);
      yLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${y}`);
      kLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${k}`);
    }

    const cCanvas = await getCanvas(cLayer);
    const mCanvas = await getCanvas(mLayer);
    const yCanvas = await getCanvas(yLayer);
    const kCanvas = await getCanvas(kLayer);

    cmykCanvas = { c: cCanvas, k: kCanvas, m: mCanvas, y: yCanvas };
  }

  const rgbCtx = rgbCanvas.getContext('2d', { willReadFrequently: true })!;
  const { data: rgbData } = rgbCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  const cData = cmykCanvas?.c
    .getContext('2d', { willReadFrequently: true })
    ?.getImageData(0, 0, canvasWidth, canvasHeight).data!;
  const mData = cmykCanvas?.m
    .getContext('2d', { willReadFrequently: true })
    ?.getImageData(0, 0, canvasWidth, canvasHeight).data!;
  const yData = cmykCanvas?.y
    .getContext('2d', { willReadFrequently: true })
    ?.getImageData(0, 0, canvasWidth, canvasHeight).data!;
  const kData = cmykCanvas?.k
    .getContext('2d', { willReadFrequently: true })
    ?.getImageData(0, 0, canvasWidth, canvasHeight).data!;
  const bounds = { maxX: 0, maxY: 0, minX: canvasWidth, minY: canvasHeight };

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const i = (y * canvasWidth + x) * 4;
      let alpha = rgbData[i + 3];

      if (cmykCanvas) {
        alpha = Math.max(alpha, cData![i + 3], mData![i + 3], yData![i + 3], kData![i + 3]);
      }

      if (alpha > 0) {
        if (x < bounds.minX) {
          bounds.minX = x;
        }

        if (x > bounds.maxX) {
          bounds.maxX = x;
        }

        if (y < bounds.minY) {
          bounds.minY = y;
        }

        if (y > bounds.maxY) {
          bounds.maxY = y;
        }
      }
    }
  }

  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
    return { bbox: { height: 0, width: 0, x: 0, y: 0 }, rgbBlob: null };
  }

  const bbox = {
    height: bounds.maxY - bounds.minY + 1,
    width: bounds.maxX - bounds.minX + 1,
    x: bounds.minX,
    y: bounds.minY,
  };
  const outputBbox = {
    height: Math.round(bbox.height / ratio),
    width: Math.round(bbox.width / ratio),
    x: Math.round(bbox.x / ratio),
    y: Math.round(bbox.y / ratio) + minY,
  };
  const generateBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    const outCanvas = document.createElement('canvas');

    outCanvas.width = bbox.width;
    outCanvas.height = bbox.height;

    const outCtx = outCanvas.getContext('2d')!;

    if (!isFullColor) {
      outCtx.filter = 'brightness(0%)';
    }

    outCtx.drawImage(canvas, bbox.x, bbox.y, bbox.width, bbox.height, 0, 0, outCanvas.width, outCanvas.height);

    return new Promise<Blob>((resolve) => {
      outCanvas.toBlob((b) => resolve(b!));
    });
  };
  const rgbBlob = await generateBlob(rgbCanvas);

  if (!isFullColor) {
    return { bbox: outputBbox, rgbBlob };
  }

  const cmykBlob = cmykCanvas
    ? {
        c: await generateBlob(cmykCanvas.c),
        k: await generateBlob(cmykCanvas.k),
        m: await generateBlob(cmykCanvas.m),
        y: await generateBlob(cmykCanvas.y),
      }
    : undefined;

  return { bbox: outputBbox, cmykBlob, rgbBlob };
};

export default layerToImage;
