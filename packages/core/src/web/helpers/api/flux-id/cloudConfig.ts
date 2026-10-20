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
  /** the default lens profile, kept in the format older versions read */
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

type UpdateItem = { [K in ConfigKey]: { data: CloudConfig[K]; key: K } }[ConfigKey];

/** Uploads several keys of one machine after a single confirmation; resolves whether every key was uploaded. */
export const updateCloudConfigs = async (
  {
    hash,
    items,
    model,
    serialNumber,
  }: Omit<BasicData<ConfigKey>, 'key'> & { items: UpdateItem[]; model?: WorkAreaModel },
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
        const errors: string[] = [];

        for (const { data, key } of items) {
          const { errorMsg, success } = await postCloudConfig({ data, hash, key, model, serialNumber } as UpdateData<
            typeof key
          >);

          if (!success) errors.push(errorMsg);
        }

        showUpdateResult({ errorMsg: errors.filter(Boolean).join('\n'), success: errors.length === 0 });
        resolve(errors.length === 0);
      },
    });
  });
};
