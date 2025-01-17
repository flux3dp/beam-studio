import React, { useMemo } from 'react';
import TestState from 'app/constants/connection-test';
import useI18n from 'helpers/useI18n';

import { promarkModels } from 'app/actions/beambox/constant';
import styles from './TestInfo.module.scss';

interface Props {
  testState: TestState;
  connectionCountDown: number;
  firmwareVersion?: string;
}

const TestInfo = ({ testState, connectionCountDown, firmwareVersion = '' }: Props): JSX.Element => {
  const tConnect = useI18n().initialize.connect_machine_ip;
  const { model } = useMemo(() => {
    const queryString = window.location.hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);

    return { model: urlParams.get('model') };
  }, []);

  const isPromark = promarkModels.has(model);

  const renderBasicConnectionInfo = (
    reached: string = tConnect.check_ip,
    unreachableError = tConnect.unreachable
  ) => {
    if (testState === TestState.NONE) {
      return null;
    }

    let status = 'OK ✅';

    switch (testState) {
      case TestState.IP_TESTING:
        status = '';
        break;
      case TestState.IP_FORMAT_ERROR:
        status = `${tConnect.invalid_ip}${tConnect.invalid_format}`;
        break;
      case TestState.IP_UNREACHABLE:
        status = unreachableError;
        break;
      default:
        break;
    }

    return <div id="ip-test-info" className={styles.info}>{`${reached}... ${status}`}</div>;
  };

  const renderConnectionTestInfo = () => {
    if (testState < TestState.CONNECTION_TESTING) return null;
    let status = 'OK ✅';
    if (testState === TestState.CONNECTION_TESTING) status = `${connectionCountDown}s`;
    else if (testState === TestState.CONNECTION_TEST_FAILED) status = 'Fail';
    return (
      <div id="machine-test-info" className={styles.info}>
        {`${tConnect.check_connection}... ${status}`}
      </div>
    );
  };

  const renderFirmwareVersion = () => {
    if (testState < TestState.CAMERA_TESTING) return null;
    return <div className={styles.info}>{`${tConnect.check_firmware}... ${firmwareVersion}`}</div>;
  };

  const renderCameraTesting = () => {
    if (testState < TestState.CAMERA_TESTING) return null;
    let status = '';
    if (testState === TestState.TEST_COMPLETED) status = 'OK ✅';
    else if (testState === TestState.CAMERA_TEST_FAILED) status = 'Fail';
    return <div className={styles.info}>{`${tConnect.check_camera}... ${status}`}</div>;
  };

  return (
    <div className={styles.container}>
      {isPromark
        ? renderBasicConnectionInfo(
            tConnect.check_swiftray_connection,
            tConnect.check_swiftray_connection_unreachable
          )
        : renderBasicConnectionInfo()}
      {renderConnectionTestInfo()}
      {renderFirmwareVersion()}
      {renderCameraTesting()}
      {testState === TestState.TEST_COMPLETED && (
        <div className={styles.info}>{tConnect.succeeded_message}</div>
      )}
    </div>
  );
};

export default TestInfo;
