import TestState from '@core/app/constants/connection-test';
import { IDeviceInfo } from '@core/interfaces/IDevice';

export interface State {
  testState: TestState;
  countDownDisplay: number;
  device: IDeviceInfo | null;
}

export const initialState: State = {
  testState: TestState.NONE,
  countDownDisplay: 0,
  device: null,
};
