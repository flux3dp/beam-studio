import ping from 'ping';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserWindow, ipcMain } from 'electron';

import events from './ipc-events';

const testNetwork = async (ip: string, time: number, mainWindow: BrowserWindow) => {
  const start = Date.now();
  let pingCount = 0;
  let successCount = 0;
  let totalRRT = 0;
  while (Date.now() < start + time) {
    const elapsedTime = Date.now() - start;
    const percentage = Math.round((100 * elapsedTime) / time);
    mainWindow.webContents.send(events.TEST_NETWORK_PROGRESS, percentage);
    // wait for the network to be ready
    pingCount += 1;
    // eslint-disable-next-line no-await-in-loop
    const res = await ping.promise.probe(ip, {
      timeout: 3,
    });

    const { alive, time: rrt } = res;
    if (alive && rrt !== 'unknown') {
      successCount += 1;
      totalRRT += rrt;
    }
  }
  const avgRRT = totalRRT / successCount;
  const failedCount = pingCount - successCount;
  const quality = avgRRT < 2 ? 100 - failedCount : 100 - 3 * failedCount;
  return {
    successRate: successCount / pingCount,
    avgRRT,
    quality,
  };
};

const checkIPExist = async (ip: string, trial: number) => {
  try {
    for (let i = 0; i < trial; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await ping.promise.probe(ip, {
        timeout: 3,
      });
      if (res.alive) {
        return { isExisting: true };
      }
    }
    return { isExisting: false };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return { error: String(error) };
  }
};

const registerEvents = (mainWindow: BrowserWindow): void => {
  ipcMain.removeAllListeners(events.TEST_NETWORK);
  ipcMain.on(events.TEST_NETWORK, async (event, ip, time) => {
    const res = await testNetwork(ip, time, mainWindow);
    mainWindow.webContents.send(events.TEST_NETWORK_RESULT, res);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = res;
  });

  ipcMain.removeAllListeners(events.CHECK_IP_EXIST);
  ipcMain.on(events.CHECK_IP_EXIST, async (event, ip, trial) => {
    const res = await checkIPExist(ip, trial);
    mainWindow.webContents.send(events.CHECK_IP_EXIST_RESULT, res);
    // eslint-disable-next-line no-param-reassign
    event.returnValue = res;
  });
};

export default {
  registerEvents,
};
