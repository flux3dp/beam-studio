import NS from '@core/app/constants/namespaces';
import { isWebKit } from '@core/helpers/browser';

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
  canvasBackground.appendChild(generateFixedSizeSvg(dimension));

  getRoot().insertBefore(canvasBackground, getContent());
};

const getBackgroundImageContainer = (): Element => {
  const container = document.getElementById('backgroundImageContainer');

  if (container) return container;

  const canvasBackground = document.getElementById('canvasBackground');

  if (!canvasBackground) throw new Error('Canvas background not found');

  const fixedSizeSvg = canvasBackground.querySelector('#fixedSizeSvg');
  const newContainer = document.createElementNS(NS.SVG, 'g');

  newContainer.setAttribute('id', 'backgroundImageContainer');

  if (fixedSizeSvg) {
    canvasBackground.insertBefore(newContainer, fixedSizeSvg);
  } else {
    canvasBackground.appendChild(newContainer);
  }

  return newContainer;
};

export const setBackgroundImage = (url: string) => {
  const imageContainer = getBackgroundImageContainer();
  let image: null | SVGImageElement = imageContainer.querySelector('#backgroundImage');

  if (!image) {
    image = document.createElementNS(NS.SVG, 'image');
    image.setAttribute('id', 'backgroundImage');
    image.setAttribute('x', '0');
    image.setAttribute('y', '0');
    image.setAttribute('width', '100%');
    image.setAttribute('height', '100%');
    image.setAttribute('preserveAspectRatio', 'xMinYMin');
    image.setAttribute('style', 'pointer-events:none; opacity: 1;');
    imageContainer.appendChild(image);
  }

  image.setAttributeNS(NS.XLINK, 'xlink:href', url);
};

export const clearBackgroundImage = () => {
  const imageContainer = getBackgroundImageContainer();

  while (imageContainer.firstChild) {
    imageContainer.removeChild(imageContainer.firstChild);
  }
};

export default {
  setupBackground,
};
