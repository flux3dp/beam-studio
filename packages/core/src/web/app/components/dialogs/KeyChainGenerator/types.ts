import type paper from 'paper';

import type { ILang } from '@core/interfaces/ILang';
import type { KeysWithType } from '@core/interfaces/utils';

export interface KeyChainShape {
  bounds: paper.Rectangle;
  svgElement: SVGSVGElement;
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
  type: 'hole';
}

export interface TextOptionValues {
  content: string;
  enabled: boolean;
  font: {
    family: string;
    postscriptName: string;
    style: string;
  };
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
}

export interface TextOptionDef {
  bounds: { height: number; width: number; x: number; y: number };
  defaults: Omit<TextOptionValues, 'font'>;
  id: string;
  label?: string;
  type: 'text';
}

export interface ElementOptionValues {
  enabled: boolean;
  /** Shape key in format "mainType/fileName", e.g. "basic/icon-heart1" */
  shapeKey: string;
}

export interface ElementOptionDef {
  bounds: { height: number; width: number; x: number; y: number };
  defaults: ElementOptionValues;
  id: string;
  label?: string;
  type: 'element';
}

export interface ShapeTextOptionValues {
  font: {
    family: string;
    postscriptName: string;
    style: string;
  };
  fontSize: number;
  /** Outline offset in mm — body is built by offsetting the glyph path outward by this amount. */
  outlineOffset: number;
  text: string;
}

export interface ShapeTextOptionDef {
  defaults: Omit<ShapeTextOptionValues, 'font'>;
  id: string;
  label?: string;
  type: 'shapeText';
}

export type KeyChainOptionDef = ElementOptionDef | HoleOptionDef | ShapeTextOptionDef | TextOptionDef;

export interface KeyChainCategory {
  defaultViewBox: { height: number; width: number; x: number; y: number };
  id: string;
  nameKey: KeysWithType<ILang['keychain_generator']['types'], string>;
  options: KeyChainOptionDef[];
  svgContent: string;
  thumbnail: string;
}

export interface KeyChainState {
  categoryId: string;
  elements: Record<string, ElementOptionValues>;
  holes: Record<string, HoleOptionValues>;
  shapeTexts: Record<string, ShapeTextOptionValues>;
  texts: Record<string, TextOptionValues>;
}
