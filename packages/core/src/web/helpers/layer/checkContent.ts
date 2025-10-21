import MessageCaller from '@core/app/actions/message-caller';
import { CanvasElements } from '@core/app/constants/canvasElements';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { MessageLevel } from '@core/interfaces/IMessage';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const selector = CanvasElements.visibleElems
  .map((tag) => `g.layer:not([display="none"]):not([data-repeat="0"]) ${tag}`)
  .join(', ');

export const isCanvasEmpty = (): boolean => {
  svgCanvas.clearSelection();

  const isEmpty = !document.querySelector(selector);

  if (isEmpty) {
    MessageCaller.openMessage({
      content: i18n.lang.topbar.alerts.add_content_first,
      duration: 3,
      level: MessageLevel.INFO,
    });
  }

  return isEmpty;
};
