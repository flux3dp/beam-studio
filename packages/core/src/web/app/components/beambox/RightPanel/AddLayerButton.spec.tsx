import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import AddLayerButton from './AddLayerButton';
import { mockSetSelectedLayers } from '@mocks/@core/app/stores/layer/layerStore';

const mockHasLayer = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  hasLayer: (...args) => mockHasLayer(...args),
}));

const mockCreateLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  createLayer: (...args) => mockCreateLayer(...args),
}));

const mockGetNextStepRequirement = jest.fn();
const mockHandleNextStep = jest.fn();

jest.mock('@core/app/components/tutorials/tutorialController', () => ({
  getNextStepRequirement: () => mockGetNextStepRequirement(),
  handleNextStep: () => mockHandleNextStep(),
}));

jest.mock('@core/app/constants/tutorial-constants', () => ({
  ADD_NEW_LAYER: 'ADD_NEW_LAYER',
}));

describe('test AddLayerButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<AddLayerButton />);

    expect(container).toMatchSnapshot();
  });

  test('add new layer when name is not used', () => {
    mockHasLayer.mockReturnValue(false);

    const { container } = render(<AddLayerButton />);

    fireEvent.click(container.querySelector('.btn'));
    expect(mockHasLayer).toHaveBeenCalledTimes(1);
    expect(mockCreateLayer).toHaveBeenCalledTimes(1);
    expect(mockCreateLayer).toHaveBeenLastCalledWith('Layer 1', { initConfig: true });
    expect(mockSetSelectedLayers).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['Layer 1']);
  });

  test('add new layer when name is used', () => {
    mockHasLayer.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const { container } = render(<AddLayerButton />);

    fireEvent.click(container.querySelector('.btn'));
    expect(mockHasLayer).toHaveBeenCalledTimes(2);
    expect(mockHasLayer).toHaveBeenNthCalledWith(1, 'Layer 1');
    expect(mockHasLayer).toHaveBeenNthCalledWith(2, 'Layer 2');
    expect(mockCreateLayer).toHaveBeenCalledTimes(1);
    expect(mockCreateLayer).toHaveBeenLastCalledWith('Layer 2', { initConfig: true });
    expect(mockSetSelectedLayers).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedLayers).toHaveBeenLastCalledWith(['Layer 2']);
  });
});
