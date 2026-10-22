const mockCreateNewFitText = jest.fn();
const mockCreateNewText = jest.fn();
const mockImportTextAsStl = jest.fn();
const mockSetMouseMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/mouseMode', () => ({
  setMouseMode: (...args: unknown[]) => mockSetMouseMode(...args),
}));
jest.mock(
  '@core/app/svgedit/text/createNewText',
  () =>
    (...args: unknown[]) =>
      mockCreateNewText(...args),
);
jest.mock('@core/app/svgedit/text/fitText', () => ({
  createNewFitText: (...args: unknown[]) => mockCreateNewFitText(...args),
}));
jest.mock('@core/app/svgedit/workarea', () => ({ height: 800, width: 1000 }));
jest.mock(
  './importText',
  () =>
    (...args: unknown[]) =>
      mockImportTextAsStl(...args),
);

import insertDefaultTextAsStl from './insertDefaultText';

describe('insertDefaultTextAsStl', () => {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateNewFitText.mockReturnValue(text);
    mockCreateNewText.mockReturnValue(text);
    mockImportTextAsStl.mockResolvedValue(true);
  });

  test('creates standard Text directly with fixed initial content', async () => {
    await expect(insertDefaultTextAsStl('text')).resolves.toBe(true);

    expect(mockSetMouseMode).toHaveBeenCalledWith('select');
    expect(mockCreateNewText).toHaveBeenCalledWith(500, 400, { addToHistory: true, text: 'Text' });
    expect(mockImportTextAsStl).toHaveBeenCalledWith(text);
  });

  test('creates FitText directly with fixed initial content', async () => {
    await expect(insertDefaultTextAsStl('fit-text')).resolves.toBe(true);

    expect(mockSetMouseMode).toHaveBeenCalledWith('select');
    expect(mockCreateNewFitText).toHaveBeenCalledWith(500, 400, { addToHistory: true, text: 'Text' });
    expect(mockImportTextAsStl).toHaveBeenCalledWith(text);
  });
});
