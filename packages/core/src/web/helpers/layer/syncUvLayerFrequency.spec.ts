import { syncUvLayerFrequency } from './syncUvLayerFrequency';

const mockGetAllLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({ getAllLayers: () => mockGetAllLayers() }));

const mockGetAllPresets = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({ getAllPresets: () => mockGetAllPresets() }));

const mockGetData = jest.fn();
const mockWriteDataLayer = jest.fn();

jest.mock('./layer-config-helper', () => ({
  getData: (...args: unknown[]) => mockGetData(...args),
  writeDataLayer: (...args: unknown[]) => mockWriteDataLayer(...args),
}));

const makeLayer = (values: Record<string, unknown>) => {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  return { group, layer: { getGroup: () => group }, values };
};

describe('syncUvLayerFrequency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllPresets.mockReturnValue([
      { isDefault: true, key: 'wood_3mm_cutting', name: 'Wood - 3mm Cutting' },
      { isDefault: false, name: 'My Custom' },
    ]);
  });

  test('derives the frequency from the power and rewrites the power the frequency stands for', () => {
    const custom = makeLayer({ configName: 'My Custom', power: 15 });
    const unnamed = makeLayer({ configName: undefined, power: 100 });

    mockGetAllLayers.mockReturnValue([custom.layer, unnamed.layer]);
    mockGetData.mockImplementation((group: Element, key: string) =>
      group === custom.group ? custom.values[key] : unnamed.values[key],
    );

    syncUvLayerFrequency();

    // 15% is below the weakest UV output: the frequency tops out at 200 kHz and the power follows
    expect(mockWriteDataLayer).toHaveBeenCalledWith(custom.group, 'frequency', 200);
    expect(mockWriteDataLayer).toHaveBeenCalledWith(custom.group, 'power', expect.closeTo(15.56, 1));
    // 100% is 40 kHz
    expect(mockWriteDataLayer).toHaveBeenCalledWith(unnamed.group, 'frequency', 40);
    expect(mockWriteDataLayer).toHaveBeenCalledWith(unnamed.group, 'power', 100);
  });

  test('100% keeps a frequency already in the 30–40kHz band', () => {
    const layer = makeLayer({ configName: undefined, frequency: 35, power: 100 });

    mockGetAllLayers.mockReturnValue([layer.layer]);
    mockGetData.mockImplementation((_group: Element, key: string) => layer.values[key]);

    syncUvLayerFrequency();

    expect(mockWriteDataLayer).toHaveBeenCalledWith(layer.group, 'frequency', 35);
    expect(mockWriteDataLayer).toHaveBeenCalledWith(layer.group, 'power', 100);
  });

  test('leaves a layer on a default preset to postPresetChange', () => {
    const preset = makeLayer({ configName: 'wood_3mm_cutting', power: 60 });

    mockGetAllLayers.mockReturnValue([preset.layer]);
    mockGetData.mockImplementation((_group: Element, key: string) => preset.values[key]);

    syncUvLayerFrequency();

    expect(mockWriteDataLayer).not.toHaveBeenCalled();
  });
});
