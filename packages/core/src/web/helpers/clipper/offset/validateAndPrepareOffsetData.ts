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
  const originalElements = currentElems || svgCanvas.getSelectedElems(true);

  if (originalElements.length === 0) {
    console.log('No elements selected or provided for offset.');

    return { errorType: 'no_elements', isValid: false };
  }

  const elementsToOffset: SVGElement[] = [];
  const groups: SVGElement[] = [];

  for (const elem of originalElements) {
    if (elem.tagName === 'g' && elem.children.length > 0) {
      groups.push(elem);
    } else {
      elementsToOffset.push(elem);
    }
  }

  while (groups.length) {
    const group = groups.pop();

    if (!group) continue;

    for (const child of group.children) {
      if (child.tagName !== 'g' && child.tagName !== 'use') {
        elementsToOffset.push(child as SVGElement);
      } else if (child.tagName === 'g' && child.children.length > 1) {
        groups.push(child as SVGElement);
      }
    }
  }

  return { elementsToOffset, isValid: true };
}
