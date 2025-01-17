import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';

import { AutoFitContour } from 'interfaces/IAutoFit';

import AutoFitPanel from './AutoFitPanel';

export const showAutoFitPanel = (
  element: SVGElement,
  imageUrl: string,
  data: AutoFitContour[][]
): void => {
  const dialogId = 'auto-fit-panel';
  if (!isIdExist(dialogId)) {
    addDialogComponent(
      dialogId,
      <AutoFitPanel
        onClose={() => popDialogById(dialogId)}
        element={element}
        imageUrl={imageUrl}
        data={data}
      />
    );
  }
};

export default {
  showAutoFitPanel,
};
