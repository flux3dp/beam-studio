import React from 'react';

import { render } from '@testing-library/react';

import OptionsPanel from './OptionsPanel';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/ImageOptions', () => 'dummy-image-options');
jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock', () => 'dummy-infill-block');
jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/RectOptions', () => 'dummy-rect-options');
jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions', () => 'dummy-text-options');
jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/PolygonOptions', () => 'dummy-polygon-options');
jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/MultiColorOptions', () => 'dummy-multi-color-options');
jest.mock('@core/app/views/beambox/Right-Panels/ColorPanel', () => 'dummy-color-panel');
jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem');

const mockGetAttribute = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getObjectLayer: () => ({
    elem: {
      getAttribute: () => mockGetAttribute(),
    },
  }),
}));

describe('should render correctly', () => {
  beforeEach(() => {
    mockGetAttribute.mockReturnValue(null);
  });

  test('rect', () => {
    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('rect')} />);

    expect(container).toMatchSnapshot();
  });

  test('text', () => {
    document.body.innerHTML = '<text id="text" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('text')} />);

    expect(container).toMatchSnapshot();
  });

  test('image', () => {
    document.body.innerHTML = '<image id="image" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('image')} />);

    expect(container).toMatchSnapshot();
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={document.getElementById('polygon')} />);

      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={document.getElementById('polygon')} />);

      expect(container).toMatchSnapshot();
    });
  });

  test('others', () => {
    document.body.innerHTML = '<xxx id="xxx" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('xxx')} />);

    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(<OptionsPanel elem={null} />);

    expect(container).toMatchSnapshot();
  });

  test('rect in full color layer', () => {
    mockGetAttribute.mockReturnValue('1');
    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('rect')} />);

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

    const { container } = render(<OptionsPanel elem={document.getElementById('rect')} />);

    expect(container).toMatchSnapshot();
  });

  test('text', () => {
    document.body.innerHTML = '<text id="text" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('text')} />);

    expect(container).toMatchSnapshot();
  });

  test('image', () => {
    document.body.innerHTML = '<image id="image" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('image')} />);

    expect(container).toMatchSnapshot();
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={document.getElementById('polygon')} />);

      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(<OptionsPanel elem={document.getElementById('polygon')} />);

      expect(container).toMatchSnapshot();
    });
  });

  test('others', () => {
    document.body.innerHTML = '<xxx id="xxx" />';

    const { container } = render(<OptionsPanel elem={document.getElementById('xxx')} />);

    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(<OptionsPanel elem={null} />);

    expect(container).toMatchSnapshot();
  });
});
