import {
  MATERIAL_POSITION_LIMIT,
  MATERIAL_SHAPES,
  MATERIAL_SIZE_LIMIT,
  type MaterialShape,
  REFRACTIVE_INDEX_LIMIT,
  SAFETY_MARGIN_LIMIT,
} from '@core/app/constants/innerEngraving';
import { useDocumentStore } from '@core/app/stores/documentStore';
import type { DocumentState } from '@core/interfaces/Preference';

/**
 * The inner engraving material settings as they travel inside a file.
 *
 * The material decides the refraction compensation and the engravable Z range of every export, so
 * it has to be saved with the document rather than left in the app's preferences: the same file
 * must engrave at the same depth wherever it is opened. It goes into `#svgcontent` as one JSON
 * attribute, next to the mode flags (`data-rotary_mode`, `data-inner-engraving`), so every save
 * path that serialises the canvas carries it.
 */
export const MATERIAL_ATTRIBUTE = 'data-inner-engraving-material';

/** JSON key → document store key. */
const MATERIAL_KEYS = {
  baseHeight: 'inner-engraving-base-height',
  depth: 'inner-engraving-depth',
  diameter: 'inner-engraving-diameter',
  height: 'inner-engraving-height',
  refractiveIndex: 'inner-engraving-refractive-index',
  safetyMargin: 'inner-engraving-safety-margin',
  shape: 'inner-engraving-shape',
  width: 'inner-engraving-width',
  x: 'inner-engraving-x',
  y: 'inner-engraving-y',
} as const;

type MaterialKey = keyof typeof MATERIAL_KEYS;
type MaterialDocumentKey = (typeof MATERIAL_KEYS)[MaterialKey];

export type MaterialDocumentState = Pick<DocumentState, MaterialDocumentKey>;

export interface SerializedMaterial {
  baseHeight: number;
  depth: number;
  diameter: number;
  height: number;
  refractiveIndex: number;
  safetyMargin: number;
  shape: MaterialShape;
  width: number;
  x: number;
  y: number;
}

const NUMBER_LIMITS: Record<Exclude<MaterialKey, 'shape'>, { max: number; min: number }> = {
  baseHeight: { max: MATERIAL_SIZE_LIMIT.max, min: 0 },
  depth: MATERIAL_SIZE_LIMIT,
  diameter: MATERIAL_SIZE_LIMIT,
  height: MATERIAL_SIZE_LIMIT,
  refractiveIndex: REFRACTIVE_INDEX_LIMIT,
  safetyMargin: SAFETY_MARGIN_LIMIT,
  width: MATERIAL_SIZE_LIMIT,
  x: MATERIAL_POSITION_LIMIT,
  y: MATERIAL_POSITION_LIMIT,
};

export const getSerializedMaterial = (
  state: MaterialDocumentState = useDocumentStore.getState(),
): SerializedMaterial => ({
  baseHeight: state['inner-engraving-base-height'],
  depth: state['inner-engraving-depth'],
  diameter: state['inner-engraving-diameter'],
  height: state['inner-engraving-height'],
  refractiveIndex: state['inner-engraving-refractive-index'],
  safetyMargin: state['inner-engraving-safety-margin'],
  shape: state['inner-engraving-shape'],
  width: state['inner-engraving-width'],
  x: state['inner-engraving-x'],
  y: state['inner-engraving-y'],
});

/** The attribute value to write on `#svgcontent`; the serializer escapes the quotes. */
export const serializeMaterial = (state?: MaterialDocumentState): string =>
  JSON.stringify(getSerializedMaterial(state));

/** The serializer writes the JSON quotes as `&quot;`; undo that (and the other XML entities) before parsing. */
const fromXml = (str: string): string =>
  str
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

/**
 * Read the material settings back out of a file.
 *
 * Each key is validated on its own against the dialog's limits, and an invalid or missing key keeps
 * the current value, so a hand-edited or newer file still restores what it can.
 *
 * @param raw the attribute value as found in the SVG string (XML entities still escaped), or the
 *   attribute's absence
 * @returns the document state patch, empty when nothing usable was found
 */
export const parseMaterial = (raw: null | string | undefined): Partial<MaterialDocumentState> => {
  if (!raw) return {};

  let data: unknown;

  try {
    data = JSON.parse(fromXml(raw));
  } catch {
    return {};
  }

  if (!data || typeof data !== 'object') return {};

  const values = data as Record<string, unknown>;
  const patch: Partial<MaterialDocumentState> = {};

  for (const key of Object.keys(MATERIAL_KEYS) as MaterialKey[]) {
    const value = values[key];

    if (key === 'shape') {
      if (MATERIAL_SHAPES.includes(value as MaterialShape)) patch[MATERIAL_KEYS.shape] = value as MaterialShape;

      continue;
    }

    const { max, min } = NUMBER_LIMITS[key];

    if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) {
      patch[MATERIAL_KEYS[key]] = value;
    }
  }

  return patch;
};
