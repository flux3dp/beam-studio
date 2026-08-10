import { supportInnerEngraving } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import type { DocumentState } from '@core/interfaces/Preference';

type InnerEngravingState = Pick<DocumentState, 'inner-engraving' | 'workarea'>;

/** Resolve the effective mode from both the document toggle and machine capability. */
export const resolveInnerEngravingActive = (state: InnerEngravingState): boolean =>
  state['inner-engraving'] && supportInnerEngraving(state.workarea);

/**
 * Whether inner engraving mode is currently active.
 *
 * The document store only holds the user's toggle: it cannot combine it with the model capability
 * itself, because `workarea-constants` already imports the store. Callers use these helpers instead
 * of reading `inner-engraving` directly, so a document saved on a Promark UV does not put another
 * machine into inner engraving mode.
 */
export const isInnerEngravingActive = (): boolean => {
  return resolveInnerEngravingActive(useDocumentStore.getState());
};

/** Hook form of {@link isInnerEngravingActive}. */
export const useInnerEngravingActive = (): boolean => useDocumentStore(resolveInnerEngravingActive);

/**
 * Menu items switched off while inner engraving is on.
 *
 * Three reasons, and every id here is one of them:
 * 1. **2D-only editing** — offset, decompose, the image tools: an STL object is a mesh, none of
 *    these have a 3D meaning and most would act on the projection rect by mistake
 * 2. **Exports that cannot carry a mesh** — SVG / PNG / JPG / PDF are flat, and .bvg has no block
 *    for the binaries (only .beam does, block 6)
 * 3. **Scenes and modes that conflict** — the material-test imports drop 2D artwork into a document
 *    that only supports STL, and curve engraving is mutually exclusive with inner engraving
 *
 * Plus the two guided tours, which walk the user through the 2D canvas that is not on screen.
 */
export const INNER_ENGRAVING_DISABLED_MENU_ITEMS = [
  'OFFSET',
  'DECOMPOSE_PATH',
  'DISASSEMBLE_USE',
  'IMAGE_SHARPEN',
  'IMAGE_CROP',
  'IMAGE_INVERT',
  'IMAGE_STAMP',
  'IMAGE_VECTORIZE',
  'IMAGE_CURVE',
  'EXPORT_BVG',
  'EXPORT_SVG',
  'EXPORT_PNG',
  'EXPORT_JPG',
  'EXPORT_UV_PRINT',
  'IMPORT_MATERIAL_TESTING_ENGRAVE',
  'IMPORT_MATERIAL_TESTING_OLD',
  'IMPORT_MATERIAL_TESTING_CUT',
  'IMPORT_MATERIAL_TESTING_SIMPLECUT',
  'IMPORT_MATERIAL_TESTING_LINE',
  'IMPORT_MATERIAL_TESTING_PRINT',
  'IMPORT_ACRYLIC_FOCUS_PROBE',
  'START_CURVE_ENGRAVING_MODE',
  'START_TUTORIAL',
  'START_UI_INTRO',
];
