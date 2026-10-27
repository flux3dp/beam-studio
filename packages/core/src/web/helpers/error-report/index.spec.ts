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
  info: { serial, uuid: 'uuid-1', version: '6.5.3' },
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
      maxLength: MAX_BUG_REPORT_LENGTH,
      scrub: true,
    });
    expect(mockGetLogsTexts).toHaveBeenCalledWith(['playerd.log', 'fluxrobotd.log'], undefined, 10_000);
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

  test.each(['#802', '#806', '#809', 'QR_AUTOCONNECT_FAILED'])(
    'explicit no device for %s: ignores the connected machine and uses a separate throttle',
    async (errorCode) => {
      await expect(uploadErrorReport({ errorCode })).resolves.toBe('sent');
      mockPost.mockClear();
      mockGetLogsTexts.mockClear();

      await expect(uploadErrorReport({ device: null, errorCode })).resolves.toBe('sent');

      const form = mockPost.mock.calls[0][1] as FormData;

      expect(form.get('serial')).toBe('none');
      expect(form.get('firmware_version')).toBe('');
      expect(form.has('system_log')).toBe(false);
      expect(mockGetLogsTexts).not.toHaveBeenCalled();
      expect(storage.get('error-report-counter')).toMatchObject({ counts: { none: 1, SN12345678: 1 } });
      await expect(uploadErrorReport({ device: null, errorCode })).resolves.toBe('cooldown');
      expect(mockPost).toHaveBeenCalledTimes(1);
    },
  );

  test('busy device: system_log skipped, upload still sent', async () => {
    mockCurrentDevice.mockReturnValue({ ...idleDevice(), control: { getMode: () => 'raw' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect((mockPost.mock.calls[0][1] as FormData).has('system_log')).toBe(false);
  });

  test('a log that failed to download is noted in system_log in its place', async () => {
    mockGetLogsTexts.mockResolvedValue({
      'fluxrobotd.log': [new Blob(['robot'])],
      'playerd.log': ['<playerd.log not downloaded: TIMEOUT>\n'],
    });

    await uploadErrorReport({ errorCode: 'X' });

    const form = mockPost.mock.calls[0][1] as FormData;

    expect((form.get('system_log') as Blob).size).toBe(
      '\n===\nfluxrobotd.log\n===\nrobot\n===\nplayerd.log\n===\n<playerd.log not downloaded: TIMEOUT>\n'.length,
    );
  });

  test('device override: its serial and firmware are used, log of another machine never read', async () => {
    await expect(
      uploadErrorReport({
        device: { serial: 'SN-OTHER', uuid: 'uuid-2', version: '5.0.0' } as any,
        errorCode: 'CONNECTION_TIMEOUT',
      }),
    ).resolves.toBe('sent');

    const form = mockPost.mock.calls[0][1] as FormData;

    expect(form.get('serial')).toBe('SN-OTHER');
    expect(form.get('firmware_version')).toBe('5.0.0');
    expect(form.has('system_log')).toBe(false);
    expect(mockGetLogsTexts).not.toHaveBeenCalled();
  });

  test('device log failure is logged and does not block the upload', async () => {
    mockGetLogsTexts.mockRejectedValue(new Error('timeout'));

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('device log skipped'));
  });

  // backend limits: 10 MB per file, 20 MB per request (backend.md §2)
  const MB = 1024 * 1024;
  const size = (form: FormData, field: string) => (form.get(field) as Blob | null)?.size ?? null;

  test('bug_report over 10 MB is clipped to its newest 10 MB', async () => {
    mockGetOutput.mockReturnValue(['x'.repeat(11 * MB)]);

    await uploadErrorReport({ errorCode: 'X' });

    expect(size(mockPost.mock.calls[0][1], 'bug_report')).toBe(10 * MB);
  });

  test('scene over 10 MB is dropped, the rest still uploads', async () => {
    await uploadErrorReport({ errorCode: '#806', scene: () => ({ content: 'x'.repeat(10 * MB + 1), name: 's.bvg' }) });

    const form = mockPost.mock.calls[0][1] as FormData;

    expect(form.get('scene')).toBeNull();
    expect(size(form, 'system_log')).toBeGreaterThan(0);
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('scene dropped'));
  });

  test('system_log takes what the 20 MB request has left after bug_report and scene', async () => {
    mockGetOutput.mockReturnValue(['x'.repeat(10 * MB)]);
    mockGetLogsTexts.mockResolvedValue({ 'fluxrobotd.log': [new Blob(['y'.repeat(5 * MB)])] });

    await uploadErrorReport({ errorCode: '#806', scene: () => ({ content: 'z'.repeat(8 * MB), name: 's.bvg' }) });

    const form = mockPost.mock.calls[0][1] as FormData;

    expect(size(form, 'scene')).toBe(8 * MB);
    expect(size(form, 'system_log')).toBe(2 * MB - 64 * 1024);
  });

  test('system_log is dropped when bug_report and scene leave no room', async () => {
    mockGetOutput.mockReturnValue(['x'.repeat(10 * MB)]);

    await uploadErrorReport({
      errorCode: '#806',
      scene: () => ({ content: 'z'.repeat(10 * MB - 64 * 1024), name: 's.bvg' }),
    });

    const form = mockPost.mock.calls[0][1] as FormData;

    expect(size(form, 'scene')).toBe(10 * MB - 64 * 1024);
    expect(form.get('system_log')).toBeNull();
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('device log dropped'));
  });

  test('export without a device still attaches the scene while another machine is connected', async () => {
    await uploadErrorReport({
      device: null,
      errorCode: '#806',
      scene: () => ({ content: '<svg/>', name: 'output.bvg' }),
    });

    const form = mockPost.mock.calls[0][1] as FormData;

    expect((form.get('scene') as File).name).toBe('output.bvg');
    expect(fields(form).scene).toBe('blob:image/svg+xml');
    expect(form.get('serial')).toBe('none');
    expect(form.get('firmware_version')).toBe('');
    expect(form.has('system_log')).toBe(false);
    expect(mockGetLogsTexts).not.toHaveBeenCalled();
  });

  test('scene thunk is not called for a blocked upload', async () => {
    const scene = jest.fn(() => ({ content: '<svg/>', name: 'output.bvg' }));

    // first upload starts the cooldown window for this fingerprint
    await expect(uploadErrorReport({ errorCode: '#806' })).resolves.toBe('sent');
    await expect(uploadErrorReport({ errorCode: '#806', scene })).resolves.toBe('cooldown');
    expect(scene).not.toHaveBeenCalled();
  });

  // axiosFluxId never rejects: its interceptor resolves with { error } (flux-id/base.ts)
  test('retries a network failure up to 3 times, then fails silently without recording', async () => {
    mockPost.mockResolvedValue({ error: { code: 'ECONNABORTED' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('failed');
    expect(mockPost).toHaveBeenCalledTimes(3);
    expect(mockPost).toHaveBeenCalledWith(ERROR_REPORT_ENDPOINT, expect.any(FormData), { timeout: 180_000 });
    expect(storage.get('error-report-counter')).toBeUndefined();
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('HTTP ECONNABORTED'));
  });

  test('succeeds on the second attempt after a 5xx', async () => {
    mockPost
      .mockResolvedValueOnce({ error: { response: { status: 503 } } })
      .mockResolvedValueOnce({ data: { status: 'ok' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('sent');
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  test.each([400, 413, 429])('does not retry a %d', async (status) => {
    mockPost.mockResolvedValue({ error: { response: { data: { status: 'budget' }, status } } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('failed');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining(`HTTP ${status} {"status":"budget"}`));
  });

  test('does not retry an unknown 2xx body', async () => {
    mockPost.mockResolvedValue({ data: { status: 'what' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('failed');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  test('duplicate counts as sent for throttle and cooldown', async () => {
    mockPost.mockResolvedValue({ data: { status: 'duplicate' } });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('duplicate');
    expect(storage.get('error-report-counter')).toMatchObject({ counts: { SN12345678: 1 } });
  });

  test('a second popup while the same report is still uploading is skipped as cooldown', async () => {
    let release!: (value: { data: { status: 'ok' } }) => void;

    mockPost.mockReturnValueOnce(new Promise((resolve) => (release = resolve)));

    const first = uploadErrorReport({ errorCode: 'X' });

    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('cooldown');
    await expect(uploadErrorReport({ errorCode: 'X' })).resolves.toBe('cooldown');

    release({ data: { status: 'ok' } });
    await expect(first).resolves.toBe('sent');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(storage.get('error-report-counter')).toMatchObject({ counts: { SN12345678: 1 } });
    // the cooldown entry only exists after the upload; the two in-flight skips are added to it then
    expect(Object.values(storage.get('error-report-cooldown'))[0]).toMatchObject({ skipped: 2 });
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
