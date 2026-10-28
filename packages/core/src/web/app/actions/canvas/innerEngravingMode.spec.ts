import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';

const mockChangeWorkarea = jest.fn();
const mockClearScene = jest.fn();
const mockDisableOtherExclusiveModes = jest.fn();
const mockIsInnerEngravingActive = jest.fn();
const mockInitLayerConfig = jest.fn();
const mockGetAllLayers = jest.fn();

jest.mock('@core/app/stores/documentStore');
jest.mock(
  '@core/app/svgedit/operations/changeWorkarea',
  () =>
    (...args) =>
      mockChangeWorkarea(...args),
);
jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  ...jest.requireActual('@core/helpers/addOn/innerEngraving'),
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));
jest.mock('@core/helpers/device/promark/promark-info');
jest.mock('@core/helpers/exclusiveModes', () => ({
  disableOtherExclusiveModes: (...args) => mockDisableOtherExclusiveModes(...args),
}));
jest.mock('@core/app/svgedit/layer/layerManager', () => ({ getAllLayers: () => mockGetAllLayers() }));
jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  attributeMap: { stlLayerSpacing: 'data-stl-layer-spacing', stlMode: 'data-stl-mode' },
  initLayerConfig: (...args) => mockInitLayerConfig(...args),
  innerEngravingConfigKeys: ['stlMode', 'stlLayerSpacing'],
}));
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => callback({ Editor: { clearScene: () => mockClearScene() } }),
}));

import { switchInnerEngravingMode } from './innerEngravingMode';

const desktopInfo = { laserType: LaserType.Desktop, watt: 20 } as const;
const uvInfo = { laserType: LaserType.UV, watt: 5 } as const;

describe('switchInnerEngravingMode', () => {
  let layerGroup: SVGGElement;

  beforeEach(() => {
    jest.clearAllMocks();
    layerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mockGetAllLayers.mockReturnValue([{ getGroup: () => layerGroup }]);
    mockClearScene.mockResolvedValue(true);
    mockIsInnerEngravingActive.mockReturnValue(false);
    setPromarkInfo(desktopInfo);
    useDocumentStore.setState({
      'customized-dimension': { fpm1: { height: 110, width: 110 } },
      'inner-engraving': false,
      workarea: 'fbb1b',
    });
  });

  test('applies the fpm1 work area and UV PromarkInfo after clearing the document', async () => {
    await expect(switchInnerEngravingMode(true, { promarkInfo: uvInfo, workarea: 'fpm1' })).resolves.toBe(true);

    expect(mockClearScene).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenCalledWith('fpm1');
    // the rotary and the other coordinate-space modes go off with the switch
    expect(mockDisableOtherExclusiveModes).toHaveBeenCalledWith('inner-engraving');
    expect(getPromarkInfo()).toEqual(uvInfo);
    expect(useDocumentStore.getState()['customized-dimension'].fpm1).toEqual({ height: 70, width: 70 });
    expect(useDocumentStore.getState()['inner-engraving']).toBe(true);
  });

  test('initialises the first layer again once the mode, laser source and work area are applied', async () => {
    // clearScene creates the layer with the old document's defaults; the second initialisation
    // must see the new mode, so it has to run after the switch
    mockInitLayerConfig.mockImplementationOnce(() => {
      expect(useDocumentStore.getState()['inner-engraving']).toBe(true);
      expect(getPromarkInfo()).toEqual(uvInfo);
      expect(mockChangeWorkarea).toHaveBeenCalledWith('fpm1');
    });

    await switchInnerEngravingMode(true, { promarkInfo: uvInfo, workarea: 'fpm1' });

    expect(mockInitLayerConfig).toHaveBeenCalledTimes(1);
    expect(mockInitLayerConfig).toHaveBeenCalledWith(layerGroup);
  });

  test('drops the inner engraving keys from the first layer when leaving the mode', async () => {
    mockIsInnerEngravingActive.mockReturnValue(true);
    useDocumentStore.setState({ 'inner-engraving': true, workarea: 'fpm1' });
    layerGroup.setAttribute('data-stl-mode', 'line');
    layerGroup.setAttribute('data-stl-layer-spacing', '0.04');
    layerGroup.setAttribute('data-speed', '180');

    await expect(switchInnerEngravingMode(false)).resolves.toBe(true);

    expect(useDocumentStore.getState()['inner-engraving']).toBe(false);
    expect(layerGroup.hasAttribute('data-stl-mode')).toBe(false);
    expect(layerGroup.hasAttribute('data-stl-layer-spacing')).toBe(false);
    // the 2D defaults are written by initLayerConfig, which runs after the keys are dropped
    expect(mockInitLayerConfig).toHaveBeenCalledWith(layerGroup);
  });

  test('applies the target laser source and work area before initialising the layer when leaving the mode', async () => {
    mockIsInnerEngravingActive.mockReturnValue(true);
    useDocumentStore.setState({ 'inner-engraving': true, workarea: 'fpm1' });
    setPromarkInfo(uvInfo);
    mockInitLayerConfig.mockImplementationOnce(() => {
      expect(getPromarkInfo()).toEqual(desktopInfo);
      expect(mockChangeWorkarea).toHaveBeenCalledWith('fbb1b');
    });

    await expect(switchInnerEngravingMode(false, { promarkInfo: desktopInfo, workarea: 'fbb1b' })).resolves.toBe(true);

    expect(mockInitLayerConfig).toHaveBeenCalledTimes(1);
  });

  test('does not change the work area, laser source, or mode when clearing is cancelled', async () => {
    mockClearScene.mockResolvedValue(false);

    await expect(switchInnerEngravingMode(true, { promarkInfo: uvInfo, workarea: 'fpm1' })).resolves.toBe(false);

    expect(mockChangeWorkarea).not.toHaveBeenCalled();
    expect(getPromarkInfo()).toEqual(desktopInfo);
    expect(useDocumentStore.getState()['inner-engraving']).toBe(false);
  });
});
