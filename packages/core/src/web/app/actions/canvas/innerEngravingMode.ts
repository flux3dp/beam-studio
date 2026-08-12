import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import { isInnerEngravingActive } from '@core/helpers/innerEngraving';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';

let svgEditor: ISVGEditor;

getSVGAsync(({ Editor }) => {
  svgEditor = Editor;
});

/**
 * Turn inner engraving mode on or off, starting a new document in the process.
 *
 * 2D and 3D do not mix in V1 — an STL has nowhere to go in a 2D document and 2D artwork has nowhere
 * to go in an inner engraving one — so switching is a **new-file** operation rather than a view
 * toggle. That has two consequences worth stating:
 *
 * 1. the user is asked to save first, and **cancelling cancels the whole switch**, including
 *    whatever the caller was about to do next (importing a file, saving the document settings)
 * 2. the canvas, the STL meshes and the undo stack all go together. Keeping the undo stack would
 *    let one undo step reach back into a document that no longer exists — the meshes behind it are
 *    already disposed of, so it could not be restored anyway
 *
 * @param workarea a work area to move to at the same time, for turning the mode on from a machine
 *   that cannot do it. Applied after the clear, so the save prompt still offers the old document
 * @returns whether the switch happened
 */
export const switchInnerEngravingMode = async (
  enabled: boolean,
  { workarea }: { workarea?: WorkAreaModel } = {},
): Promise<boolean> => {
  if (isInnerEngravingActive() === enabled && !workarea) return true;

  // clearScene owns the save prompt and resets the undo stack; svgCanvas.clear() drops the meshes
  if (!(await svgEditor.clearScene())) return false;

  if (workarea) changeWorkarea(workarea);

  useDocumentStore.getState().set('inner-engraving', enabled);

  return true;
};

export default switchInnerEngravingMode;
