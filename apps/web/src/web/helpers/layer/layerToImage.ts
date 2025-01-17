import constant from 'app/actions/beambox/constant';
import findDefs from 'app/svgedit/utils/findDef';
import getUtilWS from 'helpers/api/utils-ws';
import svgStringToCanvas from 'helpers/image/svgStringToCanvas';
import workareaManager from 'app/svgedit/workarea';

import updateImageForSpliting from './full-color/updateImageForSpliting';

const layerToImage = async (
  layer: SVGGElement,
  opt?: { dpi?: number; shapesOnly?: boolean; isFullColor?: boolean }
): Promise<{
  rgbBlob: Blob;
  cmykBlob?: { c: Blob; m: Blob; y: Blob; k: Blob };
  bbox: { x: number; y: number; width: number; height: number };
}> => {
  const { dpi = 300, shapesOnly = false, isFullColor = false } = opt || {};
  const layerClone = layer.cloneNode(true) as SVGGElement;
  if (shapesOnly) layerClone.querySelectorAll('image').forEach((image) => image.remove());
  if (isFullColor) await updateImageForSpliting(layerClone);
  const cmykLayer = layerClone.cloneNode(true) as SVGGElement;
  cmykLayer.querySelectorAll('*').forEach((elem) => {
    if (elem.getAttribute('cmyk') !== '1' && !elem.querySelector('image[cmyk="1"]')) {
      elem.remove();
    }
  });
  layerClone.querySelectorAll('image').forEach((image) => {
    if (image.getAttribute('cmyk') === '1') image.remove();
  });

  const ratio = dpi / (constant.dpmm * 25.4);
  const { width, height } = workareaManager;
  const canvasWidth = Math.round(width * ratio);
  const canvasHeight = Math.round(height * ratio);
  const svgDefs = findDefs();
  const getCanvas = async (element: SVGElement) => {
    const svgString = `
      <svg
        width="${canvasWidth}"
        height="${canvasHeight}"
        viewBox="0 0 ${width} ${height}"
        xmlns:svg="http://www.w3.org/2000/svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        ${svgDefs.outerHTML}
        ${element.outerHTML}
      </svg>`;
    const canvas = await svgStringToCanvas(svgString, canvasWidth, canvasHeight);
    return canvas;
  };
  const rgbCanvas = await getCanvas(layerClone);
  let cmykCanvas: { [key: string]: HTMLCanvasElement } = null;
  if (isFullColor && cmykLayer.querySelector('image[cmyk="1"]')) {
    const utilWS = getUtilWS();
    const cLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const mLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const yLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const kLayer = cmykLayer.cloneNode(true) as SVGGElement;
    const cmykImages = cmykLayer.querySelectorAll('image[cmyk="1"]');
    for (let i = 0; i < cmykImages.length; i += 1) {
      const base64 = cmykImages[i].getAttribute('origImage') || cmykImages[i].getAttribute('xlink:href');
      // eslint-disable-next-line no-await-in-loop
      const blob = await (await fetch(base64)).blob();
      // eslint-disable-next-line no-await-in-loop
      const { c, m, y, k } = await utilWS.splitColor(blob, { colorType: 'cmyk' });
      cLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${c}`);
      mLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${m}`);
      yLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${y}`);
      kLayer.querySelectorAll('image[cmyk="1"]')[i].setAttribute('xlink:href', `data:image/jpeg;base64,${k}`);
    }
    const cCanvas = await getCanvas(cLayer);
    const mCanvas = await getCanvas(mLayer);
    const yCanvas = await getCanvas(yLayer);
    const kCanvas = await getCanvas(kLayer);
    cmykCanvas = { c: cCanvas, m: mCanvas, y: yCanvas, k: kCanvas };
  }
  const rgbCtx = rgbCanvas.getContext('2d', { willReadFrequently: true });
  const { data: rgbData } = rgbCtx.getImageData(0, 0, canvasWidth, canvasHeight);
  const cData = cmykCanvas?.c
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, canvasWidth, canvasHeight).data;
  const mData = cmykCanvas?.m
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, canvasWidth, canvasHeight).data;
  const yData = cmykCanvas?.y
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, canvasWidth, canvasHeight).data;
  const kData = cmykCanvas?.k
    .getContext('2d', { willReadFrequently: true })
    .getImageData(0, 0, canvasWidth, canvasHeight).data;
  const bounds = { minX: canvasWidth, minY: canvasHeight, maxX: 0, maxY: 0 };
  for (let y = 0; y < canvasHeight; y += 1) {
    for (let x = 0; x < canvasWidth; x += 1) {
      const i = (y * canvasWidth + x) * 4;
      let alpha = rgbData[i + 3];
      if (cmykCanvas) {
        alpha = Math.max(alpha, cData[i + 3], mData[i + 3], yData[i + 3], kData[i + 3]);
      }
      if (alpha > 0) {
        if (x < bounds.minX) bounds.minX = x;
        if (x > bounds.maxX) bounds.maxX = x;
        if (y < bounds.minY) bounds.minY = y;
        if (y > bounds.maxY) bounds.maxY = y;
      }
    }
  }
  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY)
    return { rgbBlob: null, bbox: { x: 0, y: 0, width: 0, height: 0 } };
  const bbox = {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX + 1,
    height: bounds.maxY - bounds.minY + 1,
  };
  const outputBbox = {
    x: Math.round(bbox.x / ratio),
    y: Math.round(bbox.y / ratio),
    width: Math.round(bbox.width / ratio),
    height: Math.round(bbox.height / ratio),
  };
  const generateBlob = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = bbox.width;
    outCanvas.height = bbox.height;
    const outCtx = outCanvas.getContext('2d');
    if (!isFullColor) outCtx.filter = 'brightness(0%)';
    outCtx.drawImage(
      canvas,
      bbox.x,
      bbox.y,
      bbox.width,
      bbox.height,
      0,
      0,
      outCanvas.width,
      outCanvas.height
    );
    return new Promise<Blob>((resolve) => {
      outCanvas.toBlob((b) => resolve(b));
    });
  };
  const rgbBlob = await generateBlob(rgbCanvas);
  if (!isFullColor) return { rgbBlob, bbox: outputBbox };
  const cmykBlob = cmykCanvas ? {
    c: await generateBlob(cmykCanvas.c),
    m: await generateBlob(cmykCanvas.m),
    y: await generateBlob(cmykCanvas.y),
    k: await generateBlob(cmykCanvas.k),
  } : null;
  return { rgbBlob, cmykBlob, bbox: outputBbox };
};

export default layerToImage;
