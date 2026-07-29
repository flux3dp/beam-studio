import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

import { SWIFTRAY_PORT } from '@core/app/constants/swiftray-constants';

export const getSwiftrayPaths = (): null | { dir: string; exec: string } => {
  if (!process.env.BACKEND_ROOT) return null;

  if (os.platform() === 'win32') {
    return { dir: path.join(process.env.BACKEND_ROOT, 'swiftray'), exec: 'Swiftray.exe' };
  }

  if (os.platform() === 'darwin') {
    return { dir: path.join(process.env.BACKEND_ROOT, 'Swiftray.app', 'Contents', 'MacOS'), exec: 'Swiftray' };
  }

  return null;
};

/** Best-effort command runner: a non-zero exit here just means "nothing to clean up". */
const tryExec = (command: string): null | string => {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }).toString();
  } catch {
    return null;
  }
};

/**
 * Pids from `netstat -ano -p TCP` owning a socket whose *local* address is on `port`, i.e. the
 * daemon's listener plus any connection it accepted. Sockets we opened as a client have an ephemeral
 * local port and never match, so this cannot return Beam Studio itself.
 *
 * Column layout: Proto | Local Address | Foreign Address | State | PID. The state word is localized
 * on non-English Windows, hence matching on the local address rather than on "LISTENING".
 */
export const parseNetstatPids = (output: string, port: number): number[] => {
  const pids = new Set<number>();

  for (const line of output.split('\n')) {
    const columns = line.trim().split(/\s+/);

    if (columns.length < 5 || columns[0].toUpperCase() !== 'TCP') continue;

    if (!columns[1].endsWith(`:${port}`)) continue;

    const pid = Number(columns[columns.length - 1]);

    if (pid > 0) pids.add(pid);
  }

  return [...pids];
};

/** First field of a `tasklist /NH /FO CSV` row: `"Swiftray.exe","1234","Console","1","120,000 K"`. */
export const parseTasklistName = (output: string): string => output.split(',')[0]?.replace(/"/g, '').trim() ?? '';

const getPidsOnPort = (port: number): number[] => {
  let pids: number[] = [];

  if (os.platform() === 'win32') {
    pids = parseNetstatPids(tryExec('netstat -ano -p TCP') ?? '', port);
  } else if (os.platform() === 'darwin') {
    pids = (tryExec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`) ?? '')
      .split('\n')
      .map((line) => Number(line.trim()))
      .filter((pid) => pid > 0);
  }

  return pids.filter((pid) => pid !== process.pid);
};

const getProcessName = (pid: number): string => {
  if (os.platform() === 'win32') {
    // When no task matches, tasklist prints an INFO line instead — harmless, it never says "swiftray".
    return parseTasklistName(tryExec(`tasklist /NH /FO CSV /FI "PID eq ${pid}"`) ?? '');
  }

  // macOS `ps -o comm=` prints the full executable path, e.g. .../Swiftray.app/Contents/MacOS/Swiftray
  return tryExec(`ps -p ${pid} -o comm=`)?.trim() ?? '';
};

const killPid = (pid: number): void => {
  tryExec(os.platform() === 'win32' ? `taskkill /F /T /PID ${pid}` : `kill -9 ${pid}`);
};

/**
 * Kill every Swiftray daemon we are not tracking: leftovers from a crashed or force-quit Beam Studio.
 * A stale daemon keeps SWIFTRAY_PORT bound, so a freshly spawned one can never be reached and the
 * user is stuck until they kill it by hand from the task manager.
 */
export const killStaleSwiftray = (): void => {
  const platform = os.platform();

  if (platform !== 'win32' && platform !== 'darwin') return;

  // By image name: also catches an instance that never managed to bind the port.
  const byName = platform === 'win32' ? tryExec('taskkill /F /T /IM Swiftray.exe') : tryExec('pkill -x Swiftray');

  if (byName !== null) console.log('Killed stale Swiftray process by name');

  // By port: catches a renamed or relocated binary still squatting on SWIFTRAY_PORT.
  for (const pid of getPidsOnPort(SWIFTRAY_PORT)) {
    const name = getProcessName(pid);

    if (!name.toLowerCase().includes('swiftray')) {
      console.warn(`Port ${SWIFTRAY_PORT} is held by "${name}" (pid ${pid}), not killing it`);
      continue;
    }

    console.log(`Killing stale Swiftray (pid ${pid}) holding port ${SWIFTRAY_PORT}`);
    killPid(pid);
  }
};

/** Kill a Swiftray we spawned. On Windows `pid` is the cmd.exe wrapper, so the whole tree must go. */
export const killSwiftrayPid = (pid: number): void => {
  console.log(`Killing Swiftray process tree (pid ${pid})`);
  killPid(pid);
};
