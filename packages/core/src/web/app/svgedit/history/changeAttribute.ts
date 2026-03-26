import type { HistoryActionOptions, IBatchCommand } from '@core/interfaces/IHistory';

import { BatchCommand, ChangeElementCommand } from './history';
import { handleHistoryActionOptions } from './utils/handleHistoryActionOptions';

export const changeAttribute = (elem: Element, newAttributes: Record<string, string>): ChangeElementCommand | null => {
  const oldAttributes: Record<string, string> = {};

  for (const key in newAttributes) {
    const oldValue = elem.getAttribute(key) || '';

    if (oldValue === newAttributes[key]) {
      delete newAttributes[key];
      continue;
    }

    oldAttributes[key] = oldValue;
    elem.setAttribute(key, newAttributes[key]);
  }

  if (Object.keys(newAttributes).length === 0) {
    return null;
  }

  return new ChangeElementCommand(elem, oldAttributes);
};

export const changeElementsAttribute = (
  elems: Element[],
  newAttributes: Record<string, string>,
  options: HistoryActionOptions = {},
): IBatchCommand => {
  const batchCmd = new BatchCommand('Change Elements Attribute');

  elems.forEach((elem) => {
    const cmd = changeAttribute(elem, newAttributes);

    if (cmd) {
      batchCmd.addSubCommand(cmd);
    }
  });

  handleHistoryActionOptions(batchCmd, options);

  return batchCmd;
};

export default changeAttribute;
