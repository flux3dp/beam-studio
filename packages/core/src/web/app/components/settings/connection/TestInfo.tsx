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
  const { model } = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);

    return { model: urlParams.get('model') || '' };
  }, []);

  const isPromark = promarkModels.has(model);

  const renderBasicConnectionInfo = (reached: string = tConnect.check_ip, unreachableError = tConnect.unreachable) => {
    if (testState === TestState.NONE) {
      return null;
    }

    const status = match(testState)
      .with(TestState.IP_TESTING, () => '')
      .with(TestState.IP_FORMAT_ERROR, () => `${tConnect.invalid_ip}${tConnect.invalid_format}`)
      .with(TestState.IP_UNREACHABLE, () => unreachableError)
      .otherwise(() => 'OK ✅');

    return <div className={styles.info} id="ip-test-info">{`${reached}... ${status}`}</div>;
  };

  const renderConnectionTestInfo = () => {
    if (testState < TestState.CONNECTION_TESTING) {
      return null;
    }

    const status = match(testState)
      .with(TestState.CONNECTION_TESTING, () => `${connectionCountDown}s`)
      .with(TestState.CONNECTION_TEST_FAILED, () => 'Fail')
      .otherwise(() => 'OK ✅');

    return (
      <div className={styles.info} id="machine-test-info">
        {`${tConnect.check_connection}... ${status}`}
      </div>
    );
  };

  const renderFirmwareVersion = () => {
    if (testState < TestState.CAMERA_TESTING) {
      return null;
    }

    return <div className={styles.info}>{`${tConnect.check_firmware}... ${firmwareVersion}`}</div>;
  };

  const renderCameraTesting = () => {
    if (testState < TestState.CAMERA_TESTING) {
      return null;
    }

    const status = match(testState)
      .with(TestState.TEST_COMPLETED, () => 'OK ✅')
      .with(TestState.CAMERA_TEST_FAILED, () => 'Fail')
      .otherwise(() => '');

    return <div className={styles.info}>{`${tConnect.check_camera}... ${status}`}</div>;
  };

  return (
    <div className={styles.container}>
      {isPromark
        ? renderBasicConnectionInfo(tConnect.check_swiftray_connection, tConnect.check_swiftray_connection_unreachable)
        : renderBasicConnectionInfo()}
      {renderConnectionTestInfo()}
      {renderFirmwareVersion()}
      {renderCameraTesting()}
      {testState === TestState.TEST_COMPLETED && <div className={styles.info}>{tConnect.succeeded_message}</div>}
    </div>
  );
};

export default TestInfo;
