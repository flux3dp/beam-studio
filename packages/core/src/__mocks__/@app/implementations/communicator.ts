/* eslint-disable no-undef */
import type { ICommunicator } from 'interfaces/ICommunicator';

const mockCommunicator: ICommunicator = {
  off: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  send: jest.fn(),
  sendSync: () => null,
};

export default mockCommunicator;
