import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import type { OffsetMode } from './constants';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface ValidationResult {
  elementsToOffset?: SVGElement[];
  errorType?: 'multiple_elements_not_supported' | 'no_elements';
  isValid: boolean;
}

export function validateAndPrepareOffsetData(
  currentElems: SVGElement[] | undefined,
  mode: OffsetMode,
): ValidationResult {
  const targetElements = currentElems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    console.log('No elements selected or provided for offset.');

    return { errorType: 'no_elements', isValid: false };
  }

  // if (targetElements.length > 1 && ['inwardFilled', 'outwardFilled'].includes(mode)) {
  //   alertCaller.popUp({
  //     id: 'OffsetMultipleNotSupported',
  //     message: 'This operation mode currently supports only a single selected element to adjust its internal gaps.',
  //     type: alertConstants.SHOW_POPUP_WARNING,
  //   });

  //   return { errorType: 'multiple_elements_not_supported', isValid: false };
  // }

  return { elementsToOffset: targetElements, isValid: true };
}
