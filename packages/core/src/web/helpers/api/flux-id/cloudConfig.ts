import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';
import type { Field, GalvoParameters, RedDot } from '@core/interfaces/Promark';

import type { ResponseWithError } from './base';
import { axiosFluxId, formatErrorMessage, getCurrentUser } from './base';

type CloudConfig = {
  promarkLens: { field: Field; galvoParameters: GalvoParameters; redDot: RedDot };
};
export type ConfigKey = keyof CloudConfig;

type BasicData<T extends ConfigKey> = { hash?: string; key: T; serialNumber: string };
type Options = Partial<{ askUser: boolean; checkHash: boolean; checkLogin: boolean }>;

export const readCloudConfigApi = async <T extends ConfigKey>(data: BasicData<T>): Promise<CloudConfig[T] | null> => {
  const response = (await axiosFluxId.post(
    '/machine/config/read',
    { hashed_serial_number: data.hash, key: data.key, serial_number: data.serialNumber },
    { withCredentials: true },
  )) as ResponseWithError;

  if (response.error || response.status !== 200 || response.data?.status !== 'ok') {
    return null;
  }

  return response.data?.data ?? null;
};

export const readCloudConfig = async <T extends ConfigKey>(
  data: BasicData<T>,
  onSync?: (config: CloudConfig[T]) => void,
  { askUser = true, checkHash = true, checkLogin = false }: Options = {},
): Promise<CloudConfig[T] | null> => {
  if (checkHash && !data.hash) {
    return null;
  }

  if (checkLogin) {
    const user = getCurrentUser();

    if (!user) return null;
  }

  const config = await readCloudConfigApi(data);

  if (config && askUser) {
    await new Promise<void>((resolve) => {
      alertCaller.popUp({
        buttonType: alertConstants.YES_NO,
        message: i18n.lang.cloud_sync.import_config,
        onNo: resolve,
        onYes: () => {
          onSync?.(config);
          resolve();
        },
      });
    });
  }

  return config;
};

export const updateCloudConfigApi = async <T extends ConfigKey>(
  data: BasicData<T> & { data: CloudConfig[T]; model?: WorkAreaModel },
): Promise<void> => {
  const response = (await axiosFluxId.post(
    '/machine/config/update',
    {
      data,
      hashed_serial_number: data.hash,
      key: data.key,
      model: data.model,
      serial_number: data.serialNumber,
    },
    { withCredentials: true },
  )) as ResponseWithError;

  const success = !response.error && response.status === 200 && response.data?.status === 'ok';

  if (success) {
    MessageCaller.openMessage({
      content: i18n.lang.cloud_sync.sync_success,
      level: MessageLevel.SUCCESS,
    });
  } else {
    const errorMsg = formatErrorMessage(response.error) ?? '';

    alertCaller.popUpError({ message: `${i18n.lang.cloud_sync.sync_failed}\n${errorMsg}` });
  }
};

export const updateCloudConfig = async <T extends ConfigKey>(
  data: BasicData<T> & { data: CloudConfig[T]; model?: WorkAreaModel },
  { checkHash = true, checkLogin = true }: Options = {},
): Promise<void> => {
  if (checkHash && !data.hash) {
    return;
  }

  if (checkLogin) {
    const user = getCurrentUser();

    if (!user) return;
  }

  await new Promise<void>((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      message: i18n.lang.cloud_sync.sync_config,
      onNo: resolve,
      onYes: async () => {
        await updateCloudConfigApi(data);
        resolve();
      },
    });
  });
};
