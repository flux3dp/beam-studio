import { FontEvents } from '@core/app/constants/ipcEvents';

const mockOn = jest.fn();

jest.mock('electron', () => ({ ipcMain: { on: (...args: unknown[]) => mockOn(...args) } }));

// A non-standard style name, so the weight has to come from the file.
const w2 = {
  family: 'Some Font',
  italic: false,
  path: '/fonts/SomeFont-W2.ttf',
  postscriptName: 'SomeFont-W2',
  style: 'W2',
  weight: 400, // what font-scanner reports on mac for usWeightClass 250
};
const variableW1 = { ...w2, path: '/fonts/SomeFont-Variable.ttf', postscriptName: 'SomeFont-Regular_W1', style: 'W1' };
const extraLight = {
  ...w2,
  path: '/fonts/SomeFont-ExtraLight.ttf',
  postscriptName: 'SomeFont-ExtraLight',
  style: 'ExtraLight',
};

const mockFindFontSync = jest.fn(() => w2);

jest.mock('font-scanner', () => ({
  findFontSync: () => mockFindFontSync(),
  getAvailableFontsSync: () => [w2, extraLight],
}));

const mockOpenSync = jest.fn((path: string) =>
  path.includes('Variable')
    ? { namedVariations: { W1: { wght: 100 } }, 'OS/2': { usWeightClass: 400 } }
    : { 'OS/2': { usWeightClass: 250 }, postscriptName: 'SomeFont-W2' },
);

jest.mock('fontkit', () => ({ openSync: (path: string) => mockOpenSync(path) }));

const invoke = (event: string, ...args: unknown[]) => {
  const handler = mockOn.mock.calls.find(([name]) => name === event)![1];
  const ipcEvent: { returnValue?: unknown } = {};

  handler(ipcEvent, ...args);

  return ipcEvent.returnValue;
};

describe('font-helper weight resolution', () => {
  beforeAll(() => {
    require('./font-helper').default.registerEvents();
  });

  beforeEach(() => mockOpenSync.mockClear());

  it('reads usWeightClass from the file when the style name is not standard', () => {
    invoke(FontEvents.GetAvailableFonts); // fills the cache FindFonts reads
    expect(invoke(FontEvents.FindFont, { postscriptName: 'SomeFont-W2' })).toMatchObject({ weight: 250 });
    expect(invoke(FontEvents.FindFonts, { family: 'Some Font' })).toEqual([
      expect.objectContaining({ style: 'W2', weight: 250 }),
      expect.objectContaining({ style: 'ExtraLight', weight: 200 }),
    ]);
    expect(mockOpenSync).toHaveBeenCalledTimes(1); // cached per file, never opened for ExtraLight
  });

  it('uses the named instance weight for a variable font', () => {
    mockFindFontSync.mockReturnValueOnce(variableW1);
    expect(invoke(FontEvents.FindFont, { postscriptName: 'SomeFont-Regular_W1' })).toMatchObject({ weight: 100 });
  });

  it('derives the weight from a standard style name without opening the file, even in the full list', () => {
    expect(invoke(FontEvents.GetAvailableFonts)).toEqual([
      expect.objectContaining({ style: 'W2', weight: 400 }),
      expect.objectContaining({ style: 'ExtraLight', weight: 200 }),
    ]);
    expect(mockOpenSync).not.toHaveBeenCalled();
  });
});
