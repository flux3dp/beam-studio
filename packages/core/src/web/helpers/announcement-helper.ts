import dialogCaller from 'app/actions/dialog-caller';
import i18n from 'helpers/i18n';
import storage from 'implementations/storage';
import { axiosFluxId } from 'helpers/api/flux-id';

interface IRecord {
  times: number;
  isIgnored: number[];
  skip?: boolean;
}

const getRecord = (): IRecord => storage.get('announcement-record') as IRecord;

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

const setDefaultRatingRecord = (): void => {
  const defaultRecord: IRecord = {
    times: 1,
    isIgnored: [],
  };
  setRecord(defaultRecord);
};

const showAnnouncement = async (isNewUser: boolean) => {
  const record = getRecord();
  if (record.skip) return;
  const lang = i18n.getActiveLang();
  let query = `locale=${lang}&times=${record.times}`;
  if (record.isIgnored.length > 0) {
    query += `&ignored=${record.isIgnored.join(',')}`;
  }
  if (isNewUser) {
    query += `&new_user=${isNewUser}`;
  }
  const res = await axiosFluxId(`api/beam-studio/announcements?${query}`);
  if (!res?.data) return;
  const { announcement } = res.data;
  if (announcement) {
    dialogCaller.showAnnouncementDialog(announcement);
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
