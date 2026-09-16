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
  /**
   * Text-on-path along the n-th baseline (baselines are sorted top→bottom), at this design-px font
   * size. `offset` shifts the baseline parallel to itself, in design px: positive moves it toward the
   * glyph tops (outward on the top arc, inward on the bottom arc).
   */
  | { baseline: number; fontSize: number; offset?: number }
  /**
   * Text fitted into a fixed box, at a font size equal to the box height.
   * - 'spacing' (default): keeps glyph shape, spreads or tightens letter spacing to span the width
   * - 'center': keeps glyph shape and the user's letter spacing, just centers the ink in the box
   * - 'stretch': scales the ink non-uniformly to fill the box
   */
  | { bounds: Bounds; fit?: 'center' | 'spacing' | 'stretch'; vertical?: boolean };

export type TextSlotDef = TextPlacement & {
  /** Default for the slot's bold toggle (faux bold: glyph outlines offset outward). */
  bold?: boolean;
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

/** Built geometry for the current template + state. All items live inside `group` (removed on rebuild). */
export interface StampShape {
  /** Bounds of the cut outline; export shifts everything so this lands at the canvas origin. */
  bounds: paper.Rectangle;
  /** Outer contour of the outermost frame — the cut layer. */
  cut: paper.PathItem;
  /** Frames + text glyphs (+ elements later) — the engrave layer. */
  engrave: paper.PathItem[];
  group: paper.Group;
}

export interface TextOptionValues {
  bold: boolean;
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
