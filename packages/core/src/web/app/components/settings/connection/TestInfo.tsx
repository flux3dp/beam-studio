import React, { useMemo } from 'react';

import { promarkModels } from '@core/app/actions/beambox/constant';
import TestState from '@core/app/constants/connection-test';
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

    return { model: urlParams.get('model') };
  }, []);

  const isPromark = promarkModels.has(model);

  const renderBasicConnectionInfo = (reached: string = tConnect.check_ip, unreachableError = tConnect.unreachable) => {
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

    return <div className={styles.info} id="ip-test-info">{`${reached}... ${status}`}</div>;
  };

  const renderConnectionTestInfo = () => {
    if (testState < TestState.CONNECTION_TESTING) {
      return null;
    }

    let status = 'OK ✅';

    if (testState === TestState.CONNECTION_TESTING) {
      status = `${connectionCountDown}s`;
    } else if (testState === TestState.CONNECTION_TEST_FAILED) {
      status = 'Fail';
    }

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

    let status = '';

    if (testState === TestState.TEST_COMPLETED) {
      status = 'OK ✅';
    } else if (testState === TestState.CAMERA_TEST_FAILED) {
      status = 'Fail';
    }

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
