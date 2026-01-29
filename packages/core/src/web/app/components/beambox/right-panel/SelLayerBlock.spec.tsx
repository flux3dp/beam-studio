import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';

import SelLayerBlock from './SelLayerBlock';

const mockGetObjectLayer = jest.fn();
const mockMoveToOtherLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: (...args: any[]) => mockGetObjectLayer(...args),
  moveToOtherLayer: (...args: any[]) => mockMoveToOtherLayer(...args),
}));

const mockGetAllLayerNames = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayerNames: () => mockGetAllLayerNames(),
}));

describe('SelLayerBlock', () => {
  it('should render correctly when layer is less than 1', () => {
    mockGetAllLayerNames.mockReturnValue(['layer1']);

    const { container } = render(<SelLayerBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when layer is more than 1 and selected element is none', () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const { container } = render(<SelLayerBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when layer is more than 1 and selected element is not in a temp group', () => {
    mockGetObjectLayer.mockReturnValue({ title: 'layer1' });
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockElem = { getAttribute: () => jest.fn() };
    const { container, getByText } = render(
      <SelectedElementContext.Provider value={{ selectedElement: mockElem } as any}>
        <SelLayerBlock />
      </SelectedElementContext.Provider>,
    );

    expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
    expect(mockGetObjectLayer).toHaveBeenLastCalledWith(mockElem);
    expect(container).toMatchSnapshot();
    expect(getByText('layer1')).toBeInTheDocument();
  });

  test('move to other layer', async () => {
    mockGetObjectLayer.mockReturnValue({ title: 'layer1' });
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockElem = { getAttribute: () => jest.fn() };
    const { baseElement } = render(
      <SelectedElementContext.Provider value={{ selectedElement: mockElem } as any}>
        <SelLayerBlock />
      </SelectedElementContext.Provider>,
    );

    act(() => fireEvent.mouseDown(baseElement.querySelector('input')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="layer2"]'));

    expect(mockMoveToOtherLayer).toHaveBeenCalledTimes(1);
    expect(mockMoveToOtherLayer).toHaveBeenLastCalledWith('layer2', expect.any(Function), true);
  });
});
