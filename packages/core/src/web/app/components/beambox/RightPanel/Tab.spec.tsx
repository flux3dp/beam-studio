import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { PanelType } from '@core/app/constants/right-panel-types';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';

import Tab from './Tab';

const getNextStepRequirement = jest.fn();
const handleNextStep = jest.fn();

jest.mock('@core/app/components/tutorials/tutorialController', () => ({
  getNextStepRequirement: (...args) => getNextStepRequirement(...args),
  handleNextStep: (...args) => handleNextStep(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      tabs: {
        layers: 'Layers',
        objects: 'Objects',
        path_edit: 'Path Edit',
      },
    },
  },
  topbar: {
    tag_names: {
      dxf: 'DXF Object',
      ellipse: 'Oval',
      g: 'Group',
      image: 'Image',
      line: 'Line',
      multi_select: 'Multiple Objects',
      no_selection: 'no_selection',
      pass_through_object: 'pass_through_object',
      path: 'Path',
      polygon: 'Polygon',
      rect: 'Rectangle',
      svg: 'SVG Object',
      text: 'Text',
      text_path: 'Text on Path',
      use: 'Imported Object',
    },
  },
}));

jest.mock('@core/app/constants/tutorial-constants', () => ({
  TO_LAYER_PANEL: 'TO_LAYER_PANEL',
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ isPathEditing: false }),
}));

describe('should render correctly', () => {
  test('no selected element', () => {
    const { container } = render(
      <SelectedElementContext value={{ selectedElement: null }}>
        <Tab panelType={PanelType.Layer} switchPanel={jest.fn()} />
      </SelectedElementContext>,
    );

    expect(container).toMatchSnapshot();
  });

  test('in path edit mode', () => {
    document.body.innerHTML = '<path id="svg_1"></path>';

    const { container } = render(
      <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
        <Tab panelType={PanelType.PathEdit} switchPanel={jest.fn()} />
      </SelectedElementContext>,
    );

    expect(container).toMatchSnapshot();
  });

  describe('in element node', () => {
    describe('in objects tab', () => {
      test('not use tag', () => {
        document.body.innerHTML = '<ellipse id="svg_1"></ellipse>';

        const switchPanel = jest.fn();

        const { container } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={switchPanel} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();
        fireEvent.click(container.querySelector('div.layers'));
        expect(switchPanel).toHaveBeenCalledTimes(1);
      });

      test('multiple objects', () => {
        document.body.innerHTML = '<g id="svg_3" data-tempgroup="true"></g>';

        const { container, getByText } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_3') }}>
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();
        expect(getByText('Multiple Objects')).toBeInTheDocument();
      });

      test('dxf object', () => {
        document.body.innerHTML = '<use id="svg_1" data-dxf="true"></use>';

        const { container, getByText } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();
        expect(getByText('DXF Object')).toBeInTheDocument();
      });

      test('svg object', () => {
        document.body.innerHTML = '<use id="svg_1" data-svg="true"></use>';

        const { container, getByText } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();
        expect(getByText('SVG Object')).toBeInTheDocument();
      });

      test('textpath object', () => {
        document.body.innerHTML = '<g id="svg_1" data-textpath-g="1"></g>';

        const { container, getByText } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();
        expect(getByText('Text on Path')).toBeInTheDocument();
      });

      test('other types', () => {
        document.body.innerHTML = '<use id="svg_1"></use>';

        const { container } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();
      });
    });

    describe('in layers tab', () => {
      beforeEach(() => {
        jest.resetAllMocks();
      });

      test('in tutorial mode', () => {
        document.body.innerHTML = '<ellipse id="svg_1"></ellipse>';

        const switchPanel = jest.fn();

        const { container } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={switchPanel} />
          </SelectedElementContext>,
        );

        expect(container).toMatchSnapshot();

        getNextStepRequirement.mockReturnValue('TO_LAYER_PANEL');
        fireEvent.click(container.querySelector('div.layers'));
        expect(switchPanel).toHaveBeenCalledTimes(1);
        expect(handleNextStep).toHaveBeenCalledTimes(1);
      });

      test('not in tutorial mode', () => {
        document.body.innerHTML = '<ellipse id="svg_1"></ellipse>';

        const switchPanel = jest.fn();

        const { container } = render(
          <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
            <Tab panelType={PanelType.Object} switchPanel={switchPanel} />
          </SelectedElementContext>,
        );

        getNextStepRequirement.mockReturnValue('');
        fireEvent.click(container.querySelector('div.layers'));
        expect(switchPanel).toHaveBeenCalledTimes(1);
        expect(handleNextStep).not.toHaveBeenCalled();
      });
    });
  });
});
