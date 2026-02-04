import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getPromarkLimit: () => ({
    frequency: { max: 4000, min: 1 },
    pulseWidth: { max: 350, min: 2 },
  }),
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

const mockEmit = jest.fn();

const mockOnClose = jest.fn();

const changeValue = (baseElement: HTMLElement) => {
  const fillIntervalInput = baseElement.querySelector('#fillInterval');

  fireEvent.change(fillIntervalInput, { target: { value: '0.2' } });
  expect(fillIntervalInput).toHaveValue('0.2');

  const fillAngleInput = baseElement.querySelector('#fillAngle');

  fireEvent.change(fillAngleInput, { target: { value: '22.5' } });
  expect(fillAngleInput).toHaveValue('22.5');

  const biDirectionalSwitch = baseElement.querySelector('#biDirectional');

  fireEvent.click(biDirectionalSwitch);
  expect(biDirectionalSwitch).toHaveAttribute('aria-checked', 'false');

  const crossHatchSwitch = baseElement.querySelector('#crossHatch');

  fireEvent.click(crossHatchSwitch);
  expect(crossHatchSwitch).toHaveAttribute('aria-checked', 'true');
};

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

const mockUseConfigPanelStore = jest.fn();
const mockGetState = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: mockUseConfigPanelStore,
}));

import FillSettingModal from './FillSettingModal';
import useLayerStore from '@core/app/stores/layer/layerStore';

describe('test FillSettingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue('mm');
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
      fillInterval: { hasMultiValue: false, value: 0.1 },
    });
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
  });

  it('should render correctly', () => {
    const { baseElement } = render(<FillSettingModal onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
  });

  test('save should work', () => {
    const { baseElement, getByText } = render(<FillSettingModal onClose={mockOnClose} />);

    changeValue(baseElement);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();

    const saveButton = getByText('Save');

    fireEvent.click(saveButton);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(8);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'fillInterval', 0.2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'fillAngle', 22.5);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer1', 'biDirectional', false);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer1', 'crossHatch', true);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, 'layer2', 'fillInterval', 0.2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, 'layer2', 'fillAngle', 22.5);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(7, 'layer2', 'biDirectional', false);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(8, 'layer2', 'crossHatch', true);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith({
      biDirectional: { hasMultiValue: false, value: false },
      crossHatch: { hasMultiValue: false, value: true },
      fillAngle: { hasMultiValue: false, value: 22.5 },
      fillInterval: { hasMultiValue: false, value: 0.2 },
    });
    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('cancel should work', () => {
    const { baseElement, getByText } = render(<FillSettingModal onClose={mockOnClose} />);

    changeValue(baseElement);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();

    const cancelButton = getByText('Cancel');

    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();
    expect(mockCreateEventEmitter).not.toHaveBeenCalled();
  });
});
