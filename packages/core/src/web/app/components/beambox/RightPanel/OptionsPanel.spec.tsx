import React from 'react';

import { render } from '@testing-library/react';

import OptionsPanel from './OptionsPanel';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('@core/helpers/variableText', () => ({
  isVariableTextSupported: () => true,
}));

jest.mock('./OptionsBlocks/ImageOptions', () => 'dummy-image-options');
jest.mock('./OptionsBlocks/InFillBlock', () => 'dummy-infill-block');
jest.mock('./OptionsBlocks/RectOptions', () => 'dummy-rect-options');
jest.mock('./OptionsBlocks/TextOptions', () => 'dummy-text-options');
jest.mock('./OptionsBlocks/PolygonOptions', () => 'dummy-polygon-options');
jest.mock('./OptionsBlocks/MultiColorOptions', () => 'dummy-multi-color-options');
jest.mock('./OptionsBlocks/VariableTextBlock', () => 'dummy-variable-text-block');
jest.mock('./ColorPanel', () => 'dummy-color-panel');
jest.mock('./ObjectPanelItem');

const mockGetAttribute = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: () => ({
    elem: {
      getAttribute: () => mockGetAttribute(),
    },
  }),
}));

const getElem = (id: string) => document.getElementById(id) as unknown as SVGElement;

describe('should render correctly', () => {
  beforeEach(() => {
    mockGetAttribute.mockReturnValue(null);
  });

  test('rect', () => {
    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(<OptionsPanel elem={getElem('rect')} />);

    expect(container).toMatchSnapshot();
  });

  test('text', () => {
    document.body.innerHTML = '<text id="text" />';

    const { container } = render(<OptionsPanel elem={getElem('text')} />);

    expect(container).toMatchSnapshot();
  });

  test('image', () => {
    document.body.innerHTML = '<image id="image" />';

    const { container } = render(<OptionsPanel elem={getElem('image')} />);

    expect(container).toMatchSnapshot();
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={getElem('polygon')} />);

      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={getElem('polygon')} />);

      expect(container).toMatchSnapshot();
    });
  });

  describe('use', () => {
    test('with variable data', () => {
      document.body.innerHTML = '<use id="use" data-props="{}" />';

      const { container } = render(<OptionsPanel elem={getElem('use')} />);

      expect(container).toMatchSnapshot();
    });

    test('without variable data', () => {
      document.body.innerHTML = '<use id="use" />';

      const { container } = render(<OptionsPanel elem={getElem('use')} />);

      expect(container).toMatchSnapshot();
    });
  });

  test('others', () => {
    document.body.innerHTML = '<xxx id="xxx" />';

    const { container } = render(<OptionsPanel elem={getElem('xxx')} />);

    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(<OptionsPanel elem={null} />);

    expect(container).toMatchSnapshot();
  });

  test('rect in full color layer', () => {
    mockGetAttribute.mockReturnValue('1');
    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(<OptionsPanel elem={getElem('rect')} />);

    expect(container).toMatchSnapshot();
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useIsMobile.mockReturnValue(true);
  });

  test('rect', () => {
    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(<OptionsPanel elem={getElem('rect')} />);

    expect(container).toMatchSnapshot();
  });

  test('text', () => {
    document.body.innerHTML = '<text id="text" />';

    const { container } = render(<OptionsPanel elem={getElem('text')} />);

    expect(container).toMatchSnapshot();
  });

  test('image', () => {
    document.body.innerHTML = '<image id="image" />';

    const { container } = render(<OptionsPanel elem={getElem('image')} />);

    expect(container).toMatchSnapshot();
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={getElem('polygon')} />);

      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={getElem('polygon')} />);

      expect(container).toMatchSnapshot();
    });
  });

  test('others', () => {
    document.body.innerHTML = '<xxx id="xxx" />';

    const { container } = render(<OptionsPanel elem={getElem('xxx')} />);

    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(<OptionsPanel elem={null} />);

    expect(container).toMatchSnapshot();
  });
});
