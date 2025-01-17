import React, { useEffect, useState } from 'react';
import { filter, interval, map, mergeMap, Subscription, scan } from 'rxjs';
import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';

import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';

import styles from './UsbDeviceSelector.module.scss';

interface Props {
  initList: MediaDeviceInfo[];
  updateList?: () => Promise<MediaDeviceInfo[]>;
  onSelect: (device: MediaDeviceInfo) => void;
  onClose: () => void;
}

const UsbDeviceSelector = ({ initList, updateList, onSelect, onClose }: Props): JSX.Element => {
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
            return { index, devices };
          })
        )
        .pipe(
          scan<
            { index: number; devices: MediaDeviceInfo[] },
            { index: number; devices?: MediaDeviceInfo[] }
          >(
            (acc, { index, devices }) => {
              if (index <= acc.index) return { index: acc.index };
              return { index, devices };
            },
            { index: -1 }
          )
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
      open
      closable={false}
      centered
      onCancel={() => {
        onSelect(null);
        onClose();
      }}
      width={415}
      footer={null}
      title={lang.device_selection.select_usb_device}
    >
      <div className={styles['device-list']}>
        <ul>
          {list.length > 0 ? (
            list.map((device) => (
              <li
                key={`${device.deviceId}-${device.label}`}
                onClick={() => {
                  onSelect(device);
                  onClose();
                }}
                data-testid={device.deviceId}
              >
                <label className={styles.name}>{device.label}</label>
              </li>
            ))
          ) : (
            <Spin
              className={styles.spinner}
              indicator={<LoadingOutlined className={styles.icon} spin />}
            />
          )}
        </ul>
      </div>
    </Modal>
  );
};

export default UsbDeviceSelector;

export const selectUsbDevice = async (
  initList: MediaDeviceInfo[] = [],
  updateList?: () => Promise<MediaDeviceInfo[]>
): Promise<MediaDeviceInfo> => {
  if (isIdExist('USB_DEVICE_SELECTOR')) return null;
  return new Promise<MediaDeviceInfo>((resolve) => {
    addDialogComponent(
      'USB_DEVICE_SELECTOR',
      <UsbDeviceSelector
        initList={initList}
        updateList={updateList}
        onSelect={(device) => resolve(device)}
        onClose={() => popDialogById('USB_DEVICE_SELECTOR')}
      />
    );
  });
};
