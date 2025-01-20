import type { WebContents } from 'electron';
import { ipcMain } from 'electron';
import ping from 'ping';

import events from './ipc-events';

const testNetwork = async (ip: string, time: number, webContents: WebContents) => {
  const start = Date.now();
  let pingCount = 0;
  let successCount = 0;
  let totalRRT = 0;

  while (Date.now() < start + time) {
    const elapsedTime = Date.now() - start;
    const percentage = Math.round((100 * elapsedTime) / time);

    webContents.send(events.TEST_NETWORK_PROGRESS, percentage);
    // wait for the network to be ready
    pingCount += 1;

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
    avgRRT,
    quality,
    successRate: successCount / pingCount,
  };
};

const checkIPExist = async (ip: string, trial: number) => {
  try {
    for (let i = 0; i < trial; i += 1) {
      const res = await ping.promise.probe(ip, {
        timeout: 3,
      });

      if (res.alive) {
        return { isExisting: true };
      }
    }

    return { isExisting: false };
  } catch (error) {
    console.log(error);

    return { error: String(error) };
  }
};

const registerEvents = (): void => {
  ipcMain.removeAllListeners(events.TEST_NETWORK);
  ipcMain.on(events.TEST_NETWORK, async (event, ip, time) => {
    const { sender } = event;
    const res = await testNetwork(ip, time, sender);

    event.sender.send(events.TEST_NETWORK_RESULT, res);

    event.returnValue = res;
  });

  ipcMain.removeAllListeners(events.CHECK_IP_EXIST);
  ipcMain.on(events.CHECK_IP_EXIST, async (event, ip, trial) => {
    const { sender } = event;
    const res = await checkIPExist(ip, trial);

    sender.send(events.CHECK_IP_EXIST_RESULT, res);

    event.returnValue = res;
  });
};

export default {
  registerEvents,
};
