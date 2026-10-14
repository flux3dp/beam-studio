import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockGet = jest.fn();

const mockIsDev = jest.fn();

jest.mock('@core/helpers/is-dev', () => ({
  __esModule: true,
  default: () => mockIsDev(),
  isUvDev: () => true,
}));

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  getPromarkLimit: () => ({ frequency: { max: 200, min: 30 } }),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockUseIsPromarkUV = jest.fn();
const mockUseInnerEngravingActive = jest.fn();

jest.mock('@core/helpers/addOn/innerEngraving', () => ({
  useInnerEngravingActive: () => mockUseInnerEngravingActive(),
}));

jest.mock('./usePromarkLimit', () => ({
  useIsPromarkUV: () => mockUseIsPromarkUV(),
}));

const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: mockAddCommandToHistory }));

const mockIsEmpty = jest.fn();
let mockBatchCmd: { isEmpty: jest.Mock; onAfter?: () => void };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  mockBatchCmd = { isEmpty: mockIsEmpty };

  return mockBatchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({ BatchCommand: mockBatchCommand }));

const mockEmit = jest.fn();

const mockOnClose = jest.fn();

const changeValue = (baseElement: HTMLElement) => {
  const fillAngleInput = baseElement.querySelector('#fillAngle');

  fireEvent.change(fillAngleInput, { target: { value: '22.5' } });
  expect(fillAngleInput).toHaveValue('22.5');

  const biDirectionalSwitch = baseElement.querySelector('#biDirectional');

  fireEvent.click(biDirectionalSwitch);
  expect(biDirectionalSwitch).toHaveAttribute('aria-checked', 'false');

  const crossHatchSwitch = baseElement.querySelector('#crossHatch');

  fireEvent.click(crossHatchSwitch);
  expect(crossHatchSwitch).toHaveAttribute('aria-checked', 'true');

  const wobbleSwitch = baseElement.querySelector('#wobble');

  fireEvent.click(wobbleSwitch);
  expect(wobbleSwitch).toHaveAttribute('aria-checked', 'true');

  const lowerFocusSwitch = baseElement.querySelector('#lower-focus');

  fireEvent.click(lowerFocusSwitch);
  expect(lowerFocusSwitch).toHaveAttribute('aria-checked', 'true');
};

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

const mockUseConfigPanelStore = jest.fn();
const mockGetState = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: mockUseConfigPanelStore,
}));

const mockGetSelectedLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getSelectedLayers: () => mockGetSelectedLayers(),
}));

import AdvancedSettingModal from './AdvancedSettingModal';

