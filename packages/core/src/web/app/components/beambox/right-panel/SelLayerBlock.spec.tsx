import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { SelectedElementContext } from 'app/contexts/SelectedElementContext';

import SelLayerBlock from './SelLayerBlock';

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      layer_panel: {
        move_elems_to: 'move_elems_to',
      },
    },
  },
}));

const mockgetObjectLayer = jest.fn();
const mockMoveToOtherLayer = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  moveToOtherLayer: (...args: any[]) => mockMoveToOtherLayer(...args),
  getObjectLayer: (...args: any[]) => mockgetObjectLayer(...args),
}));

describe('SelLayerBlock', () => {
  it('should render correctly when layer is less than 1', () => {
    const { container } = render(<SelLayerBlock layerNames={['layer1']} />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when layer is more than 1 and selected elemented is none', () => {
    const { container } = render(<SelLayerBlock layerNames={['layer1', 'layer2']} />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when layer is more than 1 and selected elemented is not in a temp group', () => {
    mockgetObjectLayer.mockReturnValue({ title: 'layer1' });
    const mockElem = { getAttribute: () => jest.fn() };
    const { container } = render(
      <SelectedElementContext.Provider value={{ selectedElement: mockElem } as any}>
        <SelLayerBlock layerNames={['layer1', 'layer2']} />
      </SelectedElementContext.Provider>
    );
    expect(mockgetObjectLayer).toBeCalledTimes(1);
    expect(mockgetObjectLayer).toHaveBeenLastCalledWith(mockElem);
    expect(container).toMatchSnapshot();
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('layer1');
  });

  test('move to other layer', () => {
    mockgetObjectLayer.mockReturnValue({ title: 'layer1' });
    const mockElem = { getAttribute: () => jest.fn() };
    const { container } = render(
      <SelectedElementContext.Provider value={{ selectedElement: mockElem } as any}>
        <SelLayerBlock layerNames={['layer1', 'layer2']} />
      </SelectedElementContext.Provider>
    );
    const select = container.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'layer2' } });
    expect(mockMoveToOtherLayer).toBeCalledTimes(1);
    expect(mockMoveToOtherLayer).toHaveBeenLastCalledWith(
      'layer2',
      expect.any(Function),
      true
    );
  });
});
