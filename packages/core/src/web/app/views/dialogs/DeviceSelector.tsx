import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Modal, Spin } from 'antd';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import ConnectionTypeIcons from 'app/icons/connection-type/ConnectionTypeIcons';
import deviceConstants from 'app/constants/device-constants';
import discover, { SEND_DEVICES_INTERVAL } from 'helpers/api/discover';
import fileExportHelper from 'helpers/file-export-helper';
import i18n from 'helpers/i18n';
import TopBarController from 'app/views/beambox/TopBar/contexts/TopBarController';
import { IDeviceInfo } from 'interfaces/IDevice';

import styles from './DeviceSelector.module.scss';

interface Props {
  onSelect: (device: IDeviceInfo) => void;
  onClose: () => void;
}

const DeviceSelector = ({ onSelect, onClose }: Props): JSX.Element => {
  const [deviceList, setDeviceList] = useState([]);
  const selectedDevice = TopBarController.getSelectedDevice();
  const selectedKey = selectedDevice?.serial;
  const discoverer = useMemo(
    () =>
      discover('device-selector', (discoverdDevices) => {
        const filteredDevices = discoverdDevices.filter((device) => device.serial !== 'XXXXXXXXXX');
        filteredDevices.sort((deviceA, deviceB) => {
          if (deviceA.serial === selectedKey && deviceB.serial !== selectedKey) return -1;
          if (deviceA.serial !== selectedKey && deviceB.serial === selectedKey) return 1;
          return deviceA.name.localeCompare(deviceB.name);
        });
        setDeviceList(filteredDevices);
      }),
    [selectedKey]
  );
  useEffect(
    () => () => {
      discoverer.removeListener('device-selector');
    },
    [discoverer]
  );

  const status = i18n.lang.machine_status;
  const timeout = useRef(null);
  useEffect(() => {
    if (deviceList.length === 0) {
      timeout.current = setTimeout(() => {
        Alert.popUp({
          caption: i18n.lang.alert.oops,
          message: i18n.lang.device_selection.no_beambox,
          buttonType: AlertConstants.CUSTOM_CANCEL,
          buttonLabels: [i18n.lang.topbar.menu.add_new_machine],
          onCancel: () => {
            onSelect(null);
            onClose();
          },
          callbacks: async () => {
            onSelect(null);
            onClose();
            const res = await fileExportHelper.toggleUnsavedChangedDialog();
            if (res) window.location.hash = '#initialize/connect/select-machine-model';
          },
        });
      }, SEND_DEVICES_INTERVAL * 3);
    } else {
      clearTimeout(timeout.current);
    }
    return () => clearTimeout(timeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceList.length]);
  const list =
    deviceList.length > 0 ? (
      deviceList.map((device: IDeviceInfo) => {
        const statusText = status[device.st_id] || status.UNKNOWN;
        const statusColor = deviceConstants.statusColor[device.st_id] || 'grey';
        const connectionType = ['10.55.0.17', '10.55.0.1'].includes(device.ipaddr) ? 'USB' : 'Wifi';
        const Icon = ConnectionTypeIcons[connectionType];
        let progress = '';
        if (device.st_id === 16 && typeof device.st_prog === 'number') {
          progress = `${(device.st_prog * 100).toFixed(1)}%`;
        }

        return (
          <li
            className={classNames({ [styles.selected]: selectedKey === device.serial })}
            key={device.uuid}
            onClick={() => {
              onSelect(device);
              onClose();
            }}
            data-testid={device.serial}
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
      <Spin
        className={styles.spinner}
        indicator={<LoadingOutlined className={styles.icon} spin />}
      />
    );

  return (
    <Modal
      open
      closable={false}
      centered
      onCancel={() => {
        onSelect(
          deviceList.some((device) => device.serial === selectedKey) ? selectedDevice : null
        );
        onClose();
      }}
      width={415}
      footer={null}
      title={i18n.lang.topbar.select_machine}
    >
      <div className={styles['device-list']}>
        <ul>{list}</ul>
      </div>
    </Modal>
  );
};

export default DeviceSelector;
