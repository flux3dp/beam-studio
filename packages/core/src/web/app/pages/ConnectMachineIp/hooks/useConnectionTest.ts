import { useEffect, useMemo, useRef, useState } from 'react';

import { sprintf } from 'sprintf-js';

import alertCaller from '@core/app/actions/alert-caller';
import { promarkModels } from '@core/app/actions/beambox/constant';
import menuDeviceActions from '@core/app/actions/beambox/menuDeviceActions';
import dialogCaller from '@core/app/actions/dialog-caller';
import { isTesting, TestState } from '@core/app/constants/connection-test';
import { discoverManager } from '@core/helpers/api/discover';
import { swiftrayClient } from '@core/helpers/api/swiftray-client';
import checkIPFormat from '@core/helpers/check-ip-format';
import checkRpiIp from '@core/helpers/check-rpi-ip';
import checkSoftwareForAdor from '@core/helpers/check-software';
import checkCamera from '@core/helpers/device/check-camera';
import deviceMaster from '@core/helpers/device-master';
import { getHomePage } from '@core/helpers/hashHelper';
import isWeb from '@core/helpers/is-web';
import useI18n from '@core/helpers/useI18n';
import versionChecker from '@core/helpers/version-checker';
import network from '@core/implementations/network';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import { MACHINE_CONNECTION_TIMEOUT } from '../constants';
import type { State } from '../state';
import { initialState } from '../state';
import { finishWithDevice } from '../utils/finishWithDevice';

