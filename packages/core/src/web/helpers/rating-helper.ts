/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/dot-notation */
import Dialog from 'app/actions/dialog-caller';
import isWeb from 'helpers/is-web';
import storage from 'implementations/storage';
import { getInfo, submitRating } from 'helpers/api/flux-id';

interface IRecord {
  times: number,
  score: number,
  version: string,
  isVoted: boolean,
  isIgnored: boolean,
  user?: string,
}

const getRecord = (): IRecord => storage.get('rating-record') as IRecord;

const setRecord = (record: IRecord): void => {
  storage.set('rating-record', record);
};

const setNotShowing = (): void => {
  const record = getRecord();

  setRecord({
    ...record,
    version: window['FLUX'].version,
    isIgnored: true,
  });
};

const setVoted = (score: number): void => {
  const record = getRecord();

  setRecord({
    ...record,
    score,
    version: window['FLUX'].version,
    isVoted: true,
  });

  getInfo(true).then((response) => {
    if (response && response.status === 'ok') {
      submitRating({
        user: response.email,
        score,
        version: window['FLUX'].version,
        app: 'Beam Studio',
      });
    } else {
      submitRating({
        score,
        version: window['FLUX'].version,
        app: 'Beam Studio',
      });
    }
  });
};

const setDefaultRatingRecord = (): void => {
  const defaultRecord = {
    times: 1,
    version: window['FLUX'].version,
    score: 0,
    isVoted: false,
    isIgnored: false,
  };
  storage.set('rating-record', defaultRecord);
};

const init = (): void => {
  if (isWeb()) return;
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

    setRecord({
      ...record,
      times: record.times + 1,
    });
  }
};

export default {
  init,
  setNotShowing,
};
