import storage from 'implementations/storage';
import { axiosFluxId, fluxIDEvents, getCurrentUser } from 'helpers/api/flux-id';

const recordActivity = async (): Promise<void> => {
  const user = getCurrentUser();
  if (!user) return;
  const date = new Date().toISOString().slice(0, 10);
  if (storage.get('last-record-activity') === date) return;
  const { data } = await axiosFluxId.post(
    '/user/activity/beam-studio',
    { version: window.FLUX.version },
    { withCredentials: true }
  );
  if (data.status === 'ok') storage.set('last-record-activity', date);
};

fluxIDEvents.addListener('update-user', recordActivity);

export default { recordActivity };
