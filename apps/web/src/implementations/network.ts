import { INetwork } from 'core-interfaces/INetwork';

// ref: https://stackoverflow.com/questions/4282151/is-it-possible-to-ping-a-server-from-javascript
// This method work at first few time
// However this may occur ERR_ADDRESS_UNREACHABLE which will be seen as success
// Current xhr is not able to get network error type
// Should only consider ERR_CONNECTION_REFUSED as success once available
const ping = (
  targer: string,
  timeout = 2000,
) => new Promise<{ success: boolean, rrt: number }>((resolve) => {
  let resolved = false;
  let start: number;
  let failTimer: NodeJS.Timeout;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `http://${targer}`, true);
  xhr.setRequestHeader('Cache-Control', 'no-cache');
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && !resolved) {
      resolved = true;
      if (failTimer) clearTimeout(failTimer);
      const rrt = Date.now() - start;
      resolve({ success: true, rrt });
    }
  };

  failTimer = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      resolve({ success: false, rrt: -1 });
    }
  }, timeout);

  start = Date.now();
  try {
    xhr.send(null);
  } catch (e) {
    // this is expected
    // eslint-disable-next-line no-console
    console.log('exception', e);
  }
});

export default {
  networkTest: async (ip: string, time: number, onProgress: (percentage: number) => void) => {
    const start = Date.now();
    let pingCount = 0;
    let successCount = 0;
    let totalRRT = 0;
    while (Date.now() < start + time) {
      const elapsedTime = Date.now() - start;
      const percentage = Math.round((100 * elapsedTime) / time);
      onProgress(percentage);
      pingCount += 1;
      // eslint-disable-next-line no-await-in-loop
      const { success, rrt } = await ping(ip);
      if (success) {
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
  },
  checkIPExist: async (ip: string, trial: number) => {
    let failed = 0;
    while (failed < trial) {
      // eslint-disable-next-line no-await-in-loop
      const { success } = await ping(ip);
      if (success) {
        return { isExisting: true };
      }
      failed += 1;
    }
    return { isExisting: false };
  },
} as INetwork;
