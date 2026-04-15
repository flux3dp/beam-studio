import type paper from 'paper';

import type { ILang } from '@core/interfaces/ILang';
import type { KeysWithType } from '@core/interfaces/utils';

export interface KeyChainShape {
  /** Bounds of the base region in paper coordinates (used by viewBox + export shifts). */
  bounds: paper.Rectangle;
  /** Text + element decoration nodes, split by layer destination. */
  decorations: { emboss: SVGElement[]; engraving: SVGElement[] };
  /** Design view: result + decorations + inner path overlaid. Consumers must `.cloneNode(true)`. */
  designSvg: SVGSVGElement;
  /** Exploded view: design content + inner path translated below the base. */
  explodedSvg: SVGSVGElement;
  /** Clone of the cached inner path (text glyphs). null when there is no inner geometry. */
  innerPath: null | paper.PathItem;
  /** Clone of basePath after holes are punched. Used for layer 1 export and SVG generation. */
  resultBasePath: paper.PathItem;
}

export type HoleType = 'punch' | 'ring';
export interface HoleOptionValues {
  diameter: number;
  enabled: boolean;
  offset: number;
  position: number;
  thickness: number;
  type: HoleType;
}

export interface HoleOptionDef {
  defaults: HoleOptionValues;
  id: string;
  label?: string;
  startPositionRef: KeysWithType<paper.Rectangle, paper.Point>;
}

export interface TextOptionValues {
  emboss: boolean;
  enabled: boolean;
  font: {
    family: string;
    postscriptName: string;
    style: string;
  };
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  text: string;
}

export interface TextOptionDef {
  bounds: { height: number; width: number; x: number; y: number };
  defaults: Omit<TextOptionValues, 'font'>;
  id: string;
  label?: string;
}

export interface ElementOptionValues {
  emboss: boolean;
  enabled: boolean;
  /** Shape key in format "mainType/fileName", e.g. "basic/icon-heart1" */
  shapeKey: string;
}

export interface ElementOptionDef {
  bounds: { height: number; width: number; x: number; y: number };
  defaults: ElementOptionValues;
  id: string;
  label?: string;
  options: string[];
}

export interface DecorationOptionValues {
  emboss: boolean;
  enabled: boolean;
  selectedKey: string;
}

export interface DecorationPathOptionDef {
  defaults: DecorationOptionValues;
  id: string;
  /** Ordered keys into DECORATION_PATHS — first key is the default selection. */
  options: string[];
}

export type ShapeElementPositionRef = 'bottomCenter' | 'leftCenter' | 'rightCenter' | 'topCenter';

export interface CustomShapeOptionValues {
  element: { enabled: boolean; positionRef: ShapeElementPositionRef; shapeKey: string };
  font: {
    family: string;
    postscriptName: string;
    style: string;
  };
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  /** Outline offset in mm — body is built by offsetting the glyph path outward by this amount. */
  outlineOffset: number;
  text: string;
}

export interface CustomShapeOptionDef {
  defaults: Omit<CustomShapeOptionValues, 'font'>;
  elementOptions: string[];
  label?: string;
}

export type SizeDimension = 'height' | 'width';

export interface KeyChainCategory {
  defaultSize: { dimension: SizeDimension; value: number };
  defaultViewBox: { height: number; width: number; x: number; y: number };
  id: string;
  isCustomShape?: boolean;
  nameKey: KeysWithType<ILang['keychain_generator']['types'], string>;
  options: {
    customShape?: CustomShapeOptionDef;
    decorationPaths?: DecorationPathOptionDef[];
    elements?: ElementOptionDef[];
    holes?: HoleOptionDef[];
    texts?: TextOptionDef[];
  };
  svgContent: string;
  thumbnail: string;
}

export interface KeyChainState {
  categoryId: string;
  customShape: CustomShapeOptionValues;
  decorationPaths: Record<string, DecorationOptionValues>;
  elements: Record<string, ElementOptionValues>;
  holes: Record<string, HoleOptionValues>;
  size: { dimension: SizeDimension; value: number };
  texts: Record<string, TextOptionValues>;
}
