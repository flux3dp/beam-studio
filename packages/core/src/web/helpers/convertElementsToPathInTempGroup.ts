import { partition } from 'remeda';

import history from '@core/app/svgedit/history/history';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { convertTextToPath } from './convertToPath';
import { getSVGAsync } from './svg-editor-helper';

let svgCanvas: ISVGCanvas;

getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

export const convertElementsToPathInTempGroup = async ({
  element,
  parentCommand = new history.BatchCommand('convertElementsToPathInTempGroup'),
}: {
  element: SVGGElement;
  parentCommand?: IBatchCommand;
}): Promise<SVGElement[]> => {
  if (element.getAttribute('data-tempgroup') !== 'true') {
    console.error('Element is not a temporary group');

    return [];
  }

  const { children } = element;
  const childrenList = [...Array.from(children)];
  const [textList, otherList] = partition(childrenList, ({ tagName }) => tagName === 'text');

  if (textList.length === 0) {
    return [element];
  }

  svgCanvas.ungroupTempGroup(element);

  const convertResult = await Promise.all(
    textList.map((child) => convertTextToPath({ element: child as SVGTextElement, isToSelect: false, parentCommand })),
  );
  const pathList = convertResult.map(({ path }) => path).filter((path): path is SVGPathElement => Boolean(path));

  svgCanvas.selectOnly([...(otherList as SVGElement[]), ...pathList]);

  return svgCanvas.tempGroupSelectedElements();
};
