import type { ReactNode } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { InputRef } from 'antd';
import { Button, Form, Input, Modal } from 'antd';

import alertCaller from '@core/app/actions/alert-caller';
import Progress from '@core/app/actions/progress-caller';
import { discoverManager } from '@core/helpers/api/discover';
import checkIPFormat from '@core/helpers/check-ip-format';
import { getOS } from '@core/helpers/getOS';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';
import network from '@core/implementations/network';
import os from '@core/implementations/os';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const TEST_TIME = 30000;

interface Props {
  ip: string;
  onClose: () => void;
}

const NetworkTestingPanel = ({ ip, onClose }: Props): ReactNode => {
  const [localIps, setLocalIps] = useState<string[]>([]);
  const discoveredDevicesRef = useRef<IDeviceInfo[]>([]);
  const textInputRef = useRef<InputRef>(null);
  const lang = useI18n().beambox.network_testing_panel;

  useEffect(() => {
    const localIps: string[] = [];
    const interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach((ifname) => {
      let alias = 0;

      interfaces[ifname].forEach((iface) => {
        if (iface.family !== 'IPv4' || iface.internal !== false) {
          return;
        }

        if (alias >= 1) {
          console.log(`${ifname}:${alias}`, iface.address);
        } else {
          console.log(ifname, iface.address);
        }

        alias += 1;
        localIps.push(iface.address);
      });
    });

    setLocalIps(localIps);

    const unregister = discoverManager.register('network-testing-panel', (devices) => {
      discoveredDevicesRef.current = devices;
    });

    return unregister;
  }, []);

  const getIPValue = useCallback((): string => {
    if (!textInputRef.current?.input) return '';

    const { value } = textInputRef.current!.input;

    return value.replace(' ', '');
  }, []);

  const handleResult = useCallback(
    (successRate: number, avgRRT: number, quality: number): void => {
      const ipValue = getIPValue();

      console.log(`success rate: ${successRate}`);
      console.log(`average rrt of success: ${Math.round(100 * avgRRT) / 100} ms`);

      if (successRate > 0) {
        let message = `${lang.connection_quality} : ${quality}\n${lang.average_response} : ${
          Math.round(100 * avgRRT) / 100
        } ms`;
        let children: ReactNode = undefined;

        if (quality < 70 || avgRRT > 100) {
          message = `${lang.network_unhealthy}\n${message}`;
        } else if (!discoveredDevicesRef.current || !discoveredDevicesRef.current.find((d) => d.ipaddr === ipValue)) {
          message = `${lang.device_not_on_list}\n${message}`;
        } else {
          children = (
            <div className="hint-container network-testing">
              <div className="hint" onClick={() => browser.open(lang.link_device_often_on_list)}>
                {lang.hint_device_often_on_list}
              </div>
              <div className="hint" onClick={() => browser.open(lang.link_connect_failed_when_sending_job)}>
                {lang.hint_connect_failed_when_sending_job}
              </div>
              <div className="hint" onClick={() => browser.open(lang.link_connect_camera_timeout)}>
                {lang.hint_connect_camera_timeout}
              </div>
            </div>
          );
        }

        alertCaller.popUp({ caption: lang.test_completed, children, message });
      } else {
        let match = false;
        const targetIpFirstThree = ipValue.match(/.*\./)![0];

        localIps.forEach((localIP) => {
          const localFirstThree = localIP.match(/.*\./)![0];

          if (targetIpFirstThree === localFirstThree) {
            match = true;
          }
        });

        alertCaller.popUp({
          caption: lang.test_completed,
          message: match ? lang.cannot_connect_1 : lang.cannot_connect_2,
        });
      }
    },
    [lang, localIps, getIPValue],
  );

  const onStart = useCallback(async (): Promise<void> => {
    const ipValue = getIPValue();

    if (!ipValue) {
      alertCaller.popUpError({ message: lang.empty_ip });

      return;
    }

    if (!checkIPFormat(ipValue)) {
      alertCaller.popUpError({ message: `${lang.invalid_ip}: ${ipValue}` });

      return;
    }

    discoverManager.poke(ipValue);
    Progress.openSteppingProgress({
      caption: lang.network_testing,
      id: 'network-testing',
      message: lang.testing,
    });

    const { avgRRT, err, quality, reason, successRate } = await network.networkTest(
      ipValue,
      TEST_TIME,
      (percentage) => {
        Progress.update('network-testing', {
          percentage,
        });
      },
    );

    Progress.popById('network-testing');

    if (err === 'CREATE_SESSION_FAILED') {
      let message = `${lang.fail_to_start_network_test}\n${reason}`;

      if (getOS() === 'Linux') {
        message += `\n${lang.linux_permission_hint}`;
      }

      alertCaller.popUpError({ message });
    } else {
      handleResult(successRate!, avgRRT!, quality!);
    }
  }, [getIPValue, handleResult, lang]);

  const onInputKeydown = useCallback(
    (e: React.KeyboardEvent): void => {
      e.stopPropagation();

      if (e.key === 'Enter') onStart();
    },
    [onStart],
  );

  return (
    <Modal
      centered
      footer={[
        <Button key="end" onClick={onClose}>
          {lang.end}
        </Button>,
        <Button key="start" onClick={onStart} type="primary">
          {lang.start}
        </Button>,
      ]}
      onCancel={onClose}
      open={true}
      title={lang.network_testing}
    >
      <Form>
        {localIps.length && <Form.Item label={lang.local_ip}>{localIps.join(', ')}</Form.Item>}
        <Form.Item label={lang.insert_ip}>
          <Input defaultValue={ip || ''} onKeyDown={onInputKeydown} ref={textInputRef} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NetworkTestingPanel;
