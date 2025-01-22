import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import AutoFitPanel from './AutoFitPanel';

export const showAutoFitPanel = (element: SVGElement, imageUrl: string, data: AutoFitContour[][]): void => {
  const dialogId = 'auto-fit-panel';

  if (!isIdExist(dialogId)) {
    addDialogComponent(
      dialogId,
      <AutoFitPanel data={data} element={element} imageUrl={imageUrl} onClose={() => popDialogById(dialogId)} />,
    );
  }
};

export default {
  showAutoFitPanel,
};
