import React, { useEffect, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import type { Subscription } from 'rxjs';
import { filter, interval, map, mergeMap, scan } from 'rxjs';

import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import useI18n from '@core/helpers/useI18n';

import styles from './UsbDeviceSelector.module.scss';

interface Props {
  initList: MediaDeviceInfo[];
  onClose: () => void;
  onSelect: (device: MediaDeviceInfo) => void;
  updateList?: () => Promise<MediaDeviceInfo[]>;
}

const UsbDeviceSelector = ({ initList, onClose, onSelect, updateList }: Props): React.JSX.Element => {
  const lang = useI18n();
  const [list, setList] = useState(initList);

  useEffect(() => {
    let subscription: Subscription;

    if (updateList) {
      subscription = interval(3000)
        .pipe(map(() => updateList()))
        .pipe(
          mergeMap(async (p, index) => {
            const devices = await p;

            return { devices, index };
          }),
        )
        .pipe(
          scan<{ devices: MediaDeviceInfo[]; index: number }, { devices?: MediaDeviceInfo[]; index: number }>(
            (acc, { devices, index }) => {
              if (index <= acc.index) {
                return { index: acc.index };
              }

              return { devices, index };
            },
            { index: -1 },
          ),
        )
        .pipe(filter(({ devices }) => devices !== undefined))
        .subscribe(({ devices }) => setList(devices));
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [updateList]);

  return (
    <Modal
      centered
      closable={false}
      footer={null}
      onCancel={() => {
        onSelect(null);
        onClose();
      }}
      open
      title={lang.device_selection.select_usb_device}
      width={415}
    >
      <div className={styles['device-list']}>
        <ul>
          {list.length > 0 ? (
            list.map((device) => (
              <li
                data-testid={device.deviceId}
                key={`${device.deviceId}-${device.label}`}
                onClick={() => {
                  onSelect(device);
                  onClose();
                }}
              >
                <label className={styles.name}>{device.label}</label>
              </li>
            ))
          ) : (
            <Spin className={styles.spinner} indicator={<LoadingOutlined className={styles.icon} spin />} />
          )}
        </ul>
      </div>
    </Modal>
  );
};

export default UsbDeviceSelector;

export const selectUsbDevice = async (
  initList: MediaDeviceInfo[] = [],
  updateList?: () => Promise<MediaDeviceInfo[]>,
): Promise<MediaDeviceInfo> => {
  if (isIdExist('USB_DEVICE_SELECTOR')) {
    return null;
  }

  return new Promise<MediaDeviceInfo>((resolve) => {
    addDialogComponent(
      'USB_DEVICE_SELECTOR',
      <UsbDeviceSelector
        initList={initList}
        onClose={() => popDialogById('USB_DEVICE_SELECTOR')}
        onSelect={(device) => resolve(device)}
        updateList={updateList}
      />,
    );
  });
};
