import progressCaller from '@core/app/actions/progress-caller';
import type { BatchCommand } from '@core/app/svgedit/history/history';
import i18n from '@core/helpers/i18n';

import type { OffsetMode } from './constants';
import { createAndApplyOffsetElement } from './createAndApplyOffsetElement';
import { performOffsetAndUnionOperations } from './performOffsetAndUnionOperations';
import { showOffsetAlert } from './showOffSetAlert';
import { validateAndPrepareOffsetData } from './validateAndPrepareOffsetData';

interface OffsetOptions {
  /** When false, returns the BatchCommand without adding to history (for preview mode) */
  addToHistory?: boolean;
}

const offsetElements = async (
  mode: OffsetMode,
  distance: number,
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[],
  options: OffsetOptions = {},
): Promise<BatchCommand | null> => {
  const { addToHistory = true } = options;

  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  await new Promise((resolve) => setTimeout(resolve, 50)); // Brief pause for UI

  const validation = await validateAndPrepareOffsetData(elems);

  if (!validation.isValid || !validation.elementsToOffset) {
    progressCaller.popById('offset-path');

    return null;
  }

  const { elementsToOffset } = validation;
  const offsetResult = await performOffsetAndUnionOperations(elementsToOffset, mode, distance, cornerType);

  if (offsetResult.errorType) {
    if (offsetResult.errorType === 'unsupported_element') {
      showOffsetAlert('unsupported');
    } else {
      // 'processing_failed' or 'union_failed'
      showOffsetAlert('failed');
    }

    progressCaller.popById('offset-path');

    return null;
  }

  const batchCmd = createAndApplyOffsetElement(offsetResult.solutionPaths, { addToHistory });

  // Pop progress after all operations are done or if an error occurred and handled
  progressCaller.popById('offset-path');

  return batchCmd;
};

export default offsetElements;
