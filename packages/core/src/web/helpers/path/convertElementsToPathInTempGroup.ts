import { partition } from 'remeda';

import history from '@core/app/svgedit/history/history';
import selectionManager from '@core/app/svgedit/selection';
import type { IBatchCommand } from '@core/interfaces/IHistory';

import { convertTextToPath } from './convertToPath';

export const convertElementsToPathInTempGroup = async ({
  element,
  parentCommand = new history.BatchCommand('convertElementsToPathInTempGroup'),
}: {
  element: SVGGElement;
  parentCommand?: IBatchCommand;
}): Promise<SVGElement[]> => {
  if (!selectionManager.isTempGroup(element)) {
    console.error('Element is not a temporary group');

    return [];
  }

  const { children } = element;
  const childrenList = [...Array.from(children)];
  const [textList, otherList] = partition(childrenList, ({ tagName }) => tagName === 'text');

  if (textList.length === 0) {
    return [element];
  }

  selectionManager.ungroupTempGroup(element);

  const convertResult = await Promise.all(
    textList.map((child) =>
      convertTextToPath(child as SVGTextElement, { isToSelect: false, parentCmd: parentCommand }),
    ),
  );
  const pathList = convertResult.map(({ path }) => path).filter((path): path is SVGPathElement => Boolean(path));

  selectionManager.multiSelect([...(otherList as SVGElement[]), ...pathList]);

  return selectionManager.getSelectedElements();
};
