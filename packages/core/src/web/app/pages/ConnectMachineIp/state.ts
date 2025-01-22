import TestState from '@core/app/constants/connection-test';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

export interface State {
  countDownDisplay: number;
  device: IDeviceInfo | null;
  testState: TestState;
}

export const initialState: State = {
  countDownDisplay: 0,
  device: null,
  testState: TestState.NONE,
};
