/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-shadow */
import classNames from 'classnames';
import React, { KeyboardEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { sprintf } from 'sprintf-js';

import alertCaller from 'app/actions/alert-caller';
import alertConfig from 'helpers/api/alert-config';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import checkCamera from 'helpers/device/check-camera';
import checkIPFormat from 'helpers/check-ip-format';
import checkRpiIp from 'helpers/check-rpi-ip';
import checkSoftwareForAdor from 'helpers/check-software';
import Discover from 'helpers/api/discover';
import dialogCaller from 'app/actions/dialog-caller';
import isWeb from 'helpers/is-web';
import menuDeviceActions from 'app/actions/beambox/menuDeviceActions';
import network from 'implementations/network';
import storage from 'implementations/storage';
import TestInfo from 'app/components/settings/connection/TestInfo';
import TestState, { isTesting } from 'app/constants/connection-test';
import useI18n from 'helpers/useI18n';
import versionChecker from 'helpers/version-checker';
import { adorModels, bb2Models, promarkModels } from 'app/actions/beambox/constant';
import { allWorkareas } from 'app/constants/workarea-constants';
import { IDeviceInfo } from 'interfaces/IDevice';

import { swiftrayClient } from 'helpers/api/swiftray-client';
import deviceMaster from 'helpers/device-master';
import styles from './index.module.scss';
import { initialState, State } from './state';
import Hint from './Hint';

const MACHINE_CONNECTION_TIMEOUT = 30;

// TODO: add test
const ConnectMachineIp = (): JSX.Element => {
  const lang = useI18n();
  const [ipValue, setIpValue] = useState('');
  const [state, setState] = useState<State>(initialState);
  const countDown = useRef(0);
  const intervalId = useRef(0);
  const discoveredDevicesRef = useRef(Array.of<IDeviceInfo>());

  const { isWired, isUsb, model } = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);

    return {
      isWired: urlParams.get('wired') === '1',
      isUsb: urlParams.get('usb') === '1',
      model: urlParams.get('model'),
    };
  }, []);

  const discoverer = useMemo(
    () =>
      Discover('connect-machine-ip', (devices) => {
        discoveredDevicesRef.current = devices;
      }),
    []
  );

  useEffect(() => () => discoverer.removeListener('connect-machine-ip'), [discoverer]);

  const [isAdor, isBb2, isPromark] = useMemo(
    () => [adorModels.has(model), bb2Models.has(model), promarkModels.has(model)],
    [model]
  );
  const testingIps = isUsb ? ['10.55.0.1', '10.55.0.17'] : [ipValue];
  const updateTestState = (newState: Partial<State>) =>
    setState((prev) => ({ ...prev, ...newState }));

  const validateIpFormat = () => {
    const isValid = testingIps.every((ip) => checkIPFormat(ip));
    if (!isValid) updateTestState({ testState: TestState.IP_FORMAT_ERROR });
    return isValid;
  };

  const testIpReachability = async () => {
    updateTestState({ testState: TestState.IP_TESTING });

    for (let i = 0; i < testingIps.length; i++) {
      const ip = testingIps[i];
      // eslint-disable-next-line no-await-in-loop
      const { error, isExisting } = await network.checkIPExist(ip, 3);

      if (isExisting) return ip;
      if (error) updateTestState({ testState: TestState.IP_UNREACHABLE });
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
      testingIps.includes(ipaddr)
  ) => {
    countDown.current = MACHINE_CONNECTION_TIMEOUT;

    setState({
      countDownDisplay: countDown.current,
      device: null,
      testState: TestState.CONNECTION_TESTING,
    });

    return new Promise<IDeviceInfo>((resolve) => {
      intervalId.current = setInterval(() => {
        if (countDown.current > 0) {
          const device = discoveredDevicesRef.current.find(predicate);

          if (device) {
            if (
              isWeb() &&
              !versionChecker(device.version).meetRequirement('LATEST_GHOST_FOR_WEB')
            ) {
              alertCaller.popUp({
                message: sprintf(lang.update.firmware.too_old_for_web, device.version),
                buttonLabels: [lang.update.download, lang.update.later],
                primaryButtonIndex: 0,
                callbacks: [() => menuDeviceActions.UPDATE_FIRMWARE(device), () => {}],
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
              testState:
                countDown.current > 0
                  ? TestState.CONNECTION_TESTING
                  : TestState.CONNECTION_TEST_FAILED,
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

    const res = await checkCamera(device);

    if (res) {
      updateTestState({ testState: TestState.TEST_COMPLETED });

      return;
    }

    updateTestState({ testState: TestState.CAMERA_TEST_FAILED });
    alertCaller.popUp({
      messageIcon: 'warning',
      caption: lang.initialize.connect_machine_ip.check_camera,
      message: isPromark ? lang.web_cam.no_device : lang.topbar.alerts.fail_to_connect_with_camera,
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
        messageIcon: 'warning',
        caption: lang.initialize.connect_machine_ip.check_swiftray_connection,
        message: lang.initialize.connect_machine_ip.alert.swiftray_connection_error,
      });
    }

    return false;
  };

  const handleStartTestForPromark = async () => {
    if (!checkSwiftrayConnection()) return;

    const device = await testConnection(({ model }) => promarkModels.has(model));
    if (!device) {
      alertCaller.popUp({
        messageIcon: 'warning',
        caption: lang.initialize.connect_machine_ip.check_connection,
        message: lang.message.unknown_device,
      });
      return;
    }

    // for correctly select promark device serial
    const res = await deviceMaster.select(device);
    console.log('🚀 ~ file: index.tsx:212 ~ handleStartTestForPromark ~ deviceMaster.select:', res);

    await testCamera(device);
  };

  const handleStartTest = async () => {
    if (isPromark) {
      handleStartTestForPromark();
      return;
    }

    const { testState } = state;
    if (isTesting(testState)) return;
    if (!validateIpFormat()) return;

    const ip = await testIpReachability();
    if (!ip) return;

    setUpLocalStorageIp(ip);

    testingIps.forEach((testingIp) => {
      discoverer.poke(testingIp);
      discoverer.pokeTcp(testingIp);
      discoverer.testTcp(testingIp);
    });

    const device = await testConnection();
    if (!device) return;

    if (!checkSoftwareForAdor(device)) {
      setIpValue('');
      setState((prev) => ({ ...prev, device: null, testState: TestState.NONE }));
      return;
    }

    await testCamera(device);
  };

  useEffect(() => {
    if (isUsb) {
      handleStartTest();
    } else {
      checkRpiIp().then((ip) => ip && setIpValue(ip));
    }

    return () => {
      clearInterval(intervalId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUsb]);

  const onFinish = async () => {
    const { device } = state;
    const deviceModel = allWorkareas.has(device.model) ? device.model : 'fbb1b';

    BeamboxPreference.write('model', deviceModel);
    BeamboxPreference.write('workarea', deviceModel);

    let pokeIPs = storage.get('poke-ip-addr')?.split(/[,;] ?/) || [];

    if (!pokeIPs.includes(device.ipaddr)) {
      if (pokeIPs.length > 19) {
        pokeIPs = pokeIPs.slice(pokeIPs.length - 19, pokeIPs.length);
      }

      pokeIPs.push(device.ipaddr);
      storage.set('poke-ip-addr', pokeIPs.join(','));
    }

    if (!storage.get('printer-is-ready')) {
      storage.set('new-user', true);
    }

    storage.set('printer-is-ready', true);
    storage.set('selected-device', device.uuid);

    if (adorModels.has(device.model)) {
      alertConfig.write('done-first-cali', true);
    } else if (promarkModels.has(device.model)) {
      alertConfig.write('done-first-cali', true);
      storage.set('last-promark-serial', device.serial);
      // select promark device to update promark settings
      await deviceMaster.select(device);
    } else if (device.model === 'fbm1') {
      alertConfig.write('done-first-cali', false);
    }

    // go to select-promark-laser-source for promark devices
    if (isPromark) {
      window.location.hash = '#initialize/connect/select-promark-laser-source';
      return;
    }

    dialogCaller.showLoadingWindow();

    window.location.hash = '#studio/beambox';
    window.location.reload();
  };

  const renderNextBtn = () => {
    const { testState } = state;
    let label = lang.initialize.next;
    let handleClick: () => void = handleStartTest;

    if ([TestState.CAMERA_TEST_FAILED, TestState.TEST_COMPLETED].includes(testState)) {
      if (!isPromark) {
        label = lang.initialize.connect_machine_ip.finish_setting;
      }

      handleClick = onFinish;
    } else if (!isTesting(testState) && testState !== TestState.NONE) {
      label = lang.initialize.retry;
    }

    return (
      <div
        className={classNames(styles.btn, styles.primary, {
          [styles.disabled]: isTesting(testState),
        })}
        onClick={handleClick}
      >
        {label}
      </div>
    );
  };

  const handleInputKeyDown: KeyboardEventHandler = ({ key }) => {
    if (key === 'Enter') {
      handleStartTest();
    }
  };

  const { testState, countDownDisplay, device } = state;

  const touchPanelSrc = useMemo(() => {
    if (isAdor) return 'core-img/init-panel/ador-ip.jpg';
    if (isBb2) return `core-img/init-panel/beambox-2-ip-${isWired ? 'wired' : 'wireless'}.png`;
    return `img/init-panel/network-panel-${isWired ? 'wired' : 'wireless'}.jpg`;
  }, [isAdor, isWired, isBb2]);

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {lang.initialize.back}
        </div>
        {renderNextBtn()}
      </div>
      <div className={classNames(styles.main, { [styles.ador]: isAdor, [styles.bb2]: isBb2 })}>
        {isUsb ? (
          <div className={classNames(styles.image, styles['is-usb'])}>
            <div className={classNames(styles.circle, styles.c1)} />
            <img
              className={styles['is-usb']}
              src="img/init-panel/icon-usb-cable.svg"
              draggable="false"
            />
            <div className={classNames(styles.circle, styles.c2)} />
          </div>
        ) : (
          <div className={styles.image}>
            <div className={classNames(styles.hint, { [styles.wired]: isWired })} />
            <img src={touchPanelSrc} draggable="false" />
          </div>
        )}
        <div className={styles.text}>
          <div className={styles.title}>
            {isUsb
              ? lang.initialize.connect_machine_ip.check_usb
              : lang.initialize.connect_machine_ip.enter_ip}
          </div>
          {!isUsb ? (
            <input
              className={classNames(styles.input)}
              value={ipValue}
              onChange={(e) => setIpValue(e.currentTarget.value)}
              placeholder="192.168.0.1"
              type="text"
              onKeyDown={(e) => {
                e.stopPropagation();
                handleInputKeyDown(e);
              }}
            />
          ) : null}
          <TestInfo
            testState={testState}
            connectionCountDown={countDownDisplay}
            firmwareVersion={device?.version}
          />
          {isPromark && <Hint message={lang.initialize.connect_machine_ip.promark_hint} />}
        </div>
      </div>
    </div>
  );
};

export default ConnectMachineIp;
