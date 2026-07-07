import React from 'react';

import { render } from '@testing-library/react';

import { useSelectedElementStore } from '@core/app/stores/selectedElementStore';

const mockGetObjectLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: mockGetObjectLayer,
}));

const mockIsFitText = jest.fn();

jest.mock('@core/app/svgedit/text/textedit', () => ({
  isFitText: mockIsFitText,
}));

import ElementTitle from './ElementTitle';

describe('should render correctly', () => {
  test('no selected element', () => {
    const { container } = render(<ElementTitle />);

    expect(container).toMatchSnapshot();
    expect(mockGetObjectLayer).not.toHaveBeenCalled();
  });

  test('multiple selections', () => {
    document.body.innerHTML = '<g id="svg_1" data-tempgroup="true" />';
    useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

    const { container } = render(<ElementTitle />);

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
      useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

      const { container } = render(<ElementTitle />);

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('svg', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" data-svg="true" />';
      useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

      const { container } = render(<ElementTitle />);

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('dxf', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" data-dxf="true" />';
      useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

      const { container } = render(<ElementTitle />);

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('imported object', () => {
      mockGetObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" />';
      useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

      const { container } = render(<ElementTitle />);

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('no layer title given', () => {
      mockGetObjectLayer.mockReturnValue(document.getElementById('svg_1'));
      document.body.innerHTML = '<use id="svg_1" />';
      useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

      const { container } = render(<ElementTitle />);

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('data-textpath-g', () => {
      mockGetObjectLayer.mockReturnValue({ title: 'Layer 1' });
      document.body.innerHTML = '<g id="svg_1" data-textpath-g="true" />';
      useSelectedElementStore.getState().setSelectedElement(document.getElementById('svg_1'));

      const { container } = render(<ElementTitle />);

      expect(container).toMatchSnapshot();
      expect(mockGetObjectLayer).toHaveBeenCalledTimes(1);
      expect(mockGetObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });
  });
});
