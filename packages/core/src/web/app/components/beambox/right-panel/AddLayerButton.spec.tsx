import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import AddLayerButton from './AddLayerButton';

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      layer_panel: {
        layers: {
          layer: 'Layer',
        },
      },
    },
  },
}));

const mockHasLayer = jest.fn();
const mockUpdateContextPanel = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) => cb({
    Canvas: {
      getCurrentDrawing: () => ({
        hasLayer: (name) => mockHasLayer(name),
      }),
    },
    Editor: {
      updateContextPanel: () => mockUpdateContextPanel(),
    },
  }),
}));


const mockCreateLayer = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  createLayer: (name) => mockCreateLayer(name),
}));

const mockInitLayerConfig = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  initLayerConfig: (name) => mockInitLayerConfig(name),
}));

const mockGetNextStepRequirement = jest.fn();
const mockHandleNextStep = jest.fn();
jest.mock('app/views/tutorials/tutorialController', () => ({
  getNextStepRequirement: () => mockGetNextStepRequirement(),
  handleNextStep: () => mockHandleNextStep(),
}));

jest.mock('app/constants/tutorial-constants', () => ({
  ADD_NEW_LAYER: 'ADD_NEW_LAYER',
}));

const mockSetSelectedLayers = jest.fn();

describe('test AddLayerButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<AddLayerButton setSelectedLayers={mockSetSelectedLayers} />);
    expect(container).toMatchSnapshot();
  });

  test('add new layer when name is not used', () => {
    mockHasLayer.mockReturnValue(false);
    const { container } = render(<AddLayerButton setSelectedLayers={mockSetSelectedLayers} />);
    fireEvent.click(container.querySelector('.btn'));
    expect(mockHasLayer).toBeCalledTimes(1);
    expect(mockCreateLayer).toBeCalledTimes(1);
    expect(mockCreateLayer).toHaveBeenLastCalledWith('Layer 1');
    expect(mockUpdateContextPanel).toBeCalledTimes(1);
    expect(mockInitLayerConfig).toBeCalledTimes(1);
    expect(mockInitLayerConfig).toHaveBeenLastCalledWith('Layer 1');
    expect(mockSetSelectedLayers).toBeCalledTimes(1);
    expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['Layer 1']);
  });

  test('add new layer when name is used', () => {
    mockHasLayer.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const { container } = render(<AddLayerButton setSelectedLayers={mockSetSelectedLayers} />);
    fireEvent.click(container.querySelector('.btn'));
    expect(mockHasLayer).toBeCalledTimes(2);
    expect(mockHasLayer).toHaveBeenNthCalledWith(1, 'Layer 1');
    expect(mockHasLayer).toHaveBeenNthCalledWith(2, 'Layer 2');
    expect(mockCreateLayer).toBeCalledTimes(1);
    expect(mockCreateLayer).toHaveBeenLastCalledWith('Layer 2');
    expect(mockUpdateContextPanel).toBeCalledTimes(1);
    expect(mockInitLayerConfig).toBeCalledTimes(1);
    expect(mockInitLayerConfig).toHaveBeenLastCalledWith('Layer 2');
    expect(mockSetSelectedLayers).toBeCalledTimes(1);
    expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['Layer 2']);
  });
});
