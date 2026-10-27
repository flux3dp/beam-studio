import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import layerManager from '@core/app/svgedit/layer/layerManager';
import changeWorkarea from '@core/app/svgedit/operations/changeWorkarea';
import {
  disableInnerEngraving,
  enableInnerEngraving,
  isInnerEngravingActive,
} from '@core/helpers/addOn/innerEngraving';
import { setPromarkInfo } from '@core/helpers/device/promark/promark-info';
import { disableOtherExclusiveModes } from '@core/helpers/exclusiveModes';
import { attributeMap, initLayerConfig, innerEngravingConfigKeys } from '@core/helpers/layer/layer-config-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { PromarkInfo } from '@core/interfaces/Promark';

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
 * @param promarkInfo a Promark laser source to apply after the current document is cleared
 * @param workarea a work area to move to at the same time, for turning the mode on from a machine
 *   that cannot do it. Both options are applied after the clear, so the save prompt still offers
 *   the old document — and before the new document's first layer is initialised, so a caller that
 *   changes the machine in the same step (document settings) must pass them, or the layer gets the
 *   old machine's defaults.
 * @returns whether the switch happened
 */
export const switchInnerEngravingMode = async (
  enabled: boolean,
  { promarkInfo, workarea }: { promarkInfo?: PromarkInfo; workarea?: WorkAreaModel } = {},
): Promise<boolean> => {
  if (isInnerEngravingActive() === enabled && !promarkInfo && !workarea) return true;

  // clearScene owns the save prompt and resets the undo stack; svgCanvas.clear() drops the meshes
  if (!(await svgEditor.clearScene())) return false;

  if (enabled) {
    // the rotary and the other coordinate-space modes cannot coexist with 3D; clearScene does not
    // touch them, and `setExclusiveMode` cannot be used here because its capability check runs
    // before the UV source and the 70 mm work area that this very switch applies
    disableOtherExclusiveModes('inner-engraving');
    enableInnerEngraving({ promarkInfo });
  } else {
    disableInnerEngraving();

    // so the layer initialisation below sees the source the caller is switching to as well
    if (promarkInfo) setPromarkInfo(promarkInfo);
  }

  // The inner-engraving dimension must be stored before changeWorkarea reads it to resize the canvas.
  if (workarea) changeWorkarea(workarea);

  // clearScene initialised the new document's first layer while the old mode, laser source and work
  // area were still in force, so it carries the old document's defaults (2D speed and frequency in
  // a 3D document, or the K9 crystal values in a 2D one): initialise it again now that the switch
  // is complete. The ConfigPanel re-reads the layer when the mode flips, so the panel follows.
  layerManager.getAllLayers().forEach((layer) => {
    const group = layer.getGroup();

    if (!group) return;

    // the inner engraving keys are not in the 2D defaults, so leaving the mode has to drop them
    if (!enabled) innerEngravingConfigKeys.forEach((key) => group.removeAttribute(attributeMap[key]));

    initLayerConfig(group);
  });

  return true;
};

export default switchInnerEngravingMode;
