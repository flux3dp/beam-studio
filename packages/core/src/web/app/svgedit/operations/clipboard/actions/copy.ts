import selectionManager from '@core/app/svgedit/selection';

import { clipboardCore } from '../singleton';

export const copyElements = async (elems: Element[]): Promise<void> => {
  await clipboardCore.copyElements(elems);
};

export const copySelectedElements = async (): Promise<void> => {
  const selectedElems = selectionManager.getSelectedElements(true);

  await copyElements(selectedElems);

  selectionManager.tempGroupSelectedElements();
};
