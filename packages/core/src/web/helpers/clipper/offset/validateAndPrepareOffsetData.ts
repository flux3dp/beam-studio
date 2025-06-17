import { match, P } from 'ts-pattern';

import { BatchCommand } from '@core/app/svgedit/history/history';
import { convertTextToPath } from '@core/helpers/convertToPath';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface ValidationResult {
  command?: IBatchCommand;
  elementsToOffset?: SVGElement[];
  errorType?: 'multiple_elements_not_supported' | 'no_elements';
  isValid: boolean;
}

async function matchElementType(element: SVGElement, elementsToOffset: SVGElement[], groups: SVGElement[]) {
  await match(element)
    .with({ children: P.array(), tagName: 'g' }, (elem) => {
      groups.push(elem);
    })
    .with({ tagName: 'text' }, async (element) => {
      const { path } = await convertTextToPath({ element });

      elementsToOffset.push(path as SVGElement);
    })
    .otherwise(() => {
      elementsToOffset.push(element);
    });
}

export async function validateAndPrepareOffsetData(currentElems: SVGElement[] | undefined): Promise<ValidationResult> {
  const originalElements = currentElems || svgCanvas.getSelectedElems(true);
  let command: IBatchCommand | undefined = new BatchCommand('validateAndPrepareOffsetData');
  let isUseCommand = false;

  if (originalElements.length === 0) {
    console.log('No elements selected or provided for offset.');

    return { errorType: 'no_elements', isValid: false };
  }

  const elementsToOffset: SVGElement[] = [];
  const groups: SVGElement[] = [];

  for await (const elem of originalElements) {
    await matchElementType(elem, elementsToOffset, groups);
  }

  while (groups.length) {
    const group = groups.pop();

    if (!group) continue;

    await matchElementType(group, elementsToOffset, groups);
  }

  return { command: isUseCommand ? command : undefined, elementsToOffset, isValid: true };
}
