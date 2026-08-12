import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { switchInnerEngravingMode } from '@core/app/actions/canvas/innerEngravingMode';
import alertConstants from '@core/app/constants/alert-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea, supportInnerEngraving } from '@core/app/constants/workarea-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { checkFpm1UV } from '@core/helpers/checkFeature';
import i18n from '@core/helpers/i18n';
import { isInnerEngravingActive } from '@core/helpers/innerEngraving';
import { uvModel } from '@core/helpers/is-dev';

const ask = (caption: string, message: string): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      caption,
      id: 'inner-engraving-mode-switch',
      message,
      messageIcon: 'notice',
      onNo: () => resolve(false),
      onYes: () => resolve(true),
    });
  });

/**
 * The work area to move to in order to turn inner engraving on, or null when the current one
 * already supports it.
 *
 * Inner engraving is a UV machine capability, so turning the mode on from a document set to any
 * other machine is really two changes at once — and the work area is the one the user has to agree
 * to, because it changes the whole document, not just the canvas.
 */
export const getInnerEngravingWorkarea = (current: WorkAreaModel): null | WorkAreaModel =>
  supportInnerEngraving(current) ? null : uvModel;

/**
 * Decide what a file's inner engraving flag means for the current document, asking when it costs a
 * work area change.
 *
 * For a .beam / .bvg the mode travels **with the file**, so most of the time there is nothing to
 * ask: a file that matches the current work area just applies, and so does one that turns the mode
 * off. The only case worth a question is a file that needs a different machine.
 *
 * @returns the mode to apply and the work area to apply it on (null = keep the current one)
 */
export const resolveInnerEngravingForFile = async (
  fileWantsInnerEngraving: boolean,
  current: WorkAreaModel,
): Promise<{ innerEngraving: boolean; workarea: null | WorkAreaModel }> => {
  if (!fileWantsInnerEngraving) return { innerEngraving: false, workarea: null };

  const target = getInnerEngravingWorkarea(current);

  if (!target) return { innerEngraving: true, workarea: null };

  // the machine is not available to this user at all, so there is no switch to offer. The file
  // still opens — its projection rects are ordinary elements — it just opens in 2D
  if (!checkFpm1UV()) {
    alertCaller.popUp({
      caption: i18n.lang.beambox.svg_editor.unnsupported_file_type,
      id: 'inner-engraving-unsupported',
      message: i18n.lang.inner_engraving.mode_unavailable,
      type: alertConstants.SHOW_POPUP_WARNING,
    });

    return { innerEngraving: false, workarea: null };
  }

  const t = i18n.lang.inner_engraving;
  const accepted = await ask(t.mode_switch_title, sprintf(t.file_needs_workarea, getWorkarea(target).label));

  return accepted ? { innerEngraving: true, workarea: target } : { innerEngraving: false, workarea: null };
};

/**
 * Gate an import on the canvas mode, offering to switch when the two disagree.
 *
 * The 2D canvas and the 3D one hold different things and V1 does not mix them: an STL has nowhere
 * to go in a 2D document, and 2D artwork has nowhere to go in an inner engraving one. So rather
 * than refusing outright — which leaves the user to find the switch in the document settings — the
 * file type is reported as unsupported *and* the matching mode is offered in the same breath.
 *
 * Unlike {@link resolveInnerEngravingForFile} this always asks: nothing about the file says the
 * mode should change, only that it cannot be imported as things stand.
 *
 * @param needsInnerEngraving what the file being imported requires
 * @returns whether the import should go ahead
 */
export const ensureModeForImport = async (needsInnerEngraving: boolean): Promise<boolean> => {
  if (isInnerEngravingActive() === needsInnerEngraving) return true;

  const t = i18n.lang.inner_engraving;

  if (!needsInnerEngraving) {
    if (!(await ask(t.mode_switch_title, t.disable_mode))) return false;

    // the switch starts a new document, so cancelling its save prompt cancels the import too
    return switchInnerEngravingMode(false);
  }

  if (!checkFpm1UV()) {
    alertCaller.popUp({
      caption: i18n.lang.beambox.svg_editor.unnsupported_file_type,
      id: 'inner-engraving-unsupported',
      message: t.mode_unavailable,
      type: alertConstants.SHOW_POPUP_WARNING,
    });

    return false;
  }

  const target = getInnerEngravingWorkarea(useDocumentStore.getState().workarea);
  const message = target ? sprintf(t.enable_mode_with_workarea, getWorkarea(target).label) : t.enable_mode;

  if (!(await ask(t.mode_switch_title, message))) return false;

  return switchInnerEngravingMode(true, { workarea: target ?? undefined });
};
