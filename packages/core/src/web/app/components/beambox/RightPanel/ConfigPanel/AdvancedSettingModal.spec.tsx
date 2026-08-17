import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
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

import AdvancedSettingModal from './AdvancedSettingModal';
import useLayerStore from '@core/app/stores/layer/layerStore';

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
      focus: { hasMultiValue: false, value: -2 },
      focusStep: { hasMultiValue: false, value: -2 },
      repeat: { hasMultiValue: false, value: 2 },
      wobbleDiameter: { hasMultiValue: false, value: -0.2 },
      wobbleStep: { hasMultiValue: false, value: -0.05 },
    });
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
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
      focus: { hasMultiValue: false, value: 2 },
      focusStep: { hasMultiValue: false, value: -2 },
      wobbleDiameter: { hasMultiValue: false, value: 0.2 },
      wobbleStep: { hasMultiValue: false, value: 0.05 },
    });
    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
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
