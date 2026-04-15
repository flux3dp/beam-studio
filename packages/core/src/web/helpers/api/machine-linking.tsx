import { useCallback, useState } from 'react';

import { Button, Checkbox, DatePicker, Form, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import dialogCaller from '@core/app/actions/dialog-caller';
import progressCaller from '@core/app/actions/progress-caller';
import alertConstants from '@core/app/constants/alert-constants';
import deviceMaster from '@core/helpers/device-master';
import i18n from '@core/helpers/i18n';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import storage from '@core/implementations/storage';
import type { IDeviceInfo, IDeviceInfoFlux } from '@core/interfaces/IDevice';

import type { ResponseWithError } from './flux-id';
import { axiosFluxId, getCurrentUser, getDefaultHeader, getInfo } from './flux-id';
import styles from './machine-linking.module.scss';

/** send initial data as ACK from machine to complete the linking process */
const onLinked = async (secret: string): Promise<void> => {
  const lang = i18n.lang.machine_linking;
  let deviceDetailInfo: IDeviceInfoFlux;

  try {
    deviceDetailInfo = await deviceMaster.getDeviceInfoFlux();
  } catch (_) {
    // ghost (current host) is too old, use hardcoded empty info
    deviceDetailInfo = { info: '{}', signature: 3938 };
  }

  try {
    const response = await axiosFluxId.post('/machine/linking/update-info', { ...deviceDetailInfo, secret });

    if (response.data.status === 'ok') {
      alertCaller.popUp({ caption: lang.link_machine, message: lang.link_success });

      return;
    }
  } catch (error) {
    console.error('Error updating linked machine info:', error);
  }
  await writeMachineSecret(null);
  alertCaller.popUpError({ message: lang.link_failed });
};

const getLinkToken = async (deviceInfo: IDeviceInfo): Promise<null | string> => {
  const lang = i18n.lang.machine_linking;

  try {
    const response = await axiosFluxId.post(
      '/machine/linking/token',
      { serial: deviceInfo.serial },
      { headers: getDefaultHeader(), withCredentials: true },
    );
    const responseData = response.data;

    if (responseData.token) {
      return responseData.token;
    } else if (responseData.user_email) {
      const secret = responseData.secret;
      const unlink =
        !responseData.is_same_user &&
        (await new Promise<boolean>((resolve) => {
          alertCaller.popUp({
            buttonLabels: [lang.link_to_my_flux_id, lang.use_without_linking],
            callbacks: [() => resolve(true), () => resolve(false)],
            caption: lang.link_failed,
            message: lang.link_failed_already_linked,
          });
        }));

      if (unlink) {
        await writeMachineSecret(null);
        await axiosFluxId.post('/machine/linking/unlink', { secret });

        return getLinkToken(deviceInfo);
      } else {
        const res = await writeMachineSecret(secret);

        if (res && responseData.partially) {
          onLinked(secret);
        } else {
          alertCaller.popUp({ caption: lang.link_machine, message: lang.link_success });
        }
      }
    } else {
      alertCaller.popUpError({
        caption: lang.link_failed,
        message: responseData.info,
      });
    }
  } catch (error) {
    console.error('Error getting link token:', error);
  }

  return null;
};

const writeMachineSecret = async (secret: null | string): Promise<boolean> => {
  const lang = i18n.lang.machine_linking;

  try {
    await deviceMaster.setDeviceSetting('machine_secret', secret ?? 'delete');

    return true;
  } catch (error) {
    console.error('Error writing machine secret:', error);
    alertCaller.popUpError({
      caption: lang.link_failed,
      message: lang.link_failed_cannot_set_secret,
    });

    return false;
  }
};

const linkMachine = async (deviceInfo: IDeviceInfo): Promise<void> => {
  const lang = i18n.lang.machine_linking;
  const modalId = 'machine-linking';

  try {
    progressCaller.openNonstopProgress({
      canCancel: true,
      id: modalId,
      message: lang.process_linking,
    });

    const token = await getLinkToken(deviceInfo);

    if (!token) return;

    try {
      const response = (await axiosFluxId.post(
        '/machine/linking/link',
        { token },
        { headers: getDefaultHeader(), withCredentials: true },
      )) as ResponseWithError;
      const machineSecret = response.data?.secret;
      const errorReason = response.data?.info ?? response.error?.message;

      if (machineSecret) {
        const res = await writeMachineSecret(machineSecret);

        if (res) {
          await onLinked(machineSecret);
        }
      } else {
        alertCaller.popUpError({
          caption: lang.link_failed,
          message: errorReason,
        });
      }
    } catch (error) {
      console.error('Error linking machine:', error);
      alertCaller.popUpError({
        caption: lang.link_failed,
        message: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    }
  } finally {
    progressCaller.popById(modalId);
  }
};

const calculateAge = (birthday = getCurrentUser()?.info?.birthday): null | number => {
  try {
    if (!birthday) return null;

    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    if (
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch (_) {
    return null;
  }
};

// eslint-disable-next-line reactRefresh/only-export-components
const BirthdayModal = ({ onClose, resolve }: { onClose: () => void; resolve: (age: null | number) => void }) => {
  const { alert: tAlert, machine_linking: t } = useI18n();
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onCancel = useCallback(() => {
    onClose();
    resolve(null);
  }, [onClose, resolve]);

  const saveBirthday = useCallback(
    async (values: { birthday: Dayjs }) => {
      setIsSubmitting(true);
      try {
        await axiosFluxId.post(
          '/user/info',
          { birthday: values.birthday.format('YYYY-MM-DD') },
          { headers: getDefaultHeader(), withCredentials: true },
        );
      } catch (e) {
        console.error(e);
      } finally {
        await getInfo();
        onClose();
        resolve(calculateAge());
      }
    },
    [onClose, resolve],
  );

  return (
    <Modal centered footer={null} onCancel={onCancel} open title={t.input_birthday_to_link}>
      <Form onFinish={saveBirthday}>
        <Form.Item help={t.input_birthday_to_link_note} name="birthday" rules={[{ required: true }]}>
          <DatePicker placeholder="" />
        </Form.Item>
        <Checkbox checked={checked} onClick={() => setChecked(!checked)}>
          {t.i_have_read}
          <span className={styles.link} onClick={() => browser.open(t.privacy_policy_link)}>
            {t.privacy_policy}
          </span>
        </Checkbox>
        <div className={styles.footer}>
          <Button onClick={onCancel}>{tAlert.cancel}</Button>
          <Button disabled={!checked} htmlType="submit" loading={isSubmitting} type="primary">
            {t.continue}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

const getAgeBeforeLinking = async () => {
  const dialogId = 'birthay-modal';

  if (dialogCaller.isIdExist(dialogId)) return null;

  const onClose = () => dialogCaller.popDialogById(dialogId);

  return new Promise<null | number>((resolve) =>
    dialogCaller.addDialogComponent(dialogId, <BirthdayModal onClose={onClose} resolve={resolve} />),
  );
};

export const tryMachineLinking = async (deviceInfo: IDeviceInfo): Promise<void> => {
  const user = getCurrentUser();

  if (!user) return;

  const ageRequirement = 13;
  let userAge = calculateAge();

  if (userAge !== null && userAge < ageRequirement) return;

  const skippedSerial = storage.get('skip_machine_linking') || [];

  if (skippedSerial.includes(deviceInfo.serial)) return;

  try {
    const machineSecret = await deviceMaster.getDeviceSetting('machine_secret');

    if (machineSecret.value) return;
  } catch (_) {
    // machine_secret not supported, probably firmware too old
    return;
  }

  const lang = i18n.lang.machine_linking;

  alertCaller.popUp({
    buttonType: alertConstants.YES_NO,
    caption: lang.link_machine,
    checkbox: {
      callbacks: () => storage.set('skip_machine_linking', [...skippedSerial, deviceInfo.serial]),
      text: i18n.lang.alert.dont_show_again,
    },
    id: 'device-link',
    message: sprintf(lang.link_machine_to_account, { name: deviceInfo.name }),
    onYes: async () => {
      if (userAge === null) {
        userAge = await getAgeBeforeLinking();

        if (userAge === null || userAge < ageRequirement) {
          alertCaller.popUpError({ caption: lang.link_failed_under_age, message: lang.link_failed });

          return;
        }
      }

      await linkMachine(deviceInfo);
    },
  });
};
