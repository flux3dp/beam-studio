/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import OptionsPanel from './OptionsPanel';

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock(
  'app/views/beambox/Right-Panels/Options-Blocks/ImageOptions',
  () =>
    function ImageOptions({ updateObjectPanel }: any) {
      return <div>This is dummy ImageOptions
        <button type="button" onClick={() => updateObjectPanel()}>
          updateObjectPanel
        </button>
      </div>;
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/Options-Blocks/InFillBlock',
  () =>
    function DummyInFillBlock() {
      return <div>This is dummy InFillBlock</div>;
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/Options-Blocks/RectOptions',
  () =>
    function RectOptions({ updateDimensionValues }: any) {
      return (
        <div>
          This is dummy RectOptions
          <button type="button" onClick={() => updateDimensionValues()}>
            updateDimensionValues
          </button>
        </div>
      );
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/Options-Blocks/TextOptions',
  () =>
    function TextOptions({ updateDimensionValues, updateObjectPanel }: any) {
      return (
        <div>
          This is dummy TextOptions
          <button type="button" onClick={() => updateDimensionValues()}>
            updateDimensionValues
          </button>
          <button type="button" onClick={() => updateObjectPanel()}>
            updateObjectPanel
          </button>
        </div>
      );
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/Options-Blocks/PolygonOptions',
  () =>
    function PolygonOptions() {
      return <div>This is dummy PolygonOptions</div>;
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/ColorPanel',
  () =>
    function ColorPanel() {
      return <div>This is dummy ColorPanel</div>;
    }
);

jest.mock('app/views/beambox/Right-Panels/Options-Blocks/MultiColorOptions', () => () => (
  <div>This is dummy MultiColorOptions</div>
))

const mockGetAttribute = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
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
        updateObjectPanel={jest.fn()}
        updateDimensionValues={updateDimensionValues}
      />
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
        updateObjectPanel={updateObjectPanel}
        updateDimensionValues={updateDimensionValues}
      />
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
        updateObjectPanel={updateObjectPanel}
        updateDimensionValues={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });

  describe('polygon', () => {
    test('desktop version', () => {
      document.body.innerHTML = '<polygon id="polygon" />';
      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          rx={null}
          polygonSides={8}
          updateObjectPanel={jest.fn()}
          updateDimensionValues={jest.fn()}
        />
      );
      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';
      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          rx={null}
          polygonSides={8}
          updateObjectPanel={jest.fn()}
          updateDimensionValues={jest.fn()}
        />
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
        updateObjectPanel={jest.fn()}
        updateDimensionValues={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(
      <OptionsPanel
        elem={null}
        rx={null}
        updateObjectPanel={jest.fn()}
        updateDimensionValues={jest.fn()}
      />
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
        updateObjectPanel={jest.fn()}
        updateDimensionValues={jest.fn()}
      />
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
        updateObjectPanel={jest.fn()}
        updateDimensionValues={updateDimensionValues}
      />
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
        updateObjectPanel={updateObjectPanel}
        updateDimensionValues={updateDimensionValues}
      />
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
        updateObjectPanel={updateObjectPanel}
        updateDimensionValues={jest.fn()}
      />
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
          rx={null}
          polygonSides={8}
          updateObjectPanel={jest.fn()}
          updateDimensionValues={jest.fn()}
        />
      );
      expect(container).toMatchSnapshot();
    });

    test('web version', () => {
      window.FLUX.version = 'web';
      document.body.innerHTML = '<polygon id="polygon" />';
      const { container } = render(
        <OptionsPanel
          elem={document.getElementById('polygon')}
          rx={null}
          polygonSides={8}
          updateObjectPanel={jest.fn()}
          updateDimensionValues={jest.fn()}
        />
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
        updateObjectPanel={jest.fn()}
        updateDimensionValues={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('no element', () => {
    const { container } = render(
      <OptionsPanel
        elem={null}
        rx={null}
        updateObjectPanel={jest.fn()}
        updateDimensionValues={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
