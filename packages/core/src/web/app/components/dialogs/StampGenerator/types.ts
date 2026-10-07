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
   * size. The text's em box is centered on the baseline; `offset` shifts that center arc parallel to
   * itself, in design px: positive moves it toward the glyph tops (outward on the top arc, inward on
   * the bottom arc).
   */
  | { baseline: number; fontSize: number; offset?: number }
  /**
   * Text fitted into a fixed box, at `fontSize` (user-adjustable when set; default: the box height).
   * - 'spacing' (default): keeps glyph shape, spreads or tightens letter spacing to span the width
   * - 'center': keeps glyph shape and the user's letter spacing, just centers the ink in the box
   * - 'shrink': like 'center', but scales the ink down uniformly (to half at most) when it's wider than the box
   * - 'stretch': scales the ink non-uniformly to fill the box
   */
  | {
      bounds: Bounds;
      /**
       * Keep the box clear of an element slot: at build time the box is trimmed on the side the
       * element's ink is on, leaving `padding` design px between them, so text follows the icon size.
       */
      clearOf?: { elementId: string; padding: number };
      fit?: 'center' | 'shrink' | 'spacing' | 'stretch';
      fontSize?: number;
      /**
       * The text is cut out of the engraved frame it sits on (a filled band reads the text in
       * negative). The glyphs must lie fully inside one frame path.
       */
      knockout?: boolean;
      vertical?: boolean;
    };

export type TextSlotDef = TextPlacement & {
  /** Fixed face for this slot by postscript name (e.g. a bundled font); omit for the resolved default font. */
  fontPostscriptName?: string;
  id: string;
  /** Row label in the Text tab. Omit to keep the slot fixed: it renders its placeholder and isn't listed. */
  labelKey?: keyof ILang['stamp_generator']['slots'];
  /** Initial letter spacing in design px (user-adjustable). */
  letterSpacing?: number;
  placeholder: string;
};

export interface ElementSlotDef {
  bounds: Bounds;
  id: string;
  /** Row label in the Element tab. Omit to keep the slot fixed: it renders its default shape and isn't listed. */
  labelKey?: keyof ILang['stamp_generator']['slots'];
  /** Preset shape keys offered in the Element tab (Element-panel keys like `animals/i_land-16`, or bundled `stamp/*`). */
  options?: string[];
  /** Default shape key; `stamp/*` are the bundled icons in templates/icons, anything else is an Element-panel key. Defaults to the plum blossom. */
  shapeKey?: string;
}

/**
 * Runtime-built frame (instead of a frame path in the SVG): a stroke ring or a decorative border style
 * fitted inside `bounds`, whose outer edge is also the cut outline. `lineWidth` is the default stroke
 * width in design px.
 */
/**
 * Border style families (`BORDER_STYLES` keys). `rect` styles are nine-sliced for any aspect ratio; the
 * others are scaled onto the box as drawn.
 */
export type BorderShape = 'circle' | 'oval' | 'rect' | 'square';

export interface BorderDef {
  bounds: Bounds;
  /** Initial dash setting of the stroke ring (the design's dashed rings). */
  dashed?: boolean;
  lineWidth?: number;
  radius?: number;
  /** Which style family the Border tab offers; defaults to `rect`. */
  shape?: BorderShape;
  /** `false` keeps the Border tab to the plain line (width + dash): the content fills the box, decorative styles would collide. */
  styles?: boolean;
}

export interface StampSize {
  /** Optional display label (e.g. 四分). Fixed-size templates leave it out. */
  label?: string;
  /** Target width in mm; height follows the template's aspect ratio. */
  widthMm: number;
}

/**
 * Top-bar group. The first four are outer frame shapes; `tw_company` is the regulated Taiwan 統編章 pair,
 * whose frames are fixed by regulation and so never take a border style. A group is shown only while it
 * has a template visible in the active language (see `locales` / `excludedLocales`).
 */
export const TEMPLATE_CATEGORIES = ['circle', 'oval', 'square', 'rect', 'tw_company'] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface StampTemplate {
  border?: BorderDef;
  category: TemplateCategory;
  elements: ElementSlotDef[];
  /** Hidden in these UI languages (e.g. a Latin-script twin of a Chinese template); unset = none. */
  excludedLocales?: string[];
  id: string;
  /** Listed only in these UI languages (e.g. ['zh-tw'] for Taiwan-regulated seals); unset = every language. */
  locales?: string[];
  nameKey: keyof ILang['stamp_generator']['templates'];
  /**
   * Default text font, tried in order by postscript name; a candidate is skipped when it doesn't
   * resolve or load (web font offline, macOS font not downloaded). Falls back to the user's default font.
   */
  preferredFonts?: ReadonlyArray<string>;
  sharedFont?: boolean;
  sizes: StampSize[];
  /** Frame rings + arc baselines. Optional for templates whose frame is a `border`. */
  svgContent?: string;
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
  /** The template's explicit cut path if it has one, else the border box or the largest frame ring; drives the export scale and becomes the cut outline. */
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

export interface BorderOptionValues {
  dashed: boolean;
  /** Design px (stroke style only). */
  lineWidth: number;
  /** `'stroke'` for the plain line (lineWidth + dashed apply), else a `BORDER_STYLES` key. */
  style: string;
}

export interface StampState {
  border?: BorderOptionValues;
  elements: Record<string, ElementOptionValues>;
  flipHorizontal: boolean;
  invertColor: boolean;
  sizeIndex: number;
  templateId: string;
  texts: Record<string, TextOptionValues>;
}

/** A slot is user-editable (listed in its tab) when it carries a label key. */
export const isLabeled = (slot: { labelKey?: string }): boolean => Boolean(slot.labelKey);
