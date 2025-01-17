import TestState from 'app/constants/connection-test';
import { IDeviceInfo } from 'interfaces/IDevice';

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
