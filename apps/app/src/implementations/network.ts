import dns from 'dns';

import communicator from '@core/implementations/communicator';
import type { INetwork } from '@core/interfaces/INetwork';

export default {
  checkIPExist: async (ip: string, trial: number) =>
    new Promise<{ error?: string; isExisting: boolean }>((resolve) => {
      communicator.once('CHECK_IP_EXIST_RESULT', (e: any, res: { error?: string; isExisting: boolean }) =>
        resolve(res),
      );
      communicator.send('CHECK_IP_EXIST', ip, trial);
    }),
  dnsLookUpAll(
    hostname: string,
    options?: { family?: number; hints?: number; verbatim?: boolean },
  ): Promise<dns.LookupAddress[]> {
    return dns.promises.lookup(hostname, { ...options, all: true });
  },
  networkTest: (ip: string, time: number, onProgress: (_percentage: number) => void) =>
    new Promise((resolve) => {
      const onCommunicatorProgress = (e: any, percentage: number) => onProgress(percentage);

      communicator.on('TEST_NETWORK_PROGRESS', onCommunicatorProgress);
      communicator.once(
        'TEST_NETWORK_RESULT',
        (
          e: any,
          res:
            | PromiseLike<{
                avgRRT?: number;
                err?: string;
                quality?: number;
                reason?: string;
                successRate?: number;
              }>
            | {
                avgRRT?: number;
                err?: string;
                quality?: number;
                reason?: string;
                successRate?: number;
              },
        ) => {
          communicator.off('TEST_NETWORK_PROGRESS', onCommunicatorProgress);
          resolve(res);
        },
      );
      communicator.send('TEST_NETWORK', ip, time);
    }),
} as INetwork;
