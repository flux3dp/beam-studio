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
  elementsToOffset?: SVGElement[];
  errorType?: 'multiple_elements_not_supported' | 'no_elements';
  isValid: boolean;
}

export async function validateAndPrepareOffsetData(currentElems: SVGElement[] | undefined): Promise<ValidationResult> {
  const originalElements = currentElems || svgCanvas.getSelectedElems(true);
  let command: IBatchCommand | undefined = new BatchCommand('validateAndPrepareOffsetData');

  if (originalElements.length === 0) {
    console.log('No elements selected or provided for offset.');

    return { errorType: 'no_elements', isValid: false };
  }

  const elementsToOffset: SVGElement[] = [];
  const groups: SVGElement[] = [];

  for await (const element of originalElements) {
    await match(element)
      .with({ children: { length: P.not(0) }, tagName: 'g' }, (elem) => {
        groups.push(elem);
      })
      .with({ tagName: 'text' }, async (element) => {
        const { command: subCommand, path } = await convertTextToPath({ element });

        if (subCommand) {
          command.addSubCommand(subCommand);
        }

        elementsToOffset.push(path!);
      })
      .otherwise(() => {
        elementsToOffset.push(element);
      });
  }

  while (groups.length) {
    const group = groups.pop();

    if (!group) continue;

    for await (const element of group.children) {
      await match(element as SVGElement)
        .with({ tagName: 'g' }, (element) => {
          groups.push(element);
        })
        .with({ tagName: 'text' }, async (element) => {
          const { command: subCommand, path } = await convertTextToPath({ element });

          if (subCommand) {
            command.addSubCommand(subCommand);
          }

          elementsToOffset.push(path!);
        })
        .otherwise((element) => {
          elementsToOffset.push(element);
        });
    }
  }

  if (command) {
    command.doUnapply();
  }

  return { elementsToOffset, isValid: true };
}
