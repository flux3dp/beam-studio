import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeDataLayer: mockWriteDataLayer,
}));

const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: mockGetLayerByName,
}));

const mockUseConfigPanelStore = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: mockUseConfigPanelStore,
}));

jest.mock('../ModalBlock', () => ({ color, label, setValue, unit, value }) => (
  <div>
    Mock ModalBlock
    <p>Color: {color}</p>
    <p>Label: {label}</p>
    <p>Unit: {unit}</p>
    <p>Value: {value}</p>
    <button id={`modal-block-increase-${color}`} onClick={() => setValue(value + 1)} />
  </div>
));

jest.mock('./ColorCurveControl', () => ({ color, setValue, title, value }) => (
  <div>
    Mock ColorCurveControl
    <p>Color: {color}</p>
    <p>Title: {title}</p>
    <p>Value: {JSON.stringify(value)}</p>
    <button id={`color-curve-control-set-value-${color}`} onClick={() => setValue(value.map((v) => v + 1))} />
  </div>
));

import { ColorAdvancedSetting } from '.';

const mockOnClose = jest.fn();

describe('test ColorAdvancedSetting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfigPanelStore.mockReturnValue({
      amAngleMap: { value: undefined },
      colorCurvesMap: {
        value: undefined,
      },
      update: mockUpdate,
    });
    mockGetLayerByName.mockImplementation((name) => name);
  });

  it('should render correctly with default values', () => {
    const { baseElement } = render(
      <ColorAdvancedSetting onClose={mockOnClose} selectedLayers={['layer1', 'layer2']} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly with set values', () => {
    mockUseConfigPanelStore.mockReturnValue({
      amAngleMap: { value: { c: 1, k: 2, m: 3, y: 4 } },
      colorCurvesMap: {
        value: {
          c: [0, 1, 2, 3, 4],
          k: [0, 1, 2, 3, 4],
          m: [0, 1, 2, 3, 4],
          y: [0, 1, 2, 3, 4],
        },
      },
      update: mockUpdate,
    });

    const { baseElement } = render(
      <ColorAdvancedSetting onClose={mockOnClose} selectedLayers={['layer1', 'layer2']} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  it('should handle angle value changes', () => {
    mockUseConfigPanelStore.mockReturnValue({
      amAngleMap: { value: { c: 1, k: 2, m: 3, y: 4 } },
      colorCurvesMap: {
        value: undefined,
      },
      update: mockUpdate,
    });

    const { baseElement, getByText } = render(
      <ColorAdvancedSetting onClose={mockOnClose} selectedLayers={['layer1', 'layer2']} />,
    );

    const button = baseElement.querySelector('#modal-block-increase-c');
    const okButton = getByText('OK');

    fireEvent.click(button);
    fireEvent.click(okButton);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      amAngleMap: {
        hasMultiValue: false,
        value: { c: 2, k: 2, m: 3, y: 4 },
      },
    });
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'amAngleMap', { c: 2, k: 2, m: 3, y: 4 });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer2', 'amAngleMap', { c: 2, k: 2, m: 3, y: 4 });
  });

  it('should handle color curve initialization', () => {
    const { baseElement, getByText } = render(
      <ColorAdvancedSetting onClose={mockOnClose} selectedLayers={['layer1', 'layer2']} />,
    );
    const initButton = getByText('+ Color Curve');

    fireEvent.click(initButton);

    expect(baseElement).toMatchSnapshot();
  });

  it('should handle color curve value changes', () => {
    mockUseConfigPanelStore.mockReturnValue({
      amAngleMap: { value: { c: 1, k: 2, m: 3, y: 4 } },
      colorCurvesMap: {
        value: {
          c: [0, 1, 2, 3, 4],
          k: [0, 1, 2, 3, 4],
          m: [0, 1, 2, 3, 4],
          y: [0, 1, 2, 3, 4],
        },
      },
      update: mockUpdate,
    });

    const { baseElement, getByText } = render(
      <ColorAdvancedSetting onClose={mockOnClose} selectedLayers={['layer1', 'layer2']} />,
    );
    const button = baseElement.querySelector('#color-curve-control-set-value-c');
    const okButton = getByText('OK');

    fireEvent.click(button);
    fireEvent.click(okButton);

    expect(mockUpdate).toHaveBeenCalledWith({
      colorCurvesMap: {
        hasMultiValue: false,
        value: {
          c: [1, 2, 3, 4, 5],
          k: [0, 1, 2, 3, 4],
          m: [0, 1, 2, 3, 4],
          y: [0, 1, 2, 3, 4],
        },
      },
    });
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(4);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'colorCurvesMap', {
      c: [1, 2, 3, 4, 5],
      k: [0, 1, 2, 3, 4],
      m: [0, 1, 2, 3, 4],
      y: [0, 1, 2, 3, 4],
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer2', 'colorCurvesMap', {
      c: [1, 2, 3, 4, 5],
      k: [0, 1, 2, 3, 4],
      m: [0, 1, 2, 3, 4],
      y: [0, 1, 2, 3, 4],
    });
  });
});
