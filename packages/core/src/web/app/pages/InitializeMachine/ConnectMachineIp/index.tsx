import type { KeyboardEventHandler } from 'react';
import React, { useMemo, useState } from 'react';

import classNames from 'classnames';

import { adorModels, nxModels } from '@core/app/actions/beambox/constant';
import TestInfo from '@core/app/components/settings/categories/Connection/TestInfo';
import { ConnectMachineFailedStates, TestState } from '@core/app/constants/connection-test';
import useI18n from '@core/helpers/useI18n';
import os from '@core/implementations/os';

import PanelImage, {
  adorIpHint,
  adorIpWiredHint,
  defaultIpHint,
  defaultIpWiredHint,
  nxIpHint,
} from '../Components/PanelImage';
import SetupPageLayout from '../Components/SetupPageLayout';
import UsbConnectionImage from '../Components/UsbConnectionImage';
import styles from '../ConnectionPage.module.scss';

import Hint from './components/Hint';
import useNextButtonConfig from './components/useNextButtonConfig';
import { useConnectionTest } from './hooks/useConnectionTest';

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
  const nextButton = useNextButtonConfig({ handleStartTest, isPromark, onFinish, testState });

  const hint = useMemo(() => {
    if (isAdor) return isWired ? adorIpWiredHint : adorIpHint;

    if (isNx) return nxIpHint;

    return isWired ? defaultIpWiredHint : defaultIpHint;
  }, [isAdor, isNx, isWired]);

  const imageSrc = useMemo(() => {
    if (isAdor) return 'core-img/init-panel/ador-ip.jpg';

    if (isNx) return `core-img/init-panel/beambox-2-ip-${isWired ? 'wired' : 'wireless'}.png`;

    return `img/init-panel/network-panel-${isWired ? 'wired' : 'wireless'}.jpg`;
  }, [isAdor, isNx, isWired]);

  const handleInputKeyDown: KeyboardEventHandler = ({ key }) => {
    if (key === 'Enter') handleStartTest();
  };

  return (
    <SetupPageLayout buttons={[{ label: lang.initialize.back, onClick: () => window.history.back() }, nextButton]}>
      {isUsb ? <UsbConnectionImage /> : <PanelImage hint={hint} landscape={isAdor} src={imageSrc} />}
      <div className={classNames(styles.text, { [styles.ador]: isAdor })}>
        <div className={styles.title}>
          {isUsb ? lang.initialize.connect_machine_ip.check_usb : lang.initialize.connect_machine_ip.enter_ip}
        </div>
        {!isUsb && (
          <input
            className={styles.input}
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
    </SetupPageLayout>
  );
};

export default ConnectMachineIp;
