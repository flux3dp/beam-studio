import storage from '@core/implementations/storage';

const mockGetAll = jest.fn();

jest.mock('@core/helpers/logger', () => () => ({ getAll: () => mockGetAll() }));

const mockReadFile = jest.fn();

jest.mock('@core/implementations/fileSystem', () => ({ readFile: (...args: any[]) => mockReadFile(...args) }));
jest.mock('@core/implementations/os', () => ({ arch: () => 'arm64', release: () => '22.4.0' }));
jest.mock('@core/implementations/dialog', () => ({ writeFileDialog: jest.fn() }));
jest.mock('@core/helpers/api/swiftray-client', () => ({ swiftrayClient: { version: '1.2.3' } }));
jest.mock('@core/app/components/dialogs/PrintAndCut/utils/align/alignLog', () => ({
  getPrintAndCutReport: () => 'pnc-report',
}));

import outputError from './output-error';

const logs = {
  discover: [{ 'uuid-1': { model: 'fbb2', name: "Alice's Beambox", serial: 'SN1' } }],
  generic: 'generic',
  swiftray: 'swiftray',
  websocket: [{ log: ['> select_font /Users/alice/Library/Fonts/a.ttf string'], url: '/ws/utils' }],
};

describe('getOutput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.clearAll();
    storage.set('recent_files', ['/Users/alice/Desktop/a.beam']);
    storage.set('auto-save-config', { directory: 'C:\\Users\\alice\\Documents', enabled: true } as any);
    storage.set('active-lang', 'en');
    mockGetAll.mockReturnValue(logs);
    window.FLUX.logFile = '/tmp/backend.log';
    window.electron = {} as any;
    mockReadFile.mockReturnValue('line1 /Users/alice/Library/Preferences/\nline2\nline3');
  });

  test('without scrub the report is complete and keeps user paths and machine names', () => {
    const text = outputError.getOutput().join('');

    expect(text).toContain('recent_files=["/Users/alice/Desktop/a.beam"]');
    expect(text).toContain("Alice's Beambox");
    expect(text).toContain('select_font /Users/alice/Library/Fonts/a.ttf');
    expect(text).toContain('line1 /Users/alice/Library/Preferences/');
  });

  test('with scrub the denylisted keys are gone, names become models and home paths become ~', () => {
    const text = outputError.getOutput({ scrub: true }).join('');

    expect(text).not.toContain('recent_files');
    expect(text).not.toContain('auto-save-config');
    expect(text).toContain('active-lang=en');
    expect(text).not.toContain('Alice');
    expect(text).toContain('"name": "fbb2"');
    expect(text).toContain('select_font ~/Library/Fonts/a.ttf');
    expect(text).toContain('line1 ~/Library/Preferences/');
    expect(text).not.toContain('/Users/alice');
  });

  test('maxLength caps the whole report and the fluxghost log absorbs the cut, newest lines kept', () => {
    const rest = outputError.getOutput({ maxLength: 0 }).join('');
    const text = outputError.getOutput({ maxLength: rest.length + 'line2\nline3'.length }).join('');

    expect(rest).toContain('======::backend::======\n[... truncated for upload ...]\n\n\n======::ws::======');
    expect(text).toContain('======::backend::======\n[... truncated for upload ...]\nline2\nline3');
    expect(text).not.toContain('line1');
    expect(text.length).toBeLessThanOrEqual(rest.length + 'line2\nline3'.length);
  });

  test('a backend log within the limit is not marked', () => {
    const text = outputError.getOutput({ maxLength: 100_000 }).join('');

    expect(text).not.toContain('truncated');
    expect(text).toContain('line1');
  });
});
