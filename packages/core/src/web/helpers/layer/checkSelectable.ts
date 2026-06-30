export const checkSelectable = (layer: SVGGElement): boolean =>
  layer.getAttribute('display') !== 'none' &&
  layer.getAttribute('data-lock') !== 'true' &&
  layer.getAttribute('opacity') !== '0';
