import { sprintf } from 'sprintf-js';

import alertConstants from '@core/app/constants/alert-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import browser from '@core/implementations/browser';
import type { IAlert } from '@core/interfaces/IAlert';

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');

const popUp = (args: IAlert): void => {
  if (!eventEmitter.listenerCount('POP_UP')) {
    setTimeout(() => popUp(args), 100);
  }

  eventEmitter.emit('POP_UP', args);
};

const alertCaller = (() => {
  return {
    checkIdExist: (id: string): boolean => {
      const response = { idExist: false };

      eventEmitter.emit('CHECK_ID_EXIST', id, response);

      return response.idExist;
    },
    popById: (id: string): void => {
      eventEmitter.emit('POP_BY_ID', id);
    },
    popUp,
    popUpCreditAlert: ({
      available,
      required,
      ...args
    }: Partial<IAlert> & { available: string; required: string }): void =>
      popUp({
        buttonLabels: [i18n.lang.alert.buy],
        buttonType: alertConstants.CUSTOM_CANCEL,
        callbacks: () => browser.open(i18n.lang.beambox.popup.ai_credit.buy_link),
        caption: i18n.lang.beambox.popup.ai_credit.insufficient_credit,
        message: sprintf(i18n.lang.beambox.popup.ai_credit.insufficient_credit_msg, required, available),
        ...args,
      }),
    popUpError: (args: IAlert): void => popUp({ ...args, type: alertConstants.SHOW_POPUP_ERROR }),
  };
})();

export default alertCaller;
