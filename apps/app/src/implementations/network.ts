import dns from 'dns';

import { NetworkEvents } from '@core/app/constants/ipcEvents';
import communicator from '@core/implementations/communicator';
import type { INetwork } from '@core/interfaces/INetwork';

const IPC_TIMEOUT = 30000; // 30 seconds

export default {
  checkIPExist: async (ip: string, trial: number) =>
    new Promise<{ error?: string; isExisting: boolean }>((resolve) => {
      const handler = (e: any, res: { error?: string; isExisting: boolean }) => {
        clearTimeout(timeout);
        resolve(res);
      };
      const timeout = setTimeout(() => {
        communicator.off(NetworkEvents.CheckIpExistResult, handler);
        resolve({ error: 'IPC timeout', isExisting: false });
      }, IPC_TIMEOUT);

      communicator.once(NetworkEvents.CheckIpExistResult, handler);
      communicator.send(NetworkEvents.CheckIpExist, ip, trial);
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

      type NetworkTestResult = {
        avgRRT?: number;
        err?: string;
        quality?: number;
        reason?: string;
        successRate?: number;
      };

      const cleanup = () => {
        clearTimeout(timeout);
        communicator.off(NetworkEvents.TestNetworkProgress, onCommunicatorProgress);
      };

      const handler = (e: any, res: NetworkTestResult | PromiseLike<NetworkTestResult>) => {
        cleanup();
        resolve(res);
      };

      // Network test timeout is based on the requested time plus buffer
      const timeout = setTimeout(
        () => {
          communicator.off(NetworkEvents.TestNetworkResult, handler);
          cleanup();
          resolve({ err: 'IPC timeout', quality: 0 });
        },
        time * 1000 + IPC_TIMEOUT,
      );

      communicator.on(NetworkEvents.TestNetworkProgress, onCommunicatorProgress);
      communicator.once(NetworkEvents.TestNetworkResult, handler);
      communicator.send(NetworkEvents.TestNetwork, ip, time);
    }),
} as INetwork;
