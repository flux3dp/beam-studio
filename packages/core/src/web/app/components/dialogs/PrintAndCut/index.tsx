import React from 'react';

import alertCaller from '@core/app/actions/alert-caller';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import selectionManager from '@core/app/svgedit/selection';
import { checkOpenCvSupport } from '@core/helpers/api/open-cv';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { PRINT_AND_CUT_DIALOG_ID } from './constants';
import PrintAndCut from './PrintAndCut';
import { useResumeConfigStore } from './resumeConfigStore';
import { usePrintAndCutStore } from './store';
import { matchPrintingContents } from './utils/printingContentsSnapshot';
import { startFreshRun } from './utils/startFreshRun';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

export const showPrintAndCut = async (): Promise<void> => {
  if (isIdExist(PRINT_AND_CUT_DIALOG_ID)) return;

  // the desktop app bundles its own fluxghost; the web version talks to the
  // machine's, which may predate the opencv commands the whole flow relies on
  // (image_contour and detect_blobs ship together, so one probe covers both)
  if (isWeb() && !(await checkOpenCvSupport('imageContour'))) {
    alertCaller.popUpError({ message: i18n.lang.print_and_cut.backend_outdated });

    return;
  }

  // deselect so multi-selected elements leave the temp group and are collected
  // from their layers; drop unused defs once so the preview clone, the contour
  // raster and the exported pdf all stay lean
  selectionManager.clearSelection();
  svgCanvas.removeUnusedDefs();

  const savedConfig = useResumeConfigStore.getState().config;

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
