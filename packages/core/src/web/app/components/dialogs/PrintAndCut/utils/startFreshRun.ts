import alertCaller from '@core/app/actions/alert-caller';
import i18n from '@core/helpers/i18n';

import { usePrintAndCutStore } from '../store';

import { collectCanvasContents } from './collectContents';
import { clearRasterCache } from './computeContourPathD';

/**
 * Start the flow from the beginning on the current canvas: collect the visible
 * design and enter the setup step. Used both when the dialog opens without a
 * saved configuration and by the resume screen's Start Over.
 * @returns false when the canvas has no design content (an alert is shown; on
 * resume the design layers may simply still be hidden from the previous run)
 */
export const startFreshRun = (): boolean => {
  const contents = collectCanvasContents();

  if (contents.elements.length === 0) {
    alertCaller.popUp({ message: i18n.lang.print_and_cut.no_content });

    return false;
  }

  clearRasterCache();
  usePrintAndCutStore.getState().init(contents);

  return true;
};
