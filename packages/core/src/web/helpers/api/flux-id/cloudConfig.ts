import alertCaller from '@core/app/actions/alert-caller';
import MessageCaller, { MessageLevel } from '@core/app/actions/message-caller';
import alertConstants from '@core/app/constants/alert-constants';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import i18n from '@core/helpers/i18n';
import type {
  Field,
  GalvoParameters,
  LensProfile,
  LensProfileKey,
  PromarkInfo,
  RedDot,
} from '@core/interfaces/Promark';

import type { ResponseWithError } from './base';
import { axiosFluxId, formatErrorMessage, getCurrentUser } from './base';

type CloudConfig = {
  promarkLaserSource: PromarkInfo;
  /** written only by versions before lens profiles; read by newer ones only to upgrade */
  promarkLens: { field: Field; galvoParameters: GalvoParameters; redDot: RedDot };
  promarkLensProfiles: { defaultKey?: LensProfileKey; profiles: LensProfile[] };
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

type UpdateData<T extends ConfigKey> = BasicData<T> & { data: CloudConfig[T]; model?: WorkAreaModel };

const postCloudConfig = async <T extends ConfigKey>(
  data: UpdateData<T>,
): Promise<{ errorMsg: string; success: boolean }> => {
  const response = (await axiosFluxId.post(
    '/machine/config/update',
    {
      data: data.data,
      hashed_serial_number: data.hash,
      key: data.key,
      model: data.model,
      serial_number: data.serialNumber,
    },
    { withCredentials: true },
  )) as ResponseWithError;

  const success = !response.error && response.status === 200 && response.data?.status === 'ok';

  return { errorMsg: success ? '' : (formatErrorMessage(response.error) ?? ''), success };
};

const showUpdateResult = ({ errorMsg, success }: { errorMsg: string; success: boolean }): void => {
  if (success) {
    MessageCaller.openMessage({
      content: i18n.lang.cloud_sync.sync_success,
      level: MessageLevel.SUCCESS,
    });
  } else {
    alertCaller.popUpError({ message: `${i18n.lang.cloud_sync.sync_failed}\n${errorMsg}` });
  }
};

export const updateCloudConfigApi = async <T extends ConfigKey>(data: UpdateData<T>): Promise<void> => {
  showUpdateResult(await postCloudConfig(data));
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

export type CloudConfigs = Partial<CloudConfig>;

/**
 * Reads several keys of one machine in one request, without asking; resolves the saved ones, or null
 * when the request failed. Unlike a single `promarkLens` read, the server returns only what is stored.
 */
export const readCloudConfigs = async (
  { hash, keys, serialNumber }: Omit<BasicData<ConfigKey>, 'key'> & { keys: ConfigKey[] },
  { checkHash = true }: Options = {},
): Promise<CloudConfigs | null> => {
  if (checkHash && !hash) return null;

  const response = (await axiosFluxId.post(
    '/machine/config/read',
    { hashed_serial_number: hash, keys, serial_number: serialNumber },
    { withCredentials: true },
  )) as ResponseWithError;

  if (response.error || response.status !== 200 || response.data?.status !== 'ok') {
    return null;
  }

  return (response.data?.data as CloudConfigs) ?? {};
};

/** Uploads several keys of one machine in one request after a single confirmation; resolves whether it succeeded. */
export const updateCloudConfigs = async (
  {
    configs,
    hash,
    model,
    serialNumber,
  }: Omit<BasicData<ConfigKey>, 'key'> & { configs: CloudConfigs; model?: WorkAreaModel },
  { checkHash = true, checkLogin = true }: Options = {},
): Promise<boolean> => {
  if (checkHash && !hash) return false;

  if (checkLogin && !getCurrentUser()) return false;

  return new Promise<boolean>((resolve) => {
    alertCaller.popUp({
      buttonType: alertConstants.YES_NO,
      message: i18n.lang.cloud_sync.sync_config,
      onNo: () => resolve(false),
      onYes: async () => {
        const response = (await axiosFluxId.post(
          '/machine/config/update',
          { configs, hashed_serial_number: hash, model, serial_number: serialNumber },
          { withCredentials: true },
        )) as ResponseWithError;
        const success = !response.error && response.status === 200 && response.data?.status === 'ok';

        showUpdateResult({ errorMsg: success ? '' : (formatErrorMessage(response.error) ?? ''), success });
        resolve(success);
      },
    });
  });
};
