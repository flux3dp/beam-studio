import type { IBatchCommand } from '@core/interfaces/IHistory';

export type ConvertSvgToImageParams = {
  isToSelect?: boolean;
  parentCmd?: IBatchCommand;
  svgElement: SVGGElement;
};
export type ConvertToImageResult = undefined | { imageElements: SVGImageElement[]; svgElements: SVGGElement[] };

export type BBox = { height: number; width: number; x: number; y: number };
export type CreateImageParams = {
  angle?: number;
  attributes?: Record<string, number | string>;
  dimensions: { height: number; width: number; x: number; y: number };
  href: string;
  transform?: string;
};
export type MainConverterFunc = (params: ConvertSvgToImageParams) => Promise<ConvertToImageResult>;
