import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';
import FillSettingModal from './FillSettingModal';

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

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  biDirectional: { hasMultiValue: false, value: true },
  crossHatch: { hasMultiValue: false, value: false },
  fillAngle: { hasMultiValue: false, value: 0 },
  fillInterval: { hasMultiValue: false, value: 0.1 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ decimal, defaultValue, displayMultiValue, getValue, id, max, min, unit }: any) => (
      <div>
        MockUnitInput
        <p>min: {min}</p>
        <p>max: {max}</p>
        <p>unit: {unit}</p>
        <p>defaultValue: {defaultValue}</p>
        <p>decimal: {decimal}</p>
        <p>displayMultiValue: {displayMultiValue ? 'Y' : 'N'}</p>
        <input
          data-testid={id}
          id={id}
          onChange={(e) => getValue(Number.parseFloat(e.target.value))}
          type="number"
          value={defaultValue}
        />
      </div>
    ),
);

const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockEmit = jest.fn();

const mockOnClose = jest.fn();

const changeValue = (baseElement: HTMLElement) => {
  const fillIntervalInput = baseElement.querySelector('#fillInterval');

  fireEvent.change(fillIntervalInput, { target: { value: '0.2' } });
  expect(fillIntervalInput).toHaveValue(0.2);

  const fillAngleInput = baseElement.querySelector('#fillAngle');

  fireEvent.change(fillAngleInput, { target: { value: '22.5' } });
  expect(fillAngleInput).toHaveValue(22.5);

  const biDirectionalSwitch = baseElement.querySelector('#biDirectional');

  fireEvent.click(biDirectionalSwitch);
  expect(biDirectionalSwitch).toHaveAttribute('aria-checked', 'false');

  const crossHatchSwitch = baseElement.querySelector('#crossHatch');

  fireEvent.click(crossHatchSwitch);
  expect(crossHatchSwitch).toHaveAttribute('aria-checked', 'true');
};

describe('test FillSettingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue('mm');
    mockGetLayerByName.mockImplementation((layerName: string) => layerName);
    mockCreateEventEmitter.mockReturnValueOnce({ emit: mockEmit });
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <FillSettingModal onClose={mockOnClose} />
      </ConfigPanelContext.Provider>,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('save should work', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <FillSettingModal onClose={mockOnClose} />
      </ConfigPanelContext.Provider>,
    );

    changeValue(baseElement);
    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteDataLayer).not.toBeCalled();

    const saveButton = getByText('Save');

    fireEvent.click(saveButton);
    expect(mockWriteDataLayer).toBeCalledTimes(8);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'fillInterval', 0.2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'fillAngle', 22.5);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer1', 'biDirectional', false);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer1', 'crossHatch', true);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, 'layer2', 'fillInterval', 0.2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, 'layer2', 'fillAngle', 22.5);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(7, 'layer2', 'biDirectional', false);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(8, 'layer2', 'crossHatch', true);
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: {
        biDirectional: { hasMultiValue: false, value: false },
        crossHatch: { hasMultiValue: false, value: true },
        fillAngle: { hasMultiValue: false, value: 22.5 },
        fillInterval: { hasMultiValue: false, value: 0.2 },
      },
      type: 'update',
    });
    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');
    expect(mockEmit).toBeCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockOnClose).toBeCalledTimes(1);
  });

  test('cancel should work', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <FillSettingModal onClose={mockOnClose} />
      </ConfigPanelContext.Provider>,
    );

    changeValue(baseElement);
    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteDataLayer).not.toBeCalled();

    const cancelButton = getByText('Cancel');

    fireEvent.click(cancelButton);
    expect(mockOnClose).toBeCalledTimes(1);
    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteDataLayer).not.toBeCalled();
    expect(mockCreateEventEmitter).not.toBeCalled();
  });
});
