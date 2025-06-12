import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface ValidationResult {
  elementsToOffset?: SVGElement[];
  errorType?: 'multiple_elements_not_supported' | 'no_elements';
  isValid: boolean;
}

export function validateAndPrepareOffsetData(currentElems: SVGElement[] | undefined): ValidationResult {
  const targetElements = currentElems || svgCanvas.getSelectedElems(true);

  if (targetElements.length === 0) {
    console.log('No elements selected or provided for offset.');

    return { errorType: 'no_elements', isValid: false };
  }

  return { elementsToOffset: targetElements, isValid: true };
}
