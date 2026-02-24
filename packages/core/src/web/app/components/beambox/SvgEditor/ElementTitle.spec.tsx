import React from 'react';

import { render } from '@testing-library/react';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';

const mockGetObjectLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: mockGetObjectLayer,
}));

import ElementTitle from './ElementTitle';

describe('should render correctly', () => {
  test('no selected element', () => {
    const { container } = render(
      <SelectedElementContext value={{ selectedElement: null }}>
        <ElementTitle />
      </SelectedElementContext>,
    );

    expect(container).toMatchSnapshot();
    expect(mockGetObjectLayer).not.toHaveBeenCalled();
  });

  test('multiple selections', () => {
    document.body.innerHTML = '<g id="svg_1" data-tempgroup="true" />';

    const { container } = render(
      <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
        <ElementTitle />
      </SelectedElementContext>,
    );

    expect(container).toMatchSnapshot();
    expect(mockGetObjectLayer).not.toHaveBeenCalled();
  });

  describe('single selection', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('not use', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<rect id="svg_1" />';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ElementTitle />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('svg', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" data-svg="true" />';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ElementTitle />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('dxf', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" data-dxf="true" />';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ElementTitle />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('imported object', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" />';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ElementTitle />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('no layer title given', () => {
      mockGetObjectLayer.mockReturnValue(document.getElementById('svg_1'));
      document.body.innerHTML = '<use id="svg_1" />';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ElementTitle />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('data-textpath-g', () => {
      mockGetObjectLayer.mockReturnValue({ title: 'Layer 1' });
      document.body.innerHTML = '<g id="svg_1" data-textpath-g="true" />';

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ElementTitle />
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });
  });
});
