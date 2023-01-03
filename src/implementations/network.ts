import dns from 'dns';
import SerialPort from 'serialport';

import communicator from 'implementations/communicator';
import { INetwork } from 'interfaces/INetwork';

export default {
  dnsLookUpAll(
    hostname: string,
    options?: {
      family?: number;
      hints?: number;
      verbatim?: boolean;
    },
  ): Promise<dns.LookupAddress[]> {
    return dns.promises.lookup(hostname, {
      ...options,
      all: true,
    });
  },
  listSerialPorts(): Promise<SerialPort.PortInfo[]> {
    return SerialPort.list();
  },
  createSerialPort(
    path: string,
    options?: {
      baudRate?: number;
      dataBits?: number;
      lock?: boolean;
    },
    callback?: any,
  ): SerialPort {
    return new SerialPort(
      path,
      {
        ...options,
      } as SerialPort.OpenOptions,
      callback,
    );
  },
  networkTest: (
    ip: string,
    time: number,
    onProgress: (percentage: number) => void,
  ) => new Promise((resolve) => {
    const onCommunicatorProgress = (e, percentage) => onProgress(percentage);
    communicator.on('TEST_NETWORK_PROGRESS', onCommunicatorProgress);
    communicator.once('TEST_NETWORK_RESULT', (e, res) => {
      communicator.off('TEST_NETWORK_PROGRESS', onCommunicatorProgress);
      resolve(res);
    });
    communicator.send('TEST_NETWORK', ip, time);
  }),
  checkIPExist: async (ip: string, trial: number) => new Promise((resolve) => {
    communicator.once('CHECK_IP_EXIST_RESULT', (e, res) => resolve(res));
    communicator.send('CHECK_IP_EXIST', ip, trial);
  }),
} as INetwork;
