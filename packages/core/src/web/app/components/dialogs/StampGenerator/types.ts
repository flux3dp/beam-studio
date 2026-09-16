import type paper from 'paper';

import type { ILang } from '@core/interfaces/ILang';

export interface Bounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

/** Where a text slot lives inside the 150×150 design space. */
export type TextPlacement =
  /** Text-on-path along the n-th baseline (baselines are sorted top→bottom). */
  | { baseline: number }
  /** Multi-line text fitted into a fixed box. */
  | { bounds: Bounds; vertical?: boolean };

export type TextSlotDef = TextPlacement & {
  id: string;
  placeholder: string;
};

export interface ElementSlotDef {
  bounds: Bounds;
  id: string;
}

export interface StampSize {
  /** Optional display label (e.g. 四分). Fixed-size templates leave it out. */
  label?: string;
  /** Target width in mm; height follows the template's aspect ratio. */
  widthMm: number;
}

export interface StampTemplate {
  elements: ElementSlotDef[];
  id: string;
  nameKey: keyof ILang['stamp_generator']['templates'];
  sizes: StampSize[];
  svgContent: string;
  texts: TextSlotDef[];
  /** Picker card image URL. Falls back to the template name until design provides one. */
  thumbnail?: string;
}

/** Paper.js items extracted from a template SVG, grouped by role. */
export interface ParsedTemplate {
  /** Baselines sorted top→bottom, each normalized to run left→right. */
  baselines: paper.Path[];
  /** Engraved frame rings. */
  frames: paper.PathItem[];
  /** The largest frame ring; drives the export scale and becomes the cut outline. */
  outline: paper.PathItem;
}

export interface TextOptionValues {
  enabled: boolean;
  font: { family: string; postscriptName: string; style: string };
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  text: string;
}

export interface ElementOptionValues {
  enabled: boolean;
  rotation: number;
  scale: number;
  shapeKey: string;
}

export interface StampState {
  elements: Record<string, ElementOptionValues>;
  flipHorizontal: boolean;
  invertColor: boolean;
  sizeIndex: number;
  templateId: string;
  texts: Record<string, TextOptionValues>;
}
