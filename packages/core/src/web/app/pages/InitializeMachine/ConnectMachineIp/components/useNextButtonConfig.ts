import { isTesting, TestState } from '@core/app/constants/connection-test';
import type { SetupPageButtonConfig } from '@core/app/pages/InitializeMachine/Components/SetupPageLayout';
import useI18n from '@core/helpers/useI18n';

const useNextButtonConfig = ({
  handleStartTest,
  isPromark,
  onFinish,
  testState,
}: {
  handleStartTest: () => void;
  isPromark: boolean;
  onFinish: () => void;
  testState: TestState;
}): SetupPageButtonConfig => {
  const lang = useI18n();
  let label = lang.initialize.next;
  let onClick = handleStartTest;

  if ([TestState.CAMERA_TEST_FAILED, TestState.TEST_COMPLETED].includes(testState)) {
    if (!isPromark) {
      label = lang.initialize.connect_machine_ip.finish_setting;
    }

    onClick = onFinish;
  } else if (!isTesting(testState) && testState !== TestState.NONE) {
    label = lang.initialize.retry;
  }

  return { disabled: isTesting(testState), label, onClick, primary: true };
};

export default useNextButtonConfig;
