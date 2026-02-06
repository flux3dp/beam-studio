import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import storage from '@core/implementations/storage';

import i18n from '../i18n';
import sentryHelper from '../sentry-helper';

export const askAndInitSentry = async (): Promise<void> => {
  const enableSentry = storage.get('enable-sentry');

  if (enableSentry === null) {
    await new Promise<void>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        caption: i18n.lang.beambox.popup.sentry.title,
        iconUrl: 'img/beambox/icon-analyze.svg',
        id: 'ask-sentry',
        message: i18n.lang.beambox.popup.sentry.message,
        onNo: () => {
          storage.set('enable-sentry', false);
          resolve();
        },
        onYes: () => {
          storage.set('enable-sentry', true);
          sentryHelper.initSentry();
          resolve();
        },
      });
    });
  }
};

export default askAndInitSentry;
