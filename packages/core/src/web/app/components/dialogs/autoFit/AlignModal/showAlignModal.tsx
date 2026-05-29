import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import AlignModal from './AlignModal';
import type { ImageDimension } from './dimension';

const showAlignModal = (
  element: SVGElement,
  contour: AutoFitContour,
  imageUrl: string,
  onApply: (initDimension: ImageDimension, imageDimension: ImageDimension) => void,
): void => {
  const dialogId = 'auto-fit-align';

  if (!isIdExist(dialogId)) {
    addDialogComponent(
      dialogId,
      <AlignModal
        contour={contour}
        element={element}
        imageUrl={imageUrl}
        onApply={onApply}
        onClose={() => popDialogById(dialogId)}
      />,
    );
  }
};

export default showAlignModal;
