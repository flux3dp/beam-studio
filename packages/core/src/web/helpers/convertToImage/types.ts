import type { IBatchCommand } from '@core/interfaces/IHistory';

export type ConvertSvgToImageParams = {
  isToSelect?: boolean;
  parentCmd?: IBatchCommand;
  svgElement: SVGGElement;
};
export type ConvertToImageResult = undefined | { imageElements: SVGImageElement[]; svgElements: SVGGElement[] };

export type BBox = { height: number; width: number; x: number; y: number };
export type CreateImageParams = Record<'angle' | 'height' | 'width' | 'x' | 'y', number> &
  Record<'href' | 'transform', string>;
export type MainConverterFunc = (params: ConvertSvgToImageParams) => Promise<ConvertToImageResult>;

export const convertibleSvgTags = [
  'rect',
  'circle',
  'ellipse',
  'line',
  'polygon',
  'polyline',
  'path',
  'text',
  'use',
  'g',
] as const;
