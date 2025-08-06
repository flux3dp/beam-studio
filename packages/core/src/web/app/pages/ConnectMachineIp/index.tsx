import type { KeyboardEventHandler } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import { adorModels, bb2Models, promarkModels } from '@core/app/actions/beambox/constant';
import TestInfo from '@core/app/components/settings/connection/TestInfo';
import { ConnectMachineFailedStates } from '@core/app/constants/connection-test';
import Discover from '@core/helpers/api/discover';
import checkRpiIp from '@core/helpers/check-rpi-ip';
import useI18n from '@core/helpers/useI18n';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

import ConnectionImage from './components/ConnectionImage';
import Hint from './components/Hint';
import NextButton from './components/NextButton';
import { useConnectionTest } from './hooks/useConnectionTest';
import styles from './index.module.scss';

const ConnectMachineIp = (): React.JSX.Element => {
  const lang = useI18n();
  const [ipValue, setIpValue] = useState('');
  const intervalId = useRef(0);
  const discoveredDevicesRef = useRef(Array.of<IDeviceInfo>());
  const { isUsb, isWired, model } = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);

    return {
      isUsb: urlParams.get('usb') === '1',
      isWired: urlParams.get('wired') === '1',
      model: urlParams.get('model')!,
    };
  }, []);
  const { handleStartTest, onFinish, state } = useConnectionTest(model, isUsb, ipValue, setIpValue);
  const discoverer = useMemo(
    () =>
      Discover('connect-machine-ip', (devices) => {
        discoveredDevicesRef.current = devices;
      }),
    [],
  );

  useEffect(() => () => discoverer.removeListener('connect-machine-ip'), [discoverer]);

  const [isAdor, isBb2, isPromark] = useMemo(
    () => [adorModels.has(model), bb2Models.has(model), promarkModels.has(model)],
    [model],
  );

  useEffect(() => {
    if (isUsb) {
      handleStartTest();
    } else {
      checkRpiIp().then((ip) => ip && setIpValue(ip));
    }

    return () => {
      clearInterval(intervalId.current);
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [isUsb]);

  const handleInputKeyDown: KeyboardEventHandler = ({ key }) => {
    if (key === 'Enter') handleStartTest();
  };

  const { countDownDisplay, device, testState } = state;

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {lang.initialize.back}
        </div>
        <NextButton handleStartTest={handleStartTest} isPromark={isPromark} onFinish={onFinish} testState={testState} />
      </div>
      <div className={classNames(styles.main, { [styles.ador]: isAdor, [styles.bb2]: isBb2 })}>
        <ConnectionImage isAdor={isAdor} isBb2={isBb2} isUsb={isUsb} isWired={isWired} />
        <div className={styles.text}>
          <div className={styles.title}>
            {isUsb ? lang.initialize.connect_machine_ip.check_usb : lang.initialize.connect_machine_ip.enter_ip}
          </div>
          {!isUsb && (
            <input
              className={classNames(styles.input)}
              onChange={(e) => setIpValue(e.currentTarget.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                handleInputKeyDown(e);
              }}
              placeholder="192.168.0.1"
              type="text"
              value={ipValue}
            />
          )}
          <TestInfo connectionCountDown={countDownDisplay} firmwareVersion={device?.version} testState={testState} />
          {isPromark && <Hint message={lang.initialize.connect_machine_ip.promark_hint} />}
          {ConnectMachineFailedStates.includes(testState) && (
            <Hint message={lang.initialize.connect_machine_ip.connection_failed_hint} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectMachineIp;
