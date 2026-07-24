import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import selectionManager from '@core/app/svgedit/selection';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { PRINT_AND_CUT_DIALOG_ID } from './constants';
import PrintAndCut from './PrintAndCut';
import { usePrintAndCutStore } from './store';
import { collectCanvasContents } from './utils/collectContents';
import { clearRasterCache } from './utils/computeCutPathD';

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

  const contents = collectCanvasContents();

  if (contents.elements.length === 0) {
    alertCaller.popUp({ message: i18n.lang.print_and_cut.no_content });

    return;
  }

  clearRasterCache();
  usePrintAndCutStore.getState().init(contents);
  addDialogComponent(PRINT_AND_CUT_DIALOG_ID, <PrintAndCut onClose={() => popDialogById(PRINT_AND_CUT_DIALOG_ID)} />);
};

export default showPrintAndCut;
