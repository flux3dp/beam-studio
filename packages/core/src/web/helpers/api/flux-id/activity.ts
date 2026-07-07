import deviceMaster from '@core/helpers/device-master';
import storage from '@core/implementations/storage';

import type { ResponseWithError } from './base';
import { axiosFluxId, handleErrorMessage, updateUser } from './base';

export const submitRating = async (ratingData: { app: string; score: number; user?: string; version: string }) => {
  const response = (await axiosFluxId.post('/user_rating/submit_rating', ratingData, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.status === 200) {
    const { data } = response;

    if (data.status === 'ok') {
      updateUser({ email: data.email });
    }

    return data;
  }

  handleErrorMessage(response.error);

  return response;
};

export const getPreference = async (key = '', silent = false) => {
  const response = (await axiosFluxId.get(`software-preference/bxpref/${key}`, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.status === 200) {
    const { data } = response;

    return data;
  }

  if (!silent) {
    handleErrorMessage(response.error);
  }

  return response;
};

export const setPreference = async (value: { [key: string]: any }): Promise<boolean> => {
  const response = (await axiosFluxId.post('software-preference/bxpref', value, {
    withCredentials: true,
  })) as ResponseWithError;

  if (response.status === 200) {
    const { data } = response;

    if (data.status === 'ok') {
      return true;
    }
  }

  return false;
};

export const recordMachines = async (): Promise<void> => {
  let shouldRecord = true;

  try {
    const devices = deviceMaster.getAvailableDevices();
    const registeredMachines = storage.get('registered-devices', false) || [];
    const newMachines = devices
      .filter((device) => !registeredMachines.includes(device.serial) && device.model !== 'fpm1')
      .map((device) => device.serial);

    if (newMachines.length === 0) return;

    const response = (await axiosFluxId.post(
      '/machine/activity/beam-studio',
      { serials: newMachines },
      { withCredentials: true },
    )) as ResponseWithError;

    if (response.status === 200) {
      const { data } = response;

      if (data.status === 'ok') {
        storage.set('registered-devices', [...registeredMachines, ...newMachines]);
      } else if (data.info === 'IGNORED') {
        shouldRecord = false;
      }
    } else {
      shouldRecord = false;
    }
  } catch (error) {
    console.error('Error recording machines:', error);
    shouldRecord = false;
  } finally {
    if (shouldRecord) {
      setTimeout(recordMachines, 60000);
    }
  }
};
