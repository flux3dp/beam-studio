import progressCaller from '@core/app/actions/progress-caller';
import i18n from '@core/helpers/i18n';

import type { OffsetMode } from './constants';
import { createAndApplyOffsetElement } from './createAndApplyOffsetElement';
import { performOffsetAndUnionOperations } from './performOffsetAndUnionOperations';
import { showOffsetAlert } from './showOffSetAlert';
import { validateAndPrepareOffsetData } from './validateAndPrepareOffsetData';

const offsetElements = async (
  mode: OffsetMode,
  distance: number,
  cornerType: 'round' | 'sharp',
  elems?: SVGElement[],
): Promise<void> => {
  progressCaller.openNonstopProgress({ id: 'offset-path', message: i18n.lang.beambox.popup.progress.calculating });
  await new Promise((resolve) => setTimeout(resolve, 50)); // Brief pause for UI

  const validation = await validateAndPrepareOffsetData(elems);

  if (!validation.isValid || !validation.elementsToOffset) {
    progressCaller.popById('offset-path');

    return;
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

    return;
  }

  if (validation.command) {
    validation.command.doUnapply();
  }

  createAndApplyOffsetElement(offsetResult.solutionPaths);

  // Pop progress after all operations are done or if an error occurred and handled
  progressCaller.popById('offset-path');
};

export default offsetElements;
