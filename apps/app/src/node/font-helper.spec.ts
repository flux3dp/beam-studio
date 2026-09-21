import { FontEvents } from '@core/app/constants/ipcEvents';

const mockOn = jest.fn();

jest.mock('electron', () => ({ ipcMain: { on: (...args: unknown[]) => mockOn(...args) } }));

const thin = {
  family: 'Noto Sans Mono',
  italic: false,
  path: '/fonts/NotoSansMono-Thin.ttf',
  postscriptName: 'NotoSansMono-Thin',
  style: 'Thin',
  weight: 400, // what font-scanner reports on mac for usWeightClass 250
};

const mockFindFontSync = jest.fn(() => thin);

jest.mock('font-scanner', () => ({
  findFontSync: () => mockFindFontSync(),
  getAvailableFontsSync: () => [thin],
}));

const variableThin = { ...thin, path: '/fonts/NotoSansMono-Variable.ttf', postscriptName: 'NotoSansMono-Regular_Thin' };

const mockOpenSync = jest.fn((path: string) =>
  path.includes('Variable')
    ? { namedVariations: { Thin: { wght: 100 } }, 'OS/2': { usWeightClass: 400 } }
    : { 'OS/2': { usWeightClass: 250 }, postscriptName: 'NotoSansMono-Thin' },
);

jest.mock('fontkit', () => ({ openSync: (path: string) => mockOpenSync(path) }));

const invoke = (event: string, ...args: unknown[]) => {
  const handler = mockOn.mock.calls.find(([name]) => name === event)![1];
  const ipcEvent: { returnValue?: unknown } = {};

  handler(ipcEvent, ...args);

  return ipcEvent.returnValue;
};

describe('font-helper OS/2 weight correction', () => {
  const platform = process.platform;

  beforeAll(() => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    require('./font-helper').default.registerEvents();
  });

  afterAll(() => Object.defineProperty(process, 'platform', { value: platform }));

  it('replaces font-scanner weight with usWeightClass for FindFont and FindFonts', () => {
    invoke(FontEvents.GetAvailableFonts); // fills the cache FindFonts reads
    expect(invoke(FontEvents.FindFont, { postscriptName: 'NotoSansMono-Thin' })).toMatchObject({ weight: 250 });
    expect(invoke(FontEvents.FindFonts, { family: 'Noto Sans Mono' })).toEqual([
      expect.objectContaining({ weight: 250 }),
    ]);
    expect(mockOpenSync).toHaveBeenCalledTimes(1); // cached per file
  });

  it('uses the named instance weight for a variable font', () => {
    mockFindFontSync.mockReturnValueOnce(variableThin);
    expect(invoke(FontEvents.FindFont, { postscriptName: 'NotoSansMono-Regular_Thin' })).toMatchObject({ weight: 100 });
  });
});