describe('test AdvancedSettingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue('mm');
    mockIsEmpty.mockReturnValue(false);
    mockGetLayerByName.mockImplementation((layerName: string) => layerName);
    mockCreateEventEmitter.mockReturnValueOnce({ emit: mockEmit });
    mockUseConfigPanelStore.mockReturnValue({
      getState: mockGetState,
      update: mockUpdate,
    });
    mockGetState.mockReturnValue({
      biDirectional: { hasMultiValue: false, value: true },
      crossHatch: { hasMultiValue: false, value: false },
      fillAngle: { hasMultiValue: false, value: 0 },
      fillDwellAdaptive: { hasMultiValue: false, value: false },
      fillDwellTime: { hasMultiValue: false, value: -50000 },
      fillInterleave: { hasMultiValue: false, value: false },
      focus: { hasMultiValue: false, value: -2 },
      focusReverse: { hasMultiValue: false, value: false },
      focusStep: { hasMultiValue: false, value: -2 },
      focusStepReverse: { hasMultiValue: false, value: false },
      repeat: { hasMultiValue: false, value: 2 },
      wobbleDiameter: { hasMultiValue: false, value: -0.2 },
      wobbleStep: { hasMultiValue: false, value: -0.05 },
    });
    mockGetSelectedLayers.mockReturnValue(['layer1', 'layer2']);
    mockUseIsPromarkUV.mockReturnValue(false);
    mockUseInnerEngravingActive.mockReturnValue(false);
    mockIsDev.mockReturnValue(true);
  });

  it('should render correctly', () => {
    const { baseElement } = render(<AdvancedSettingModal onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
  });

  test('save should work', () => {
    const { baseElement, getByText } = render(<AdvancedSettingModal onClose={mockOnClose} />);

    changeValue(baseElement);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();

    const saveButton = getByText('Save');

    fireEvent.click(saveButton);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(12);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'fillAngle', 22.5, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'biDirectional', false, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer1', 'crossHatch', true, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer1', 'wobbleStep', 0.05, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, 'layer1', 'wobbleDiameter', 0.2, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, 'layer1', 'focus', 2, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(7, 'layer2', 'fillAngle', 22.5, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(8, 'layer2', 'biDirectional', false, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(9, 'layer2', 'crossHatch', true, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(10, 'layer2', 'wobbleStep', 0.05, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(11, 'layer2', 'wobbleDiameter', 0.2, { batchCmd: mockBatchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(12, 'layer2', 'focus', 2, { batchCmd: mockBatchCmd });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change advanced setting');
    expect(mockBatchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockBatchCmd);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith({
      biDirectional: { hasMultiValue: false, value: false },
      crossHatch: { hasMultiValue: false, value: true },
      fillAngle: { hasMultiValue: false, value: 22.5 },
      fillDwellAdaptive: { hasMultiValue: false, value: false },
      fillDwellTime: { hasMultiValue: false, value: -50000 },
      fillInterleave: { hasMultiValue: false, value: false },
      focus: { hasMultiValue: false, value: 2 },
      focusReverse: { hasMultiValue: false, value: false },
      focusStep: { hasMultiValue: false, value: -2 },
      focusStepReverse: { hasMultiValue: false, value: false },
      wobbleDiameter: { hasMultiValue: false, value: 0.2 },
      wobbleStep: { hasMultiValue: false, value: 0.05 },
    });
    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('does not show the frequency when the source is not UV', () => {
    const { baseElement } = render(<AdvancedSettingModal onClose={mockOnClose} />);

    expect(baseElement.querySelector('#frequency')).toBeNull();
  });

  test('UV frequency writes the linked power', () => {
    mockUseIsPromarkUV.mockReturnValue(true);
    mockGetState.mockReturnValue({
      ...mockGetState(),
      frequency: { hasMultiValue: false, value: 40 },
    });

    const { baseElement, getByText } = render(<AdvancedSettingModal onClose={mockOnClose} />);
    const frequencyInput = baseElement.querySelector('#frequency');

    expect(frequencyInput).not.toBeNull();
    fireEvent.change(frequencyInput, { target: { value: '120' } });
    fireEvent.click(getByText('Save'));

    expect(mockWriteDataLayer).toHaveBeenCalledTimes(6);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'frequency', 120, { batchCmd: mockBatchCmd });
    // 120kHz measured 1.8W of 4.5W
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'power', expect.closeTo(40), {
      batchCmd: mockBatchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd: mockBatchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer2', 'frequency', 120, { batchCmd: mockBatchCmd });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        configName: { hasMultiValue: false, value: 'CUSTOM_PRESET_CONSTANT' },
        frequency: { hasMultiValue: false, value: 120 },
        power: { hasMultiValue: false, value: expect.closeTo(40) },
      }),
    );
  });

  describe('inner engraving', () => {
    const withMode = (mode: 'dot' | 'line') =>
      mockGetState.mockReturnValue({
        ...mockGetState(),
        stlLayerSpacing: { hasMultiValue: false, value: 0.04 },
        stlMinLayerSpacing: { hasMultiValue: false, value: 0 },
        stlMode: { hasMultiValue: false, value: mode },
        stlSolid: { hasMultiValue: false, value: false },
      });

    beforeEach(() => mockUseInnerEngravingActive.mockReturnValue(true));

    test('dot mode has no inner engraving options here (solid is in the panel), nor wobble or fill', () => {
      withMode('dot');

      const { baseElement } = render(<AdvancedSettingModal onClose={mockOnClose} />);

      expect(baseElement.querySelector('#stlSolid')).toBeNull();
      expect(baseElement.querySelector('#stlAdaptiveSpacing')).toBeNull();
      expect(baseElement.querySelector('#wobble')).toBeNull();
      expect(baseElement.querySelector('#fillAngle')).toBeNull();
    });

    test('line mode offers adaptive spacing, starting at half the layer spacing', () => {
      withMode('line');

      const { baseElement, getByText } = render(<AdvancedSettingModal onClose={mockOnClose} />);

      fireEvent.click(baseElement.querySelector('#stlAdaptiveSpacing')!);
      expect(baseElement.querySelector('#stlMinLayerSpacing')).not.toBeNull();
      fireEvent.click(getByText('Save'));

      expect(mockWriteDataLayer).toHaveBeenCalledWith('layer1', 'stlMinLayerSpacing', 0.02, { batchCmd: mockBatchCmd });
    });
  });

  test('reverse switches are dev only', () => {
    mockGetState.mockReturnValue({
      ...mockGetState(),
      focus: { hasMultiValue: false, value: 2 },
      focusStep: { hasMultiValue: false, value: 1 },
    });

    const { baseElement, unmount } = render(<AdvancedSettingModal onClose={mockOnClose} />);

    expect(baseElement.querySelector('#lower-focus-rev')).not.toBeNull();
    expect(baseElement.querySelector('#focus-step-rev')).not.toBeNull();
    unmount();

    mockIsDev.mockReturnValue(false);

    const { baseElement: nonDev } = render(<AdvancedSettingModal onClose={mockOnClose} />);

    expect(nonDev.querySelector('#lower-focus-rev')).toBeNull();
    expect(nonDev.querySelector('#focus-step-rev')).toBeNull();
  });

  test('cancel should work', () => {
    const { baseElement, getByText } = render(<AdvancedSettingModal onClose={mockOnClose} />);

    changeValue(baseElement);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();

    const cancelButton = getByText('Cancel');

    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
    expect(mockCreateEventEmitter).not.toHaveBeenCalled();
  });
});
