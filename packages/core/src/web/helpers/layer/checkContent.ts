import MessageCaller from '@core/app/actions/message-caller';
import { CanvasElements } from '@core/app/constants/canvasElements';
import selectionManager from '@core/app/svgedit/selection';
import i18n from '@core/helpers/i18n';
import { MessageLevel } from '@core/interfaces/IMessage';

const selector = CanvasElements.visibleElems
  .map((tag) => `g.layer:not([display="none"]):not([data-repeat="0"]) ${tag}`)
  .join(', ');

export const isCanvasEmpty = (): boolean => {
  selectionManager.clearSelection();

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
