import type { KeyboardEventHandler } from 'react';
import React, { useMemo, useState } from 'react';

import classNames from 'classnames';

import { adorModels, nxModels } from '@core/app/actions/beambox/constant';
import TestInfo from '@core/app/components/settings/categories/Connection/TestInfo';
import { ConnectMachineFailedStates, TestState } from '@core/app/constants/connection-test';
import useI18n from '@core/helpers/useI18n';
import os from '@core/implementations/os';

import ConnectionImage from './components/ConnectionImage';
import Hint from './components/Hint';
import NextButton from './components/NextButton';
import { useConnectionTest } from './hooks/useConnectionTest';
import styles from './index.module.scss';

const ConnectMachineIp = (): React.JSX.Element => {
  const lang = useI18n();
  const [ipValue, setIpValue] = useState('');
  const { isAdor, isNx, isUsb, isWired, model } = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);
    const modelValue = urlParams.get('model')!;

    return {
      isAdor: adorModels.has(modelValue),
      isNx: nxModels.has(modelValue),
      isUsb: urlParams.get('usb') === '1',
      isWired: urlParams.get('wired') === '1',
      model: modelValue,
    };
  }, []);
  const { handleStartTest, isPromark, onFinish, state } = useConnectionTest(model, isUsb, ipValue, setIpValue);
  const { countDownDisplay, device, testState } = state;

  const handleInputKeyDown: KeyboardEventHandler = ({ key }) => {
    if (key === 'Enter') handleStartTest();
  };

  return (
    <div className={styles.container}>
      <div className={styles['top-bar']} />
      <div className={styles.btns}>
        <div className={styles.btn} onClick={() => window.history.back()}>
          {lang.initialize.back}
        </div>
        <NextButton handleStartTest={handleStartTest} isPromark={isPromark} onFinish={onFinish} testState={testState} />
      </div>
      <div className={classNames(styles.main, { [styles.ador]: isAdor, [styles.nx]: isNx })}>
        <ConnectionImage isAdor={isAdor} isNx={isNx} isUsb={isUsb} isWired={isWired} />
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
          {testState === TestState.IP_UNREACHABLE && os.isMacOS15OrLater && (
            <Hint message={lang.initialize.connect_machine_ip.unreachable_macos_15} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectMachineIp;
