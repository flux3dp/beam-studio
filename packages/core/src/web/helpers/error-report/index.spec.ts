import { axiosFluxId } from '@core/helpers/api/flux-id';
import storage from '@core/implementations/storage';

const mockCurrentDevice = jest.fn();
const mockGetLogsTexts = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return mockCurrentDevice();
  },
  getLogsTexts: (...args: any[]) => mockGetLogsTexts(...args),
}));

const mockGetOutput = jest.fn();

jest.mock('@core/helpers/output-error', () => ({ getOutput: (...args: any[]) => mockGetOutput(...args) }));

const mockMeetRequirement = jest.fn();

jest.mock('@core/helpers/version-checker', () => () => ({
  meetRequirement: (...args: any[]) => mockMeetRequirement(...args),
}));

const mockGetInstallationId = jest.fn();

jest.mock('./installationId', () => ({ getInstallationId: () => mockGetInstallationId() }));

const mockAppend = jest.fn();

jest.mock('@core/helpers/logger', () => () => ({ append: (...args: any[]) => mockAppend(...args) }));

import { __setMockOS } from '@core/helpers/getOS';

import { ERROR_REPORT_ENDPOINT, MAX_BUG_REPORT_LENGTH, uploadErrorReport } from './index';

const mockPost = axiosFluxId.post as jest.Mock;
const fields = (form: FormData) =>
  Object.fromEntries([...form.entries()].map(([k, v]) => [k, v instanceof Blob ? `blob:${v.type}` : v]));
const idleDevice = (serial = 'SN12345678') => ({
  control: { getMode: () => '' },
  info: { serial, version: '6.5.3' },
});

describe('uploadErrorReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.clearAll();
    window.FLUX.version = '2.6.0';
    __setMockOS('MacOS');
    mockGetInstallationId.mockReturnValue('install-1');
    mockGetOutput.mockReturnValue(['bug report text']);
    mockCurrentDevice.mockReturnValue(idleDevice());
    mockMeetRequirement.mockReturnValue(true);
    mockGetLogsTexts.mockResolvedValue({
      'fluxrobotd.log': [new Blob(['robot'])],
      'playerd.log': ['x', new Blob(['player'])],
    });
    mockPost.mockResolvedValue({ data: { status: 'ok' } });
  });

  test('posts the bundle with every field and records the upload', async () => {
    await expect(uploadErrorReport({ errorCode: 'HARDWARE_ERROR_OVERHEAT' })).resolves.toBe('sent');

    expect(mockPost).toHaveBeenCalledTimes(1);

    const [url, form] = mockPost.mock.calls[0];

    expect(url).toBe(ERROR_REPORT_ENDPOINT);
    expect(fields(form)).toEqual({
      app_version: '2.6.0',
      bug_report: 'blob:text/plain',
      error_code: 'HARDWARE_ERROR_OVERHEAT',
      firmware_version: '6.5.3',
      installation_id: 'install-1',
      occurrences_since_last: '0',
      os: 'MacOS',
      serial: 'SN12345678',
      system_log: 'blob:text/plain',
    });
    expect(mockGetOutput).toHaveBeenCalledWith({
      includeImages: false,
      maxBackendLogLength: MAX_BUG_REPORT_LENGTH,
      scrub: true,
    });
    expect(mockGetLogsTexts).toHaveBeenCalledWith(['playerd.log', 'fluxrobotd.log']);
    // headers + 'robot' + 'player'; jsdom blobs have no text(), so compare sizes
    expect((form.get('system_log') as Blob).size).toBe(
      '\n===\nfluxrobotd.log\n===\nrobot\n===\nplayerd.log\n===\nplayer'.length,
    );
    expect(storage.get('error-report-counter')).toMatchObject({ counts: { SN12345678: 1 } });
  });

  test('no device: serial none, no system_log, old player log name never requested', async () => {
    mockCurrentDevice.mockReturnValue(undefined);

    await expect(uploadErrorReport({ errorCode: '#802' })).resolves.toBe('sent');

    const form = mockPost.mock.calls[0][1] as FormData;

    expect(form.get('serial')).toBe('none');
    expect(form.get('firmware_version')).toBe('');
    expect(form.has('system_log')).toBe(false);
    expect(mockGetLogsTexts).not.toHaveBeenCalled();
  });

  test('busy device: system_log skipped, upload still sent', async () => {
    mockCurrentDevice.mockReturnValue({ ...idleDevice(), control: { getMode: () => 'raw' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect((mockPost.mock.calls[0][1] as FormData).has('system_log')).toBe(false);
  });

  test('device log failure is logged and does not block the upload', async () => {
    mockGetLogsTexts.mockRejectedValue(new Error('timeout'));

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('device log skipped'));
  });

  test('scene is attached as svg with its name', async () => {
    await uploadErrorReport({ errorCode: '#806', scene: { content: '<svg/>', name: 'output.bvg' } });

    const form = mockPost.mock.calls[0][1] as FormData;

    expect((form.get('scene') as File).name).toBe('output.bvg');
    expect(fields(form).scene).toBe('blob:image/svg+xml');
  });

  test('retries up to 3 times, then fails silently without recording', async () => {
    mockPost.mockRejectedValue(new Error('network'));

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('failed');
    expect(mockPost).toHaveBeenCalledTimes(3);
    expect(storage.get('error-report-counter')).toBeUndefined();
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('upload failed'));
  });

  test('succeeds on the second attempt', async () => {
    mockPost.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ data: { status: 'ok' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  test('duplicate counts as sent for throttle and cooldown', async () => {
    mockPost.mockResolvedValue({ data: { status: 'duplicate' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('duplicate');
    expect(storage.get('error-report-counter')).toMatchObject({ counts: { SN12345678: 1 } });
  });

  test('second occurrence inside the cooldown is skipped, counted, and carried on the next upload', async () => {
    await uploadErrorReport({ errorCode: 'X' });
    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('cooldown');
    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('cooldown');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockAppend).toHaveBeenCalledWith('error-report skipped (cooldown) X');

    const cooldown = storage.get('error-report-cooldown');
    const [fingerprint] = Object.keys(cooldown);

    cooldown[fingerprint].nextAllowed = Date.now() - 1;
    storage.set('error-report-cooldown', cooldown);

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect((mockPost.mock.calls[1][1] as FormData).get('occurrences_since_last')).toBe('2');
  });

  test('never throws, even when report building itself explodes', async () => {
    mockGetOutput.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('failed');
    expect(mockPost).not.toHaveBeenCalled();
  });
});
