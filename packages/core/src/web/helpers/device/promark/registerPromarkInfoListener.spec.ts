import { LaserType } from '@core/app/constants/promark-constants';
import { useDocumentStore } from '@core/app/stores/documentStore';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { registerPromarkInfoListener } from './registerPromarkInfoListener';

jest.mock('@core/app/stores/documentStore');

const mockGetPromarkInfo = jest.fn();

jest.mock('./promark-info', () => ({ getPromarkInfo: () => mockGetPromarkInfo() }));

const mockIsInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/addOn/innerEngraving', () => ({ isInnerEngravingActive: () => mockIsInnerEngravingActive() }));

const mockPostPresetChange = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({ postPresetChange: () => mockPostPresetChange() }));

const mockSyncUvLayerFrequency = jest.fn();

jest.mock('@core/helpers/layer/syncUvLayerFrequency', () => ({
  syncUvLayerFrequency: () => mockSyncUvLayerFrequency(),
}));

const desktop = { laserType: LaserType.Desktop, watt: 20 };
const uv = { laserType: LaserType.UV, watt: 5 };
const emit = () => eventEmitterFactory.createEventEmitter('canvas').emit('promark-info-changed');

describe('registerPromarkInfoListener', () => {
  let unregister: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsInnerEngravingActive.mockReturnValue(false);
    mockGetPromarkInfo.mockReturnValue(desktop);
    useDocumentStore.setState({
      'customized-dimension': { fpm1: { height: 110, width: 110 } },
      'inner-engraving': false,
      workarea: 'fpm1',
    });
  });

  afterEach(() => unregister?.());

  test('a switch to UV resizes an incompatible field, syncs the layers once and re-applies the presets', () => {
    unregister = registerPromarkInfoListener();
    mockGetPromarkInfo.mockReturnValue(uv);
    emit();

    expect(useDocumentStore.getState()['customized-dimension'].fpm1).toEqual({ height: 70, width: 70 });
    expect(mockSyncUvLayerFrequency).toHaveBeenCalledTimes(1);
    expect(mockPostPresetChange).toHaveBeenCalledTimes(1);

    // the next change on the same source re-applies the presets only
    emit();
    expect(mockSyncUvLayerFrequency).toHaveBeenCalledTimes(1);
    expect(mockPostPresetChange).toHaveBeenCalledTimes(2);
  });

  test('a compatible field is kept, and a non-UV source only re-applies the presets', () => {
    useDocumentStore.setState({ 'customized-dimension': { fpm1: { height: 150, width: 150 } } });
    unregister = registerPromarkInfoListener();
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.MOPA, watt: 60 });
    emit();

    expect(useDocumentStore.getState()['customized-dimension'].fpm1).toEqual({ height: 150, width: 150 });
    expect(mockSyncUvLayerFrequency).not.toHaveBeenCalled();
    expect(mockPostPresetChange).toHaveBeenCalledTimes(1);
  });

  test('a 3D document keeps its field and its layers', () => {
    useDocumentStore.setState({ 'customized-dimension': { fpm1: { height: 70, width: 70 } }, 'inner-engraving': true });
    mockIsInnerEngravingActive.mockReturnValue(true);
    unregister = registerPromarkInfoListener();
    mockGetPromarkInfo.mockReturnValue(uv);
    emit();

    expect(useDocumentStore.getState()['customized-dimension'].fpm1).toEqual({ height: 70, width: 70 });
    expect(mockSyncUvLayerFrequency).not.toHaveBeenCalled();
  });

  test('does nothing on another machine, and stops after unregistering', () => {
    useDocumentStore.setState({ workarea: 'fbb1b' });
    unregister = registerPromarkInfoListener();
    mockGetPromarkInfo.mockReturnValue(uv);
    emit();
    expect(mockPostPresetChange).not.toHaveBeenCalled();

    useDocumentStore.setState({ workarea: 'fpm1' });
    unregister();
    emit();
    expect(mockPostPresetChange).not.toHaveBeenCalled();
  });
});
