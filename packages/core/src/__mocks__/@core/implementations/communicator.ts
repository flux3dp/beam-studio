import type { ICommunicator } from '@core/interfaces/ICommunicator';

const mockCommunicator: ICommunicator = {
  invoke: jest.fn().mockResolvedValue(null),
  off: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  send: jest.fn(),
  sendSync: () => null,
};

export default mockCommunicator;
