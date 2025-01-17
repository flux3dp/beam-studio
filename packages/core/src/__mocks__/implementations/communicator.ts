import { ICommunicator } from 'interfaces/ICommunicator';

const mockCommunicator: ICommunicator = {
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
  send: jest.fn(),
  sendSync: () => null,
};

export default mockCommunicator;
