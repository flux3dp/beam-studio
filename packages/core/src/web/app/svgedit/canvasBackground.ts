import { match } from 'ts-pattern';

import NS from '@core/app/constants/namespaces';
import { isWebKit } from '@core/helpers/browser';
import svgStringToCanvas from '@core/helpers/image/svgStringToCanvas';

const generateFixedSizeSvg = (dimension: number[]) => {
  const svg = document.createElementNS(NS.SVG, 'svg');

  svg.setAttribute('id', 'fixedSizeSvg');
  svg.setAttribute('x', '0');
  svg.setAttribute('y', '0');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', `0 0 ${dimension[0]} ${dimension[1]}`);

  return svg;
};

const generatePreviewSvg = (dimension: number[]) => {
  const svg = document.createElementNS(NS.SVG, 'svg');
  const defs = document.createElementNS(NS.SVG, 'defs');

  svg.setAttribute('id', 'previewSvg');
  svg.setAttribute('x', '0');
  svg.setAttribute('y', '0');
  svg.setAttribute('width', dimension[0].toString());
  svg.setAttribute('height', dimension[1].toString());
  svg.setAttribute('viewBox', `0 0 ${dimension[0]} ${dimension[1]}`);

  defs.setAttribute('id', 'previewDefs');
  svg.appendChild(defs);

  return svg;
};

const setupBackground = (dimension: number[], getRoot: () => Element, getContent: () => Element): void => {
  if (document.getElementById('canvasBackground')) return;

  const canvasBackground = document.createElementNS(NS.SVG, 'svg');

  canvasBackground.setAttribute('id', 'canvasBackground');
  canvasBackground.setAttribute('x', '0');
  canvasBackground.setAttribute('y', '0');
  canvasBackground.setAttribute('width', dimension[0].toString());
  canvasBackground.setAttribute('height', dimension[1].toString());
  // Chrome 7 has a problem with this when zooming out
  canvasBackground.setAttribute('overflow', isWebKit ? 'none' : 'visible');

  const rect = document.createElementNS(NS.SVG, 'rect');

  rect.setAttribute('id', 'canvasBackgroundRect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', '#fff');
  rect.setAttribute('stroke', '#000');
  rect.setAttribute('stroke-width', '1');
  rect.setAttribute('style', 'pointer-events:none');
  rect.setAttribute('vector-effect', 'non-scaling-stroke');

  canvasBackground.appendChild(rect);
  canvasBackground.appendChild(generatePreviewSvg(dimension));
  canvasBackground.appendChild(generateFixedSizeSvg(dimension));

  getRoot().insertBefore(canvasBackground, getContent());
};

const createImageElement = (id: string): SVGImageElement => {
  const image = document.createElementNS(NS.SVG, 'image');

  image.setAttribute('id', id);
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('width', '100%');
  image.setAttribute('height', '100%');
  image.setAttribute('preserveAspectRatio', 'xMinYMin');
  image.setAttribute('style', 'pointer-events:none; opacity: 1;');

  return image;
};

let backgroundUrlCache: null | string = null;

const clearBackgroundUrlCache = () => {
  if (backgroundUrlCache) {
    URL.revokeObjectURL(backgroundUrlCache);
    backgroundUrlCache = null;
  }
};

export const setBackgroundImage = (url: string) => {
  const previewSvg = document.getElementById('previewSvg')!;
  let image: null | SVGImageElement = previewSvg.querySelector('#backgroundImage');

  if (!image) {
    image = createImageElement('backgroundImage');
    previewSvg.appendChild(image);
  }

  image.setAttributeNS(NS.XLINK, 'xlink:href', url);
  clearBackgroundUrlCache();
};

export const clearBackgroundImage = () => {
  const previewSvg = document.getElementById('previewSvg')!;
  const images = previewSvg.querySelectorAll('image');

  images.forEach((image) => image.remove());
};

type BackgroundMaskType = 'fbm2Camera';

