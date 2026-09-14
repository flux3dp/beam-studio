import { LaserType, UV_WORKAREA_OPTIONS } from '@core/app/constants/promark-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { checkFpm1UV } from '@core/helpers/checkFeature';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import type { DocumentState } from '@core/interfaces/Preference';
import type { PromarkInfo } from '@core/interfaces/Promark';

import {
  type AddOnModeContext,
  type AddOnModeMutationOptions,
  resolveAddOnInfo,
  resolveDocumentValue,
  resolveWorkarea,
  updateDocumentMode,
} from './types';

type CustomizedDimension = DocumentState['customized-dimension'];
type InnerEngravingState = Partial<Pick<DocumentState, 'customized-dimension'>> &
  Pick<DocumentState, 'inner-engraving' | 'workarea'>;

export const PROMARK_UV_INFO = { laserType: LaserType.UV, watt: 5 } satisfies PromarkInfo;

export const getInnerEngravingCustomizedDimension = (
  current: CustomizedDimension = useDocumentStore.getState()['customized-dimension'],
): CustomizedDimension => {
  const requiredSize = UV_WORKAREA_OPTIONS[0];

  return { ...current, fpm1: { height: requiredSize, width: requiredSize } };
};

export const checkInnerEngraving = (context: AddOnModeContext = {}): boolean => {
  const promarkInfo = context.promarkInfo === undefined ? getPromarkInfo() : context.promarkInfo;
  const workarea = resolveWorkarea(context);
  const dimension = resolveDocumentValue('customized-dimension', context)?.[workarea];
  const requiredSize = UV_WORKAREA_OPTIONS[0];

  return (
    checkFpm1UV() &&
    Boolean(resolveAddOnInfo(context)?.innerEngraving) &&
    promarkInfo?.laserType === LaserType.UV &&
    workarea === 'fpm1' &&
    dimension?.width === requiredSize &&
    dimension.height === requiredSize
  );
};

/** Whether inner engraving is supported and currently enabled. */
export const getInnerEngraving = (context: AddOnModeContext = {}): boolean =>
  checkInnerEngraving(context) && Boolean(resolveDocumentValue('inner-engraving', context));

export const enableInnerEngraving = (options: AddOnModeMutationOptions = {}): void => {
  const customizedDimension =
    options.values?.['customized-dimension'] ?? useDocumentStore.getState()['customized-dimension'];

  updateDocumentMode(
    {
      'customized-dimension': getInnerEngravingCustomizedDimension(customizedDimension),
      'inner-engraving': true,
    },
    options,
  );

  if (options.applyRuntime !== false) setPromarkInfo(options.promarkInfo ?? PROMARK_UV_INFO);
};

export const disableInnerEngraving = (options: AddOnModeMutationOptions = {}): void =>
  updateDocumentMode({ 'inner-engraving': false }, options);

/** Whether a work area and laser source can run inner engraving. */
export const supportInnerEngraving = (
  model: WorkAreaModel,
  promarkInfo: PromarkInfo = getPromarkInfo(),
  customizedDimension?: CustomizedDimension,
): boolean =>
  checkInnerEngraving({
    promarkInfo,
    values: customizedDimension ? { 'customized-dimension': customizedDimension } : undefined,
    workarea: model,
  });

/** Resolve the effective mode from both the document toggle and machine capability. */
export const resolveInnerEngravingActive = (
  state: InnerEngravingState,
  promarkInfo: PromarkInfo = getPromarkInfo(),
): boolean => getInnerEngraving({ promarkInfo, values: state, workarea: state.workarea });

/**
 * Whether inner engraving mode is currently active.
 *
 * The document store only holds the user's toggle: it cannot combine it with the model capability
 * itself. Callers use these helpers instead of reading `inner-engraving` directly, so a document
 * saved with a Promark UV source does not put another machine into inner engraving mode.
 */
export const isInnerEngravingActive = (): boolean => {
  return getInnerEngraving();
};

/** Hook form of {@link isInnerEngravingActive}. */
export const useInnerEngravingActive = (): boolean => useDocumentStore(resolveInnerEngravingActive);

/**
 * Whether a file in a file browser should be presented as an inner engraving (3D) document.
 *
 * Its thumbnail is a 3D render on a transparent background, so the guide-lines picture behind the
 * 2D thumbnails — which stands for the 2D canvas — is the wrong backdrop for it.
 *
 * Deliberately just the flag: the local browser reads it out of the .beam header, and the cloud
 * listing can carry the same field in its metadata. Until that field is available, a cloud file
 * falls back to the 2D presentation rather than guessing from its Promark UV work area.
 */
export const isInnerEngravingFile = (file: { innerEngraving?: boolean }): boolean => Boolean(file.innerEngraving);

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
 * 4. **View settings with nothing to act on** — auto align has no 2D neighbours to align against
 *    and draws its guide lines into the hidden SVG canvas; anti-aliasing sets `shape-rendering` on
 *    that same hidden canvas, while the 3D canvas's own antialiasing is fixed when its WebGL
 *    context is created and cannot be toggled without rebuilding the whole renderer
 *
 * Plus the two guided tours, which walk the user through the 2D canvas that is not on screen.
 */
export const INNER_ENGRAVING_DISABLED_MENU_ITEMS = [
  'ANTI_ALIASING',
  'AUTO_ALIGN',
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
