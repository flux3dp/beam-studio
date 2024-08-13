/* eslint-disable no-param-reassign */
import ping from 'net-ping';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserWindow, ipcMain } from 'electron';

import events from './ipc-events';

const testNetwork = async (ip: string, time: number, mainWindow: BrowserWindow) => {
  let session: Session;
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
    const doPing = () =>
      new Promise<{ error?: string; rrt?: number }>((resolve2) => {
        let resolved = false;
        setTimeout(() => {
          if (!resolved) {
            resolve2({ error: 'TOMEOUT' });
            resolved = true;
          }
        }, 3000);
        session.pingHost(ip, (error, target, sent, rcvd) => {
          if (!resolved) {
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
          }
          resolved = true;
        });
      });
    while (Date.now() < start + time) {
      const elapsedTime = Date.now() - start;
      const percentage = Math.round((100 * elapsedTime) / time);
      mainWindow.webContents.send(events.TEST_NETWORK_PROGRESS, percentage);
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
};

const checkIPExist = async (ip: string, trial: number) => {
  try {
    const session = ping.createSession();
    session.on('error', (error) => {
      throw error;
    });
    const res = await new Promise<{ isExisting: boolean }>((resolve) => {
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
    return res;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    return { error: String(err) };
  }
};

const registerEvents = (mainWindow: BrowserWindow): void => {
  ipcMain.removeAllListeners(events.TEST_NETWORK);
  ipcMain.on(events.TEST_NETWORK, async (event, ip, time) => {
    const res = await testNetwork(ip, time, mainWindow);
    mainWindow.webContents.send(events.TEST_NETWORK_RESULT, res);
    event.returnValue = res;
  });

  ipcMain.removeAllListeners(events.CHECK_IP_EXIST);
  ipcMain.on(events.CHECK_IP_EXIST, async (event, ip, trial) => {
    const res = await checkIPExist(ip, trial);
    mainWindow.webContents.send(events.CHECK_IP_EXIST_RESULT, res);
    event.returnValue = res;
  });
};

export default {
  registerEvents,
};
