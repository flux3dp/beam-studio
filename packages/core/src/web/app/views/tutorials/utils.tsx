// Copied from context

import { PanelType } from '@core/app/constants/right-panel-types';
import { TutorialCallbacks } from '@core/app/constants/tutorial-constants';
import RightPanelController from '@core/app/views/beambox/Right-Panels/contexts/RightPanelController';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

let defaultRectRef: Element | undefined = undefined;
let mockElementDiv: Element | undefined = undefined;

const clearDefaultRect = () => {
  if (defaultRectRef) {
    defaultRectRef.remove();
    svgCanvas.clearSelection();
    RightPanelController.setPanelType(PanelType.Layer);
    defaultRectRef = undefined;
  }
};

const selectDefaultRect = () => {
  if (defaultRectRef) {
    clearDefaultRect();
  }

  const defaultRect = svgCanvas.addSvgElementFromJson({
    attr: {
      'fill-opacity': 0,
      height: 100,
      id: svgCanvas.getNextId(),
      opacity: 1,
      stroke: '#000',
      width: 100,
      x: -1000,
      y: -1000,
    },
    curStyles: false,
    element: 'rect',
  });

  defaultRectRef = defaultRect;
  svgCanvas.selectOnly([defaultRect], true);
  RightPanelController.setPanelType(PanelType.Object);
};

const scrollToParameterSelect = async (): Promise<void> => {
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
  RightPanelController.setPanelType(PanelType.Layer);
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
  document.querySelector('#layer-parameters')?.scrollIntoView();
};

const scrollToAddLayerButton = (): void => {
  RightPanelController.setPanelType(PanelType.Layer);

  const panel = document.querySelector('#layer-and-laser-panel');

  if (panel) panel.scrollTop = 0;
};

export const handleCallback = async (callbackId: TutorialCallbacks): Promise<void> => {
  console.log('Handling tutorial callback:', callbackId);

  if (callbackId === TutorialCallbacks.SELECT_DEFAULT_RECT) {
    selectDefaultRect();
  } else if (callbackId === TutorialCallbacks.SCROLL_TO_PARAMETER) {
    await scrollToParameterSelect();
  } else if (callbackId === TutorialCallbacks.SCROLL_TO_ADD_LAYER) {
    scrollToAddLayerButton();
  } else {
    console.log('Unknown callback id', callbackId);
  }
};

export const moveToStep = async (step): Promise<boolean> => {
  if (step.beforeStep) {
    await step.beforeStep();
  }

  const target = step.target?.();

  if (target) {
    // Note: Tour scrollIntoView not working as expected, use custom scrollIntoViewIfNeeded
    target.scrollIntoViewIfNeeded();
  }

  return true;
};
