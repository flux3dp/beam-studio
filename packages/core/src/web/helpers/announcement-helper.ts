import dialogCaller from '@core/app/actions/dialog-caller';
import { axiosFluxId } from '@core/helpers/api/flux-id';
import i18n from '@core/helpers/i18n';
import localeHelper from '@core/helpers/locale-helper';
import storage from '@core/implementations/storage';

interface IRecord {
  isIgnored: number[];
  showed?: { [key: number]: number };
  skip?: boolean;
  times: number;
}

const getRecord = (): IRecord => storage.get('announcement-record');

const setRecord = (record: IRecord): void => {
  storage.set('announcement-record', record);
};

const setNotShowing = (id: number): void => {
  const record = getRecord();

  setRecord({
    ...record,
    isIgnored: [...record.isIgnored, id],
  });
};

const setShowedTimes = (id: number, maxTimes: number): void => {
  if (!maxTimes) {
    return;
  }

  const record = getRecord();
  const { showed = {} } = record;

  showed[id] = (showed[id] ?? 0) + 1;

  if (showed[id] >= maxTimes) {
    setNotShowing(id);
  } else {
    setRecord({
      ...record,
      showed,
    });
  }
};

const setDefaultRatingRecord = (): void => {
  const defaultRecord: IRecord = {
    isIgnored: [],
    times: 1,
  };

  setRecord(defaultRecord);
};

const showAnnouncement = async (isNewUser: boolean) => {
  const record = getRecord();

  if (record.skip) {
    return;
  }

  const lang = i18n.getActiveLang();
  let query = `locale=${lang}&times=${record.times}`;

  if (record.isIgnored.length > 0) {
    query += `&ignored=${record.isIgnored.join(',')}`;
  }

  if (isNewUser) {
    query += `&new_user=${isNewUser}`;
  }

  const regionInfo = localeHelper.getRegion();

  query += `&region=${regionInfo.region}${regionInfo.checkTimezone ? '' : '*'}`;

  const res = await axiosFluxId(`api/beam-studio/announcements?${query}`);

  if (!res?.data) {
    return;
  }

  const { announcement } = res.data;

  if (announcement) {
    dialogCaller.showAnnouncementDialog(announcement);
    setShowedTimes(announcement.id, announcement.max_times);
  }
};

const init = (isNewUser: boolean): void => {
  if (!storage.isExisting('announcement-record')) {
    setDefaultRatingRecord();
  } else {
    const record = getRecord();

    setRecord({
      ...record,
      times: record.times + 1,
    });
  }

  showAnnouncement(isNewUser);
};

export default {
  init,
  setNotShowing,
};
