import { SWIFTRAY_PORT } from '@core/app/constants/swiftray-constants';

import { parseNetstatPids, parseTasklistName } from './swiftrayProcess';

// Windows-only parsing, so it can only be covered here rather than by running the real commands.
describe('parseNetstatPids', () => {
  // Built from SWIFTRAY_PORT so the fixture cannot drift from the port the sweep actually uses.
  const port = SWIFTRAY_PORT;
  const output = [
    '',
    'Active Connections',
    '',
    '  Proto  Local Address          Foreign Address        State           PID',
    '  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1080',
    `  TCP    0.0.0.0:${port}           0.0.0.0:0              LISTENING       9876`,
    `  TCP    [::]:${port}              [::]:0                 LISTENING       9876`,
    `  TCP    127.0.0.1:${port}         127.0.0.1:52341        ESTABLISHED     9876`,
    `  TCP    127.0.0.1:52341        127.0.0.1:${port}         ESTABLISHED     4242`,
    `  TCP    0.0.0.0:1${port}          0.0.0.0:0              LISTENING       555`,
    '',
  ].join('\r\n');

  it('returns the pid listening on the port, deduplicated', () => {
    expect(parseNetstatPids(output, SWIFTRAY_PORT)).toEqual([9876]);
  });

  it('ignores our own client socket, whose local port is ephemeral', () => {
    expect(parseNetstatPids(output, SWIFTRAY_PORT)).not.toContain(4242);
  });

  it('does not match a port that merely ends with the same digits', () => {
    expect(parseNetstatPids(output, SWIFTRAY_PORT)).not.toContain(555);
  });

  it('matches on the local address rather than the localized state word', () => {
    const localized = `  TCP    0.0.0.0:${port}           0.0.0.0:0              ABHOEREN        4321`;

    expect(parseNetstatPids(localized, SWIFTRAY_PORT)).toEqual([4321]);
  });

  it('returns nothing for empty or header-only output', () => {
    expect(parseNetstatPids('', SWIFTRAY_PORT)).toEqual([]);
    expect(parseNetstatPids('Active Connections', SWIFTRAY_PORT)).toEqual([]);
  });
});

describe('parseTasklistName', () => {
  it('extracts the image name', () => {
    expect(parseTasklistName('"Swiftray.exe","9876","Console","1","120,000 K"\r\n')).toBe('Swiftray.exe');
  });

  it('never yields a swiftray-like name when no task matched', () => {
    const info = 'INFO: No tasks are running which match the specified criteria.\r\n';

    expect(parseTasklistName(info).toLowerCase()).not.toContain('swiftray');
  });

  it('handles empty output', () => {
    expect(parseTasklistName('')).toBe('');
  });
});
