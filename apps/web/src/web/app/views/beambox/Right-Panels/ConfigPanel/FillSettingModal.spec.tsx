/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';
import FillSettingModal from './FillSettingModal';

const mockGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

const mockWriteDataLayer = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  getPromarkLimit: () => ({
    pulseWidth: { min: 2, max: 350 },
    frequency: { min: 1, max: 4000 },
  }),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  fillInterval: { value: 0.1, hasMultiValue: false },
  fillAngle: { value: 0, hasMultiValue: false },
  biDirectional: { value: true, hasMultiValue: false },
  crossHatch: { value: false, hasMultiValue: false },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

const mockGetLayerByName = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ id, min, max, unit, defaultValue, decimal, displayMultiValue, getValue }: any) =>
      (
        <div>
          MockUnitInput
          <p>min: {min}</p>
          <p>max: {max}</p>
          <p>unit: {unit}</p>
          <p>defaultValue: {defaultValue}</p>
          <p>decimal: {decimal}</p>
          <p>displayMultiValue: {displayMultiValue ? 'Y' : 'N'}</p>
          <input
            id={id}
            data-testid={id}
            type="number"
            value={defaultValue}
            onChange={(e) => getValue(parseFloat(e.target.value))}
          />
        </div>
      )
);

const mockCreateEventEmitter = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
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
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <FillSettingModal onClose={mockOnClose} />
      </ConfigPanelContext.Provider>
    );
    expect(baseElement).toMatchSnapshot();
  });

  test('save should work', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <FillSettingModal onClose={mockOnClose} />
      </ConfigPanelContext.Provider>
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
      type: 'update',
      payload: {
        fillInterval: { value: 0.2, hasMultiValue: false },
        fillAngle: { value: 22.5, hasMultiValue: false },
        biDirectional: { value: false, hasMultiValue: false },
        crossHatch: { value: true, hasMultiValue: false },
      },
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
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <FillSettingModal onClose={mockOnClose} />
      </ConfigPanelContext.Provider>
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
