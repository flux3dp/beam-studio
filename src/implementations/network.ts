import dns from 'dns';
import ping from 'net-ping';
import SerialPort from 'serialport';

import { INetwork } from 'interfaces/INetwork';

export default {
  dnsLookUpAll(
    hostname: string,
    options?: {
      family?: number,
      hints?: number,
      verbatim?: boolean,
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
  createSerialPort(path: string, options?: {
    baudRate?: number;
    dataBits?: number;
    lock?: boolean;
  }, callback?: any): SerialPort {
    return new SerialPort(path, {
      ...options,
    } as SerialPort.OpenOptions, callback);
  },
  networkTest: async (ip: string, time: number, onProgress: (percentage: number) => void) => {
    let session;
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      const createSession = () => {
        try {
          session = ping.createSession({
            retries: 0,
          });
          session.on('error', (error) => {
            // eslint-disable-next-line no-console
            console.log(`session error: ${error}`);
            createSession();
          });
        } catch (e) {
          resolve({ err: 'CREATE_SESSION_FAILED', reason: String(e) });
          throw e;
        }
      };
      createSession();
      if (!session) return;
      const start = Date.now();
      let pingCount = 0;
      let successCount = 0;
      let totalRRT = 0;
      const doPing = () => new Promise<{ error?: string, rrt?: number }>((resolve2) => {
        session.pingHost(ip, (error, target: string, sent: number, rcvd: number) => {
          if (error) {
            // console.log(`${target}: ${error.toString()}`);
            if (error.toString().match('Invalid IP address')) {
              resolve2({ error: 'INVALID_IP' });
            } else {
              resolve2({ error: error.toString() });
            }
          } else {
            resolve2({ rrt: rcvd - sent });
          }
        });
      });
      while (Date.now() < start + time) {
        const elapsedTime = Date.now() - start;
        const percentage = Math.round((100 * elapsedTime) / time);
        onProgress(percentage);
        // eslint-disable-next-line no-await-in-loop
        const { error, rrt } = await doPing();
        pingCount += 1;
        if (rrt) {
          successCount += 1;
          totalRRT += rrt;
        } else if (error === 'INVALID_IP') {
          resolve({ err: 'INVALID_IP' });
          break;
        }
      }
      const avgRRT = totalRRT / successCount;
      const failedCount = pingCount - successCount;
      const quality = avgRRT < 2 ? 100 - failedCount : 100 - 3 * failedCount;
      resolve({
        successRate: successCount / pingCount,
        avgRRT,
        quality,
      });
    });
  },
  checkIPExist: async (ip: string, trial: number) => {
    try {
      const session = ping.createSession();
      session.on('error', (error) => {
        throw (error);
      });
      return new Promise((resolve) => {
        let failed = 0;
        const doPing = () => {
          session.pingHost(ip, (error) => {
            if (!error) {
              // console.log('rrt', rcvd - sent);
              resolve({ isExisting: true });
              return;
            }
            // console.log(error);
            failed += 1;
            if (failed >= trial) {
              resolve({ isExisting: false });
            } else {
              doPing();
            }
          });
        };
        doPing();
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      return { error: String(err) };
    }
  },
} as INetwork;
