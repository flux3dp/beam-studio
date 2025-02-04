import type { ICommunicator } from '@core/interfaces/ICommunicator';

const mockCommunicator: ICommunicator = {
  off: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  send: jest.fn(),
  sendSync: () => null,
};

export default mockCommunicator;
