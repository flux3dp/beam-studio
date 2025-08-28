import React from 'react';

import type { InputRef } from 'antd';
import { Button, Form, Input, Modal } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { discoverManager } from '@core/helpers/api/discover';
import i18n from '@core/helpers/i18n';
import isWeb from '@core/helpers/is-web';
import browser from '@core/implementations/browser';
import network from '@core/implementations/network';
import os from '@core/implementations/os';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

let LANG = i18n.lang.beambox.network_testing_panel;
const TEST_TIME = 30000;

interface Props {
  ip: string;
  onClose: () => void;
}

// TODO: refactor to functional component
class NetworkTestingPanel extends React.Component<Props> {
  private discoveredDevices: IDeviceInfo[];

  private unregister: (() => void) | null = null;

  private localIps: string[];

  private textInputRef: React.RefObject<InputRef>;

  constructor(props: Props) {
    super(props);
    LANG = i18n.lang.beambox.network_testing_panel;

    const localIps: string[] = [];
    const ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach((ifname) => {
      let alias = 0;

      ifaces[ifname].forEach((iface) => {
        if (iface.family !== 'IPv4' || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (alias >= 1) {
          // this single interface has multiple ipv4 addresses
          console.log(`${ifname}:${alias}`, iface.address);
        } else {
          // this interface has only one ipv4 adress
          console.log(ifname, iface.address);
        }

        alias += 1;
        localIps.push(iface.address);
      });
    });
    this.discoveredDevices = [];
    this.unregister = discoverManager.register('network-testing-panel', (devices) => {
      this.discoveredDevices = devices;
    });
    this.localIps = localIps;
    this.textInputRef = React.createRef();
  }

  componentWillUnmount(): void {
    this.unregister?.();
  }

  onStart = async (): Promise<void> => {
    const ip = this.getIPValue();

    if (!ip) {
      Alert.popUp({
        message: LANG.empty_ip,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });

      return;
    }

    if (ip.trim().startsWith('169.254')) {
      Alert.popUp({
        message: LANG.ip_startswith_169,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    }

    discoverManager.poke(ip);
    Progress.openSteppingProgress({
      caption: LANG.network_testing,
      id: 'network-testing',
      message: LANG.testing,
    });

    const { avgRRT, err, quality, reason, successRate } = await network.networkTest(ip, TEST_TIME, (percentage) => {
      Progress.update('network-testing', {
        percentage,
      });
    });

    Progress.popById('network-testing');

    if (err === 'CREATE_SESSION_FAILED') {
      let message = `${LANG.fail_to_start_network_test}\n${reason}`;

      if (window.os === 'Linux') {
        message += `\n${LANG.linux_permission_hint}`;
      }

      Alert.popUp({
        message,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } else if (err === 'INVALID_IP') {
      Alert.popUp({
        message: `${LANG.invalid_ip}: ${ip}`,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    } else {
      this.handleResult(successRate, avgRRT, quality);
    }
  };

  handleResult(successRate: number, avgRRT: number, quality: number): void {
    const ip = this.getIPValue();
    const { localIps } = this;

    console.log(`success rate: ${successRate}`);
    console.log(`average rrt of success: ${Math.round(100 * avgRRT) / 100} ms`);

    if (successRate > 0) {
      let message = `${LANG.connection_quality} : ${quality}\n${LANG.average_response} : ${
        Math.round(100 * avgRRT) / 100
      } ms`;
      let children = null;

      if (quality < 70 || avgRRT > 100) {
        message = `${LANG.network_unhealthy}\n${message}`;
      } else if (!this.discoveredDevices || !this.discoveredDevices.find((d) => d.ipaddr === ip)) {
        message = `${LANG.device_not_on_list}\n${message}`;
      } else {
        children = (
          <div className="hint-container network-testing">
            <div className="hint" onClick={() => browser.open(LANG.link_device_often_on_list)}>
              {LANG.hint_device_often_on_list}
            </div>
            <div className="hint" onClick={() => browser.open(LANG.link_connect_failed_when_sending_job)}>
              {LANG.hint_connect_failed_when_sending_job}
            </div>
            <div className="hint" onClick={() => browser.open(LANG.link_connect_camera_timeout)}>
              {LANG.hint_connect_camera_timeout}
            </div>
          </div>
        );
      }

      Alert.popUp({
        caption: LANG.test_completed,
        children,
        message,
        type: AlertConstants.SHOW_INFO,
      });
    } else {
      let match = false;
      const targetIpFirstThree = ip.match(/.*\./)[0];

      localIps.forEach((localIP) => {
        const localFirstThree = localIP.match(/.*\./)[0];

        if (targetIpFirstThree === localFirstThree) {
          match = true;
        }
      });

      if (match) {
        Alert.popUp({
          caption: LANG.test_completed,
          id: 'network_test_result',
          message: `${LANG.cannot_connect_1}`,
        });
      } else {
        Alert.popUp({
          caption: LANG.test_completed,
          id: 'network_test_result',
          message: `${LANG.cannot_connect_2}`,
        });
      }
    }
  }

  getIPValue = (): string => {
    const { value } = this.textInputRef.current.input;

    return value.replace(' ', '');
  };

  onInputKeydown = (e: React.KeyboardEvent): void => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      this.onStart();
    }
  };

  close(): void {
    const { onClose } = this.props;

    onClose();
  }

  renderLocalIP(): React.JSX.Element {
    const { localIps } = this;

    if (!localIps.length && isWeb()) {
      return null;
    }

    return <Form.Item label={LANG.local_ip}>{localIps.join(', ')}</Form.Item>;
  }

  render(): React.JSX.Element {
    const { ip, onClose } = this.props;
    const show = true;

    const renderModalFooter = () => [
      <Button onClick={onClose}>{LANG.end}</Button>,
      <Button onClick={this.onStart} type="primary">
        {LANG.start}
      </Button>,
    ];

    return (
      <Modal centered footer={renderModalFooter()} onCancel={onClose} open={show} title={LANG.network_testing}>
        <Form>
          {this.renderLocalIP()}
          <Form.Item label={LANG.insert_ip}>
            <Input defaultValue={ip || ''} onKeyDown={this.onInputKeydown} ref={this.textInputRef} />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default NetworkTestingPanel;
