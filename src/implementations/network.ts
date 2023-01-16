import dns from 'dns';

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
  checkIPExist: async (
    ip: string,
    trial: number,
  ) => new Promise<{ error?: string, isExisting: boolean }>((resolve) => {
    communicator.once('CHECK_IP_EXIST_RESULT', (e, res: { error?: string, isExisting: boolean }) => resolve(res));
    communicator.send('CHECK_IP_EXIST', ip, trial);
  }),
} as INetwork;