const createMaskElement = (maskType: BackgroundMaskType): void => {
  const defs = document.getElementById('previewDefs');

  if (!defs) return;

  if (defs.querySelector(`#${maskType}`)) return;

  match(maskType)
    .with('fbm2Camera', () => {
      const filter = document.createElementNS(NS.SVG, 'filter');
      const feGaussianBlur = document.createElementNS(NS.SVG, 'feGaussianBlur');

      filter.setAttribute('id', 'fbm2CameraFilter');
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '200%');
      feGaussianBlur.setAttribute('stdDeviation', '800');
      filter.appendChild(feGaussianBlur);
      defs.appendChild(filter);

      const mask = document.createElementNS(NS.SVG, 'mask');
      const maskEllipse = document.createElementNS(NS.SVG, 'ellipse');

      mask.setAttribute('id', maskType);
      mask.setAttribute('maskUnits', 'objectBoundingBox');
      mask.setAttribute('x', '0');
      mask.setAttribute('y', '0');
      mask.setAttribute('width', '100%');
      mask.setAttribute('height', '100%');
      maskEllipse.setAttribute('cx', '50%');
      maskEllipse.setAttribute('cy', '100%');
      maskEllipse.setAttribute('rx', '50%');
      maskEllipse.setAttribute('ry', '50%');
      maskEllipse.setAttribute('fill', 'white');
      maskEllipse.setAttribute('filter', 'url(#fbm2CameraFilter)');
      mask.appendChild(maskEllipse);
      defs.appendChild(mask);

      return mask;
    })
    .otherwise(() => null);
};

export const setMaskImage = (url: string, maskType: BackgroundMaskType) => {
  const previewSvg = document.getElementById('previewSvg')!;
  let image: null | SVGImageElement = previewSvg.querySelector('#maskImage');

  if (!image) {
    image = createImageElement('maskImage');
    previewSvg.appendChild(image);
  }

  if (image.getAttributeNS(NS.XLINK, 'xlink:href')) {
    URL.revokeObjectURL(image.getAttributeNS(NS.XLINK, 'xlink:href')!);
  }

  createMaskElement(maskType);
  image.setAttribute('mask', `url(#${maskType})`);
  image.setAttributeNS(NS.XLINK, 'xlink:href', url);
  clearBackgroundUrlCache();
};

export const getBackgroundUrl = async (
  width: number,
  height: number,
  { useCache = true }: { useCache?: boolean } = {},
): Promise<string> => {
  if (useCache && backgroundUrlCache) return backgroundUrlCache;

  const backgroundImage = document.getElementById('backgroundImage') as null | SVGImageElement;
  const maskImage = document.getElementById('maskImage') as null | SVGImageElement;
  const backgroundImageUrl = backgroundImage?.getAttribute('xlink:href');
  const maskImageUrl = maskImage?.getAttribute('xlink:href');

  if (!backgroundImageUrl) return '';

  if (!maskImageUrl) return backgroundImageUrl;

  const resp = await fetch(maskImageUrl);
  const maskImageBlob = await resp.blob();
  const maskImageBase64 = await new Promise<string>((resolve) => {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      const base64String = (fileReader.result as string).split(',')[1];

      resolve(`data:image/jpeg;base64,${base64String}`);
    };
    fileReader.readAsDataURL(maskImageBlob);
  });

  // To make mask work, we need to create a new SVG with the mask and convert it to a canvas.
  const svgString = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      ${(document.getElementById('previewDefs')?.cloneNode(true) as Element).outerHTML ?? ''}
      <image
        id="maskImage"
        x="0"
        y="0"
        width="100%"
        height="100%"
        preserveAspectRatio="xMinYMin"
        mask="${maskImage?.getAttribute('mask') || ''}"
        xlink:href="${maskImageBase64}"
      />
    </svg>`;

  const maskImageCanvas = await svgStringToCanvas(svgString, width, height);
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(backgroundImage!, 0, 0, width, height);
  ctx.drawImage(maskImageCanvas, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    });
  });

  const result = URL.createObjectURL(blob);

  if (useCache) backgroundUrlCache = result;

  return result;
};

export default {
  setupBackground,
};
