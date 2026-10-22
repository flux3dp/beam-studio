const mockCollectStlObjects = jest.fn();
const mockGetLayerByName = jest.fn();
const mockRemoveLayerByName = jest.fn();
const mockSyncStlObjectsWithDom = jest.fn();

jest.mock('@core/app/svgedit/stl/sync', () => ({
  collectStlObjects: (...args: any[]) => mockCollectStlObjects(...args),
  syncStlObjectsWithDom: (...args: any[]) => mockSyncStlObjectsWithDom(...args),
}));

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getLayerByName: (...args: any[]) => mockGetLayerByName(...args),
  removeLayerByName: (...args: any[]) => mockRemoveLayerByName(...args),
}));

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: jest.fn(),
  InsertElementCommand: jest.fn(),
}));

jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: jest.fn() }));
jest.mock('@core/app/svgedit/layer/layer', () => jest.fn());
jest.mock('@core/app/svgedit/selection', () => ({ clearSelection: jest.fn() }));
jest.mock('../i18n', () => ({
  __esModule: true,
  default: { lang: { beambox: { right_panel: { layer_panel: { layer1: 'Layer 1' } } } } },
}));
jest.mock('./layer-config-helper', () => ({ initLayerConfig: jest.fn() }));

import { deleteLayerByName } from './deleteLayer';

describe('deleteLayerByName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('synchronizes nested 3D objects when deleting, undoing, or redoing a layer', () => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const command: { onAfter?: () => void } = {};
    const object = { id: 'mesh' };

    mockGetLayerByName.mockReturnValue({ getGroup: () => group });
    mockRemoveLayerByName.mockReturnValue(command);
    mockCollectStlObjects.mockReturnValue([object]);

    expect(deleteLayerByName('Layer 1')).toBe(command);
    expect(mockCollectStlObjects).toHaveBeenCalledWith([group]);
    expect(mockRemoveLayerByName).toHaveBeenCalledWith('Layer 1', {});
    expect(mockSyncStlObjectsWithDom).toHaveBeenCalledWith([object]);

    mockSyncStlObjectsWithDom.mockClear();
    command.onAfter?.();
    expect(mockSyncStlObjectsWithDom).toHaveBeenCalledWith([object]);
  });
});
