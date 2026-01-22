import React, { useMemo } from 'react';

import { match } from 'ts-pattern';

import { promarkModels } from '@core/app/actions/beambox/constant';
import { TestState } from '@core/app/constants/connection-test';
import useI18n from '@core/helpers/useI18n';

import styles from './TestInfo.module.scss';

interface Props {
  connectionCountDown: number;
  firmwareVersion?: string;
  testState: TestState;
}

const TestInfo = ({ connectionCountDown, firmwareVersion = '', testState }: Props): React.JSX.Element => {
  const tConnect = useI18n().initialize.connect_machine_ip;
  const model = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';

    return new URLSearchParams(queryString).get('model') || '';
  }, []);

  const isPromark = promarkModels.has(model);
  const showConnectionTest = testState >= TestState.CONNECTION_TESTING;
  const showCameraTest = testState >= TestState.CAMERA_TESTING;

  const getBasicConnectionStatus = (unreachableError: string) =>
    match(testState)
      .with(TestState.IP_TESTING, () => '')
      .with(TestState.IP_FORMAT_ERROR, () => `${tConnect.invalid_ip}${tConnect.invalid_format}`)
      .with(TestState.IP_UNREACHABLE, () => unreachableError)
      .otherwise(() => 'OK ✅');

  const connectionTestStatus = match(testState)
    .with(TestState.CONNECTION_TESTING, () => `${connectionCountDown}s`)
    .with(TestState.CONNECTION_TEST_FAILED, () => 'Fail')
    .otherwise(() => 'OK ✅');

  const cameraTestStatus = match(testState)
    .with(TestState.TEST_COMPLETED, () => 'OK ✅')
    .with(TestState.CAMERA_TEST_FAILED, () => 'Fail')
    .otherwise(() => '');

  const reachedLabel = isPromark ? tConnect.check_swiftray_connection : tConnect.check_ip;
  const unreachableError = isPromark ? tConnect.check_swiftray_connection_unreachable : tConnect.unreachable;

  return (
    <div className={styles.container}>
      {testState !== TestState.NONE && (
        <div className={styles.info} id="ip-test-info">
          {`${reachedLabel}... ${getBasicConnectionStatus(unreachableError)}`}
        </div>
      )}
      {showConnectionTest && (
        <div className={styles.info} id="machine-test-info">
          {`${tConnect.check_connection}... ${connectionTestStatus}`}
        </div>
      )}
      {showCameraTest && <div className={styles.info}>{`${tConnect.check_firmware}... ${firmwareVersion}`}</div>}
      {showCameraTest && <div className={styles.info}>{`${tConnect.check_camera}... ${cameraTestStatus}`}</div>}
      {testState === TestState.TEST_COMPLETED && <div className={styles.info}>{tConnect.succeeded_message}</div>}
    </div>
  );
};

export default TestInfo;
