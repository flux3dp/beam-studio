import type { KeyboardEventHandler } from 'react';
import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CheckCircleFilled, CloseCircleFilled, LoadingOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { match } from 'ts-pattern';

import { isTesting, TestState } from '@core/app/constants/connection-test';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { useConnectionTest } from '@core/app/pages/InitializeMachine/ConnectMachineIp/hooks/useConnectionTest';
import useI18n from '@core/helpers/useI18n';

import { ConnectionIssueGuideContext } from '../context';

import styles from './StepVerify.module.scss';

type CheckStatus = 'fail' | 'pending' | 'success' | 'testing';

interface StepVerifyProps {
  model: WorkAreaModel;
}

const getIpStatus = (testState: TestState): CheckStatus => {
  return match(testState)
    .with(TestState.IP_FORMAT_ERROR, TestState.IP_UNREACHABLE, (): CheckStatus => 'fail')
    .with(TestState.IP_TESTING, (): CheckStatus => 'testing')
    .otherwise((): CheckStatus => (testState >= TestState.CONNECTION_TESTING ? 'success' : 'pending'));
};

const getMachineStatus = (testState: TestState): CheckStatus => {
  return match(testState)
    .with(TestState.CONNECTION_TEST_FAILED, (): CheckStatus => 'fail')
    .with(TestState.CONNECTION_TESTING, (): CheckStatus => 'testing')
    .otherwise((): CheckStatus => (testState >= TestState.CAMERA_TESTING ? 'success' : 'pending'));
};

const getFirmwareStatus = (testState: TestState): CheckStatus =>
  testState >= TestState.CAMERA_TESTING ? 'success' : 'pending';

const renderStatusIcon = (status: CheckStatus): React.JSX.Element =>
  match(status)
    .with('pending', () => <MinusCircleOutlined className={styles.pending} />)
    .with('testing', () => <LoadingOutlined className={styles.testing} />)
    .with('success', () => <CheckCircleFilled className={styles.success} />)
    .with('fail', () => <CloseCircleFilled className={styles.fail} />)
    .exhaustive();

const StepVerify = ({ model }: StepVerifyProps): React.JSX.Element => {
  const i18n = useI18n();
  const lang = i18n.connection_issue_guide.enter_ip;
  const { setPrimaryButton, setResult } = use(ConnectionIssueGuideContext);
  const [ipValue, setIpValue] = useState('');
  const { handleStartTest, state } = useConnectionTest(model, false, ipValue, setIpValue, {
    discoverId: 'connection-issue-guide',
    skipCameraTest: true,
  });
  const { device, testState } = state;
  const testing = isTesting(testState);
  const isFailed = [TestState.CONNECTION_TEST_FAILED, TestState.IP_UNREACHABLE].includes(testState);
  const imgSrc = useMemo(() => {
    const suffix = match<WorkAreaModel, string>(model)
      .with('fbm1', 'fbb1b', 'fbb1p', 'fhexa1', () => 'classic')
      .with('ado1', () => 'ador')
      .otherwise(() => 'nx');

    return `core-img/connection-issue-guide/ip-address-${suffix}.png`;
  }, [model]);

  // Use ref to outer button callback reference
  const handleStartTestRef = useRef(handleStartTest);

  handleStartTestRef.current = handleStartTest;

  useEffect(() => {
    if ([TestState.CAMERA_TEST_FAILED, TestState.TEST_COMPLETED].includes(testState)) {
      setPrimaryButton({ label: i18n.buttons.next, onClick: () => setResult('success'), primary: true });
    } else if (isFailed) {
      setPrimaryButton({ label: i18n.buttons.next, onClick: () => setResult('fail'), primary: true });
    } else {
      setPrimaryButton({
        disabled: testing,
        label: lang.verify,
        onClick: () => handleStartTestRef.current(),
        primary: true,
      });
    }

    return () => setPrimaryButton(null);
  }, [testState, testing, isFailed, setPrimaryButton, setResult, lang.verify, i18n.buttons.next]);

  const checks = [
    { key: 'ip', label: lang.check_ip_reachable, status: getIpStatus(testState) },
    { key: 'machine', label: lang.check_machine_responds, status: getMachineStatus(testState) },
    {
      key: 'firmware',
      label: device?.version ? `${lang.check_firmware}: ${device.version}` : lang.check_firmware,
      status: getFirmwareStatus(testState),
    },
  ];

  const handleInputKeyDown: KeyboardEventHandler = useCallback(
    (e) => {
      e.stopPropagation();

      if (e.key === 'Enter') handleStartTest();
    },
    [handleStartTest],
  );

  return (
    <>
      <div className={styles.image}>
        <img draggable="false" src={imgSrc} />
      </div>
      <div className={styles.text}>
        <div className={styles.title}>{lang.title}</div>
        <input
          className={styles.input}
          onChange={(e) => setIpValue(e.currentTarget.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={lang.placeholder}
          type="text"
          value={ipValue}
        />
        <div className={styles.content}>
          <div>{`1. ${lang.step1}`}</div>
          <div>{`2. ${lang.step2}`}</div>
          <div>{`3. ${lang.step3}`}</div>
          <div className={styles.checklist}>
            {checks.map(({ key, label, status }) => (
              <div className={styles.check} key={key}>
                {renderStatusIcon(status)}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default StepVerify;