export const useConnectionTest = (model: string, isUsb: boolean, ipValue: string, setIpValue: (ip: string) => void) => {
  const lang = useI18n();
  const [state, setState] = useState<State>(initialState);
  const countDown = useRef(0);
  const intervalId = useRef(0);
  const discoveredDevicesRef = useRef(Array.of<IDeviceInfo>());
  const isPromark = useMemo(() => promarkModels.has(model), [model]);
  const testingIps = isUsb ? ['10.55.0.1', '10.55.0.17'] : [ipValue];

  useEffect(() => {
    const unregister = discoverManager.register('connect-machine-ip', (devices) => {
      discoveredDevicesRef.current = devices;
    });

    return unregister;
  }, []);

  const updateTestState = (newState: Partial<State>) => setState((prev) => ({ ...prev, ...newState }));

  const validateIpFormat = () => {
    const isValid = testingIps.every((ip) => checkIPFormat(ip));

    if (!isValid) {
      updateTestState({ testState: TestState.IP_FORMAT_ERROR });
    }

    return isValid;
  };

  const testIpReachability = async () => {
    updateTestState({ testState: TestState.IP_TESTING });

    for (const [i, ip] of testingIps.entries()) {
      const { error, isExisting } = await network.checkIPExist(ip, 5);

      if (isExisting) {
        return ip;
      }

      console.error(`IP ${ip} is not reachable:`, error);

      if (error || i === testingIps.length - 1) {
        updateTestState({ testState: TestState.IP_UNREACHABLE });
      }
    }

    return null;
  };

  const setUpLocalStorageIp = (ip: string) => {
    if (isWeb()) {
      localStorage.setItem('host', ip);
      localStorage.setItem('port', '8000');
    }
  };

  const testConnection = async (
    predicate: (value: IDeviceInfo, index: number, obj: IDeviceInfo[]) => unknown = ({ ipaddr }) =>
      testingIps.includes(ipaddr),
  ) => {
    countDown.current = MACHINE_CONNECTION_TIMEOUT;

    setState({ countDownDisplay: countDown.current, device: null, testState: TestState.CONNECTION_TESTING });

    return new Promise<IDeviceInfo | null>((resolve) => {
      intervalId.current = setInterval(() => {
        if (countDown.current > 0) {
          const device = discoveredDevicesRef.current.find(predicate);

          if (device) {
            if (isWeb() && !versionChecker(device.version).meetRequirement('LATEST_GHOST_FOR_WEB')) {
              alertCaller.popUp({
                buttonLabels: [lang.update.download, lang.update.later],
                callbacks: [() => menuDeviceActions.UPDATE_FIRMWARE(device), () => {}],
                message: sprintf(lang.update.firmware.too_old_for_web, device.version),
                primaryButtonIndex: 0,
              });
            }

            setState((prev) => ({ ...prev, device }));
            clearInterval(intervalId.current);
            resolve(device);
          } else {
            countDown.current -= 1;
            setState((prev) => ({
              ...prev,
              countDownDisplay: countDown.current,
              testState: countDown.current > 0 ? TestState.CONNECTION_TESTING : TestState.CONNECTION_TEST_FAILED,
            }));

            if (countDown.current <= 0) {
              clearInterval(intervalId.current);
              resolve(null);
            }
          }
        } else {
          clearInterval(intervalId.current);
          resolve(null);
        }
      }, 1000) as unknown as number;
    });
  };

  const testCamera = async (device: IDeviceInfo) => {
    updateTestState({ testState: TestState.CAMERA_TESTING });

    const { success } = await checkCamera(device);

    if (success) {
      updateTestState({ testState: TestState.TEST_COMPLETED });

      return;
    }

    updateTestState({ testState: TestState.CAMERA_TEST_FAILED });
    alertCaller.popUp({
      caption: lang.initialize.connect_machine_ip.check_camera,
      message: isPromark ? lang.web_cam.no_device : lang.topbar.alerts.fail_to_connect_with_camera,
      messageIcon: 'warning',
    });
  };

  const checkSwiftrayConnection = () => {
    const { readyState } = swiftrayClient;

    updateTestState({ testState: TestState.IP_TESTING });

    if (readyState === WebSocket.OPEN) {
      return true;
    }

    if (readyState === WebSocket.CLOSED) {
      updateTestState({ testState: TestState.IP_UNREACHABLE });
      alertCaller.popUp({
        caption: lang.initialize.connect_machine_ip.check_swiftray_connection,
        message: lang.initialize.connect_machine_ip.alert.swiftray_connection_error,
        messageIcon: 'warning',
      });
    }

    return false;
  };

  const handleStartTestForPromark = async () => {
    if (!checkSwiftrayConnection()) {
      return;
    }

    const device = await testConnection(({ model }) => promarkModels.has(model));

    if (!device) {
      alertCaller.popUp({
        caption: lang.initialize.connect_machine_ip.check_connection,
        message: lang.message.unknown_device,
        messageIcon: 'warning',
      });

      return;
    }

    // for correctly select promark device serial
    const res = await deviceMaster.select(device);

    console.log('🚀 ~ useConnectionTest.ts:194 ~ handleStartTestForPromark ~ res:', res);

    await testCamera(device);
  };

  const handleStartTest = async () => {
    if (isPromark) {
      handleStartTestForPromark();

      return;
    }

    const { testState } = state;

    if (isTesting(testState)) {
      return;
    }

    if (!validateIpFormat()) {
      return;
    }

    const ip = await testIpReachability();

    if (!ip) {
      return;
    }

    setUpLocalStorageIp(ip);

    testingIps.forEach((testingIp) => discoverManager.poke(testingIp));

    const device = await testConnection();

    if (!device) {
      return;
    }

    if (!checkSoftwareForAdor(device)) {
      setIpValue('');
      setState((prev) => ({ ...prev, device: null, testState: TestState.NONE }));

      return;
    }

    await testCamera(device);
  };

  const onFinish = async () => {
    const { device } = state;

    if (!device) return;

    await finishWithDevice(device);

    if (isPromark) {
      window.location.hash = '#/initialize/connect/select-promark-laser-source';

      return;
    }

    dialogCaller.showLoadingWindow();
    window.location.hash = getHomePage();
    window.location.reload();
  };

  useEffect(() => {
    if (isUsb) {
      handleStartTest();
    } else {
      checkRpiIp().then((ip) => ip && setIpValue(ip));
    }

    return () => clearInterval(intervalId.current);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isUsb]);

  return { handleStartTest, isPromark, onFinish, state };
};
