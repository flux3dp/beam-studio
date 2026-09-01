import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import { getPromarkInfo, setPromarkInfo } from '@core/helpers/device/promark/promark-info';

const mockChangeWorkarea = jest.fn();
const mockClearScene = jest.fn();
const mockIsInnerEngravingActive = jest.fn();

jest.mock('@core/app/stores/documentStore');
jest.mock(
  '@core/app/svgedit/operations/changeWorkarea',
  () =>
    (...args) =>
      mockChangeWorkarea(...args),
);
jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  isInnerEngravingActive: () => mockIsInnerEngravingActive(),
}));
jest.mock('@core/helpers/device/promark/promark-info');
jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => callback({ Editor: { clearScene: () => mockClearScene() } }),
}));

import { switchInnerEngravingMode } from './innerEngravingMode';

const desktopInfo = { laserType: LaserType.Desktop, watt: 20 } as const;
const uvInfo = { laserType: LaserType.UV, watt: 5 } as const;

describe('switchInnerEngravingMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClearScene.mockResolvedValue(true);
    mockIsInnerEngravingActive.mockReturnValue(false);
    setPromarkInfo(desktopInfo);
    useDocumentStore.setState({ 'inner-engraving': false, workarea: 'fbb1b' });
  });

  test('applies the fpm1 work area and UV PromarkInfo after clearing the document', async () => {
    await expect(switchInnerEngravingMode(true, { promarkInfo: uvInfo, workarea: 'fpm1' })).resolves.toBe(true);

    expect(mockClearScene).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenCalledWith('fpm1');
    expect(getPromarkInfo()).toEqual(uvInfo);
    expect(useDocumentStore.getState()['inner-engraving']).toBe(true);
  });

  test('does not change the work area, laser source, or mode when clearing is cancelled', async () => {
    mockClearScene.mockResolvedValue(false);

    await expect(switchInnerEngravingMode(true, { promarkInfo: uvInfo, workarea: 'fpm1' })).resolves.toBe(false);

    expect(mockChangeWorkarea).not.toHaveBeenCalled();
    expect(getPromarkInfo()).toEqual(desktopInfo);
    expect(useDocumentStore.getState()['inner-engraving']).toBe(false);
  });
});
