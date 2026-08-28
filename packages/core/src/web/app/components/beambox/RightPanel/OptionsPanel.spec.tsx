import React from 'react';

import { render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

jest.mock('@core/helpers/variableText', () => ({
  isVariableTextSupported: () => true,
}));

jest.mock('./OptionsBlocks/ImageOptions', () => 'dummy-image-options');
jest.mock('./OptionsBlocks/InFillBlock', () => 'dummy-infill-block');
jest.mock('./OptionsBlocks/RectOptions', () => 'dummy-rect-options');
jest.mock('./OptionsBlocks/TextOptions', () => 'dummy-text-options');
jest.mock('./OptionsBlocks/PolygonOptions', () => 'dummy-polygon-options');
jest.mock('./OptionsBlocks/useThreeDSourceOptions', () => (elem: null | SVGElement) => {
  if (!elem?.hasAttribute('data-stl-source')) return { sourceElem: null };

  const sourceElem = document.createElementNS(
    'http://www.w3.org/2000/svg',
    elem.getAttribute('data-source-tag') || 'rect',
  );

  return { sourceElem };
});
jest.mock('./OptionsBlocks/ThreeDOptions', () => ({ hideEngravingMode }: { hideEngravingMode?: boolean }) => (
  <dummy-three-d-options data-hide-engraving-mode={String(Boolean(hideEngravingMode))} />
));
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

import OptionsPanel from './OptionsPanel';

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

  test('3D photo keeps bitmap options', () => {
    document.body.innerHTML = '<image id="image" data-stl-photo="1" />';

    const { container } = render(<OptionsPanel elem={getElem('image')} />);

    expect(container.querySelector('dummy-image-options')).toBeInTheDocument();
    expect(container.querySelector('dummy-three-d-options')).toHaveAttribute('data-hide-engraving-mode', 'true');
    expect(container.querySelector('dummy-infill-block')).not.toBeInTheDocument();
  });

  test('generated photo point cloud has no option controls', () => {
    document.body.innerHTML = '<image id="image" data-stl-photo="1" data-stl-point-cloud="1" />';

    const { container } = render(<OptionsPanel elem={getElem('image')} />);

    expect(container.querySelector('.panel')).not.toBeInTheDocument();
    expect(container.querySelector('dummy-image-options')).not.toBeInTheDocument();
    expect(container.querySelector('dummy-three-d-options')).not.toBeInTheDocument();
  });

  test('pure STL shows infill and common 3D options before rect options', () => {
    document.body.innerHTML = '<rect id="stl" data-stl="1" />';

    const { container } = render(<OptionsPanel elem={getElem('stl')} />);

    expect(container.querySelector('dummy-infill-block')).toBeInTheDocument();
    expect(container.querySelector('dummy-three-d-options')).toBeInTheDocument();
    expect(container.querySelector('dummy-rect-options')).not.toBeInTheDocument();
  });

  test('extruded 2D source follows the original match branch and appends common 3D options', () => {
    document.body.innerHTML = '<rect id="stl" data-stl="1" data-stl-source="source" />';

    const { container } = render(<OptionsPanel elem={getElem('stl')} />);

    expect(container.querySelector('dummy-rect-options')).toBeInTheDocument();
    expect(container.querySelector('dummy-infill-block')).toBeInTheDocument();
    expect(container.querySelector('dummy-three-d-options')).toBeInTheDocument();
  });

  test('extruded text follows the original text match branch', () => {
    document.body.innerHTML = '<rect id="stl" data-stl="1" data-stl-source="source" data-source-tag="text" />';

    const { container } = render(<OptionsPanel elem={getElem('stl')} />);

    expect(container.querySelector('dummy-text-options')).toBeInTheDocument();
    expect(container.querySelector('dummy-three-d-options')).toBeInTheDocument();
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
    useScreenStore.setState({ isMobile: true });
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
