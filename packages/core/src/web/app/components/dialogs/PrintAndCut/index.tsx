import React from 'react';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import selectionManager from '@core/app/svgedit/selection';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { usePrintAndCutConfigStore } from './configStore';
import { PRINT_AND_CUT_DIALOG_ID } from './constants';
import PrintAndCut from './PrintAndCut';
import { usePrintAndCutStore } from './store';
import { matchPrintingContents } from './utils/printingContentsSnapshot';
import { startFreshRun } from './utils/startFreshRun';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const showPrintAndCut = (): void => {
  if (isIdExist(PRINT_AND_CUT_DIALOG_ID)) return;

  // deselect so multi-selected elements leave the temp group and are collected
  // from their layers; drop unused defs once so the preview clone, the contour
  // raster and the exported pdf all stay lean
  selectionManager.clearSelection();
  svgCanvas.removeUnusedDefs();

  const savedConfig = usePrintAndCutConfigStore.getState().config;

  if (savedConfig) {
    usePrintAndCutStore
      .getState()
      .initFromConfig(savedConfig, matchPrintingContents(savedConfig.printingContentsElements));
  } else if (!startFreshRun()) {
    return;
  }

  addDialogComponent(PRINT_AND_CUT_DIALOG_ID, <PrintAndCut onClose={() => popDialogById(PRINT_AND_CUT_DIALOG_ID)} />);
};

export default showPrintAndCut;
