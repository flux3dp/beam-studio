import React from 'react';

import classNames from 'classnames';

import { isTesting, TestState } from '@core/app/constants/connection-test';
import useI18n from '@core/helpers/useI18n';

import styles from '../index.module.scss';

interface Props {
  handleStartTest: () => void;
  isPromark: boolean;
  onFinish: () => void;
  testState: TestState;
}

const NextButton = ({ handleStartTest, isPromark, onFinish, testState }: Props): JSX.Element => {
  const lang = useI18n();
  let label = lang.initialize.next;
  let handleClick = handleStartTest;

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
      className={classNames(styles.btn, styles.primary, { [styles.disabled]: isTesting(testState) })}
      onClick={handleClick}
    >
      {label}
    </div>
  );
};

export default NextButton;
