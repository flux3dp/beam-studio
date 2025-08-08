import React, { useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import alertConstants from '@core/app/constants/alert-constants';
import deviceConstants from '@core/app/constants/device-constants';
import ConnectionTypeIcons from '@core/app/icons/connection-type/ConnectionTypeIcons';
import TopBarController from '@core/app/views/beambox/TopBar/contexts/TopBarController';
import discover, { SEND_DEVICES_INTERVAL } from '@core/helpers/api/discover';
import fileExportHelper from '@core/helpers/file-export-helper';
import i18n from '@core/helpers/i18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import styles from './DeviceSelector.module.scss';

interface Props {
  onClose: () => void;
  onSelect: (device: IDeviceInfo | null) => void;
}

const DeviceSelector = ({ onClose, onSelect }: Props): React.JSX.Element => {
  const [deviceList, setDeviceList] = useState<IDeviceInfo[]>([]);
  const selectedDevice = TopBarController.getSelectedDevice();
  const selectedKey = selectedDevice?.serial;
  const discoverer = useMemo(
    () =>
      discover('device-selector', (discoverdDevices) => {
        const filteredDevices = discoverdDevices.filter((device) => device.serial !== 'XXXXXXXXXX');

        filteredDevices.sort((deviceA, deviceB) => {
          if (deviceA.serial === selectedKey && deviceB.serial !== selectedKey) {
            return -1;
          }

          if (deviceA.serial !== selectedKey && deviceB.serial === selectedKey) {
            return 1;
          }

          return deviceA.name.localeCompare(deviceB.name);
        });
        setDeviceList(filteredDevices);
      }),
    [selectedKey],
  );

  useEffect(
    () => () => {
      discoverer.removeListener('device-selector');
    },
    [discoverer],
  );

  const status = i18n.lang.machine_status;
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (deviceList.length === 0) {
      timeout.current = setTimeout(() => {
        alertCaller.popUp({
          buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
          buttonType: alertConstants.CUSTOM_CANCEL,
          callbacks: async () => {
            onSelect(null);
            onClose();

            const res = await fileExportHelper.toggleUnsavedChangedDialog();

            if (res) {
              window.location.hash = '#/initialize/connect/select-machine-model';
            }
          },
          caption: i18n.lang.alert.oops,
          message: i18n.lang.device_selection.no_device,
          onCancel: () => {
            onSelect(null);
            onClose();
          },
        });
      }, SEND_DEVICES_INTERVAL * 3);
    } else {
      clearTimeout(timeout.current);
    }

    return () => clearTimeout(timeout.current);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [deviceList.length]);

  const list =
    deviceList.length > 0 ? (
      deviceList.map((device: IDeviceInfo) => {
        const statusText = status[device.st_id as keyof typeof status] || status.UNKNOWN;
        const statusColor =
          deviceConstants.statusColor[device.st_id as keyof typeof deviceConstants.statusColor] || 'grey';
        const connectionType = ['10.55.0.1', '10.55.0.17'].includes(device.ipaddr) ? 'USB' : 'Wifi';
        const Icon = ConnectionTypeIcons[connectionType];
        let progress = '';

        if (device.st_id === 16 && typeof device.st_prog === 'number') {
          progress = `${(device.st_prog * 100).toFixed(1)}%`;
        }

        return (
          <li
            className={classNames({ [styles.selected]: selectedKey === device.serial })}
            data-testid={device.serial}
            key={device.uuid}
            onClick={() => {
              onSelect(device);
              onClose();
            }}
          >
            <label className={styles.name}>{device.name}</label>
            <label className={classNames(styles.status, styles[statusColor])}>
              {statusText} {progress}
            </label>
            <label className={styles['connection-type']}>
              <Icon />
            </label>
          </li>
        );
      })
    ) : (
      <Spin className={styles.spinner} indicator={<LoadingOutlined className={styles.icon} spin />} />
    );

  return (
    <Modal
      centered
      closable={false}
      footer={null}
      onCancel={() => {
        onSelect(deviceList.some((device) => device.serial === selectedKey) ? selectedDevice : null);
        onClose();
      }}
      open
      title={i18n.lang.topbar.select_machine}
      width={415}
    >
      <div className={styles['device-list']}>
        <ul>{list}</ul>
      </div>
    </Modal>
  );
};

export default DeviceSelector;
