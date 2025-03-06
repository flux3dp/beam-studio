import Dialog from '@core/app/actions/dialog-caller';
import { getInfo, submitRating } from '@core/helpers/api/flux-id';
import isWeb from '@core/helpers/is-web';
import storage from '@core/implementations/storage';

import isDev from './is-dev';

interface IRecord {
  isIgnored: boolean;
  isVoted: boolean;
  score: number;
  times: number;
  user?: string;
  version: string;
}

const getRecord = (): IRecord => storage.get('rating-record') as IRecord;

const setRecord = (record: IRecord): void => {
  storage.set('rating-record', record);
};

const setNotShowing = (): void => {
  const record = getRecord();

  setRecord({
    ...record,
    isIgnored: true,
    version: window['FLUX'].version,
  });
};

const setVoted = (score: number): void => {
  const record = getRecord();

  setRecord({
    ...record,
    isVoted: true,
    score,
    version: window['FLUX'].version,
  });

  getInfo(true).then((response) => {
    if (response && response.status === 'ok') {
      submitRating({
        app: 'Beam Studio',
        score,
        user: response.email,
        version: window['FLUX'].version,
      });
    } else {
      submitRating({
        app: 'Beam Studio',
        score,
        version: window['FLUX'].version,
      });
    }
  });
};

const setDefaultRatingRecord = (): void => {
  const defaultRecord = {
    isIgnored: isDev() ? true : false,
    isVoted: false,
    score: 0,
    times: 1,
    version: window['FLUX'].version,
  };

  storage.set('rating-record', defaultRecord);
};

const init = (): void => {
  if (isWeb()) {
    return;
  }

  if (!storage.isExisting('rating-record')) {
    setDefaultRatingRecord();
  } else {
    const record = getRecord();

    console.log('Rating Record', record);

    if (window['FLUX'].version !== record.version) {
      setDefaultRatingRecord();

      return;
    }

    if (record.isIgnored || record.isVoted) {
      return;
    }

    if (record.times > 4 && record.times % 5 === 0 && window.navigator.onLine) {
      Dialog.showRatingDialog(setVoted);
    }

    setRecord({ ...record, times: record.times + 1 });
  }
};

export default { init, setNotShowing };
