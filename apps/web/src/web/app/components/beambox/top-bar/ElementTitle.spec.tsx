/* eslint-disable import/first */
import React from 'react';
import { render } from '@testing-library/react';

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const getObjectLayer = jest.fn();
getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      getObjectLayer,
    },
  });
});

import ElementTitle from './ElementTitle';

describe('should render correctly', () => {
  test('no selected element', () => {
    const { container } = render(<ElementTitle selectedElem={null} />);
    expect(container).toMatchSnapshot();
    expect(getObjectLayer).not.toHaveBeenCalled();
  });

  test('multiple selections', () => {
    document.body.innerHTML = '<g id="svg_1" data-tempgroup="true" />';
    const { container } = render(<ElementTitle selectedElem={document.getElementById('svg_1')} />);
    expect(container).toMatchSnapshot();
    expect(getObjectLayer).not.toHaveBeenCalled();
  });

  describe('single selection', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('not use', () => {
      getObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<rect id="svg_1" />';
      const { container } = render(
        <ElementTitle selectedElem={document.getElementById('svg_1')} />
      );
      expect(container).toMatchSnapshot();
      expect(getObjectLayer).toHaveBeenCalledTimes(1);
      expect(getObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('svg', () => {
      getObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" data-svg="true" />';
      const { container } = render(
        <ElementTitle selectedElem={document.getElementById('svg_1')} />
      );
      expect(container).toMatchSnapshot();
      expect(getObjectLayer).toHaveBeenCalledTimes(1);
      expect(getObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('dxf', () => {
      getObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" data-dxf="true" />';
      const { container } = render(
        <ElementTitle selectedElem={document.getElementById('svg_1')} />
      );
      expect(container).toMatchSnapshot();
      expect(getObjectLayer).toHaveBeenCalledTimes(1);
      expect(getObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('imported object', () => {
      getObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<use id="svg_1" />';
      const { container } = render(
        <ElementTitle selectedElem={document.getElementById('svg_1')} />
      );
      expect(container).toMatchSnapshot();
      expect(getObjectLayer).toHaveBeenCalledTimes(1);
      expect(getObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('no layer title given', () => {
      getObjectLayer.mockReturnValue(null);
      document.body.innerHTML = '<use id="svg_1" />';
      const { container } = render(
        <ElementTitle selectedElem={document.getElementById('svg_1')} />
      );
      expect(container).toMatchSnapshot();
      expect(getObjectLayer).toHaveBeenCalledTimes(1);
      expect(getObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });

    test('data-textpath-g', () => {
      getObjectLayer.mockReturnValue({
        title: 'Layer 1',
      });
      document.body.innerHTML = '<g id="svg_1" data-textpath-g="true" />';
      const { container } = render(
        <ElementTitle selectedElem={document.getElementById('svg_1')} />
      );
      expect(container).toMatchSnapshot();
      expect(getObjectLayer).toHaveBeenCalledTimes(1);
      expect(getObjectLayer).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });
  });
});
