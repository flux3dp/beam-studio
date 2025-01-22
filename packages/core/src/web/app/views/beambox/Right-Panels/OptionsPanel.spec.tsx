import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import OptionsPanel from './OptionsPanel';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock(
  '@core/app/views/beambox/Right-Panels/Options-Blocks/ImageOptions',
  () =>
    function ImageOptions({ updateObjectPanel }: any) {
      return (
        <div>
          This is dummy ImageOptions
          <button onClick={() => updateObjectPanel()} type="button">
            updateObjectPanel
          </button>
        </div>
      );
    },
);

jest.mock(
  '@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock',
  () =>
    function DummyInFillBlock() {
      return <div>This is dummy InFillBlock</div>;
    },
);

jest.mock(
  '@core/app/views/beambox/Right-Panels/Options-Blocks/RectOptions',
  () =>
    function RectOptions({ updateDimensionValues }: any) {
      return (
        <div>
          This is dummy RectOptions
          <button onClick={() => updateDimensionValues()} type="button">
            updateDimensionValues
          </button>
        </div>
      );
    },
);

jest.mock(
  '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions',
  () =>
    function TextOptions({ updateDimensionValues, updateObjectPanel }: any) {
      return (
        <div>
          This is dummy TextOptions
          <button onClick={() => updateDimensionValues()} type="button">
            updateDimensionValues
          </button>
          <button onClick={() => updateObjectPanel()} type="button">
            updateObjectPanel
          </button>
        </div>
      );
    },
);

jest.mock(
  '@core/app/views/beambox/Right-Panels/Options-Blocks/PolygonOptions',
  () =>
    function PolygonOptions() {
      return <div>This is dummy PolygonOptions</div>;
    },
);

jest.mock(
  '@core/app/views/beambox/Right-Panels/ColorPanel',
  () =>
    function ColorPanel() {
      return <div>This is dummy ColorPanel</div>;
    },
);

jest.mock('@core/app/views/beambox/Right-Panels/Options-Blocks/MultiColorOptions', () => () => (
  <div>This is dummy MultiColorOptions</div>
));

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
    const updateDimensionValues = jest.fn();

    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(
      <OptionsPanel
        elem={document.getElementById('rect')}
        rx={null}
        updateDimensionValues={updateDimensionValues}
        updateObjectPanel={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('text', () => {
    const updateObjectPanel = jest.fn();
    const updateDimensionValues = jest.fn();

    document.body.innerHTML = '<text id="text" />';

    const { container } = render(
      <OptionsPanel
        elem={document.getElementById('text')}
        rx={null}
        updateDimensionValues={updateDimensionValues}
        updateObjectPanel={updateObjectPanel}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('image', () => {
    const updateObjectPanel = jest.fn();

    document.body.innerHTML = '<image id="image" />';

    const { container } = render(
      <OptionsPanel
        elem={document.getElementById('image')}
        rx={null}
        updateDimensionValues={jest.fn()}
        updateObjectPanel={updateObjectPanel}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          polygonSides={8}
          rx={null}
          updateDimensionValues={jest.fn()}
          updateObjectPanel={jest.fn()}
        />,
      );

      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          polygonSides={8}
          rx={null}
          updateDimensionValues={jest.fn()}
          updateObjectPanel={jest.fn()}
        />,
      );

      expect(container).toMatchSnapshot();
    });
  });

  test('others', () => {
    document.body.innerHTML = '<xxx id="xxx" />';

    const { container } = render(
      <OptionsPanel
        elem={document.getElementById('xxx')}
        rx={null}
        updateDimensionValues={jest.fn()}
        updateObjectPanel={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(
      <OptionsPanel elem={null} rx={null} updateDimensionValues={jest.fn()} updateObjectPanel={jest.fn()} />,
    );

    expect(container).toMatchSnapshot();
  });

  test('rect in full color layer', () => {
    mockGetAttribute.mockReturnValue('1');
    document.body.innerHTML = '<rect id="rect" />';

    const { container } = render(
      <OptionsPanel
        elem={document.getElementById('rect')}
        rx={null}
        updateDimensionValues={jest.fn()}
        updateObjectPanel={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useIsMobile.mockReturnValue(true);
  });

  test('rect', () => {
    const updateDimensionValues = jest.fn();

    document.body.innerHTML = '<rect id="rect" />';

    const { container, getByText } = render(
      <OptionsPanel
        elem={document.getElementById('rect')}
        rx={null}
        updateDimensionValues={updateDimensionValues}
        updateObjectPanel={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
    fireEvent.click(getByText('updateDimensionValues'));
    expect(updateDimensionValues).toHaveBeenCalledTimes(1);
  });

  test('text', () => {
    const updateObjectPanel = jest.fn();
    const updateDimensionValues = jest.fn();

    document.body.innerHTML = '<text id="text" />';

    const { container, getByText } = render(
      <OptionsPanel
        elem={document.getElementById('text')}
        rx={null}
        updateDimensionValues={updateDimensionValues}
        updateObjectPanel={updateObjectPanel}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('updateDimensionValues'));
    expect(updateDimensionValues).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('updateObjectPanel'));
    expect(updateObjectPanel).toHaveBeenCalledTimes(1);
  });

  test('image', () => {
    const updateObjectPanel = jest.fn();

    document.body.innerHTML = '<image id="image" />';

    const { container, getByText } = render(
      <OptionsPanel
        elem={document.getElementById('image')}
        rx={null}
        updateDimensionValues={jest.fn()}
        updateObjectPanel={updateObjectPanel}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('updateObjectPanel'));
    expect(updateObjectPanel).toHaveBeenCalledTimes(1);
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          polygonSides={8}
          rx={null}
          updateDimensionValues={jest.fn()}
          updateObjectPanel={jest.fn()}
        />,
      );

      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';

      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          polygonSides={8}
          rx={null}
          updateDimensionValues={jest.fn()}
          updateObjectPanel={jest.fn()}
        />,
      );

      expect(container).toMatchSnapshot();
    });
  });

  test('others', () => {
    document.body.innerHTML = '<xxx id="xxx" />';

    const { container } = render(
      <OptionsPanel
        elem={document.getElementById('xxx')}
        rx={null}
        updateDimensionValues={jest.fn()}
        updateObjectPanel={jest.fn()}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(
      <OptionsPanel elem={null} rx={null} updateDimensionValues={jest.fn()} updateObjectPanel={jest.fn()} />,
    );

    expect(container).toMatchSnapshot();
  });
});
