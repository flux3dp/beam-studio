import { getAddOnInfo } from '@core/app/constants/addOn';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useCurveEngravingStore } from '@core/app/stores/curveEngravingStore';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { isInnerEngravingActive } from '@core/helpers/innerEngraving';

/**
 * Document modes that reshape the work area or the canvas itself, and therefore cannot be combined.
 *
 * Each one redefines what the coordinate space means — rotary turns Y into rotation, pass-through
 * and auto-feeder extend the material past the machine, curve engraving adds a measured Z surface,
 * inner engraving replaces the whole canvas with a 3D scene. Two at once has no meaning, and the
 * combinations mostly cannot even be expressed in the F-code.
 */
export type ExclusiveMode = 'auto-feeder' | 'curve-engraving' | 'inner-engraving' | 'pass-through' | 'rotary';

/**
 * Whichever exclusive mode is currently on, or null.
 *
 * Each mode is checked against the machine as well as the stored flag: a document carrying
 * `rotary_mode` opened on a machine without a rotary is not in rotary mode, and the same reasoning
 * applies to the rest. `null` means every mode is free to be turned on.
 */
export const getActiveExclusiveMode = (): ExclusiveMode | null => {
  const documentStore = useDocumentStore.getState();
  const addOnInfo = getAddOnInfo(documentStore.workarea);

  if (isInnerEngravingActive()) return 'inner-engraving';

  if (documentStore.rotary_mode && addOnInfo.rotary) return 'rotary';

  if (documentStore['pass-through'] && addOnInfo.passThrough) return 'pass-through';

  if (documentStore['auto-feeder'] && addOnInfo.autoFeeder) return 'auto-feeder';

  // curve engraving is a canvas mode rather than a document setting, so it is on either while the
  // user is in it or while a measured surface is being kept for the next job
  if (
    addOnInfo.curveEngraving &&
    (useCurveEngravingStore.getState().hasData || useCanvasStore.getState().mode === CanvasMode.CurveEngraving)
  ) {
    return 'curve-engraving';
  }

  return null;
};

/**
 * Whether curve engraving can be entered right now.
 *
 * The single source for the menu gates and for the controller itself, so the native menu, the web
 * menu and a stale hotkey cannot disagree about it.
 */
export const canStartCurveEngraving = (): boolean => {
  if (!getAddOnInfo(useDocumentStore.getState().workarea).curveEngraving) return false;

  const active = getActiveExclusiveMode();

  return active === null || active === 'curve-engraving';
};
