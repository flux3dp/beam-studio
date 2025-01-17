/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { PanelType } from 'app/constants/right-panel-types';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';

import Tab from './Tab';

const getNextStepRequirement = jest.fn();
const handleNextStep = jest.fn();
jest.mock('app/views/tutorials/tutorialController', () => ({
  getNextStepRequirement: (...args) => getNextStepRequirement(...args),
  handleNextStep: (...args) => handleNextStep(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
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
      rect: 'Rectangle',
      ellipse: 'Oval',
      path: 'Path',
      polygon: 'Polygon',
      image: 'Image',
      text: 'Text',
      text_path: 'Text on Path',
      pass_through_object: 'pass_through_object',
      line: 'Line',
      g: 'Group',
      multi_select: 'Multiple Objects',
      use: 'Imported Object',
      svg: 'SVG Object',
      dxf: 'DXF Object',
      no_selection: 'no_selection',
    },
  },
}));

jest.mock('app/constants/tutorial-constants', () => ({
  TO_LAYER_PANEL: 'TO_LAYER_PANEL',
}));

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ isPathEditing: false }),
}));

describe('should render correctly', () => {
  test('no selected element', () => {
    const { container } = render(
      <SelectedElementContext.Provider value={{ selectedElement: null }}>
        <Tab panelType={PanelType.Layer} switchPanel={jest.fn()} />
      </SelectedElementContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('in path edit mode', () => {
    document.body.innerHTML = '<path id="svg_1"></path>';

    const { container } = render(
      <SelectedElementContext.Provider
        value={{ selectedElement: document.getElementById('svg_1') }}
      >
        <Tab panelType={PanelType.PathEdit} switchPanel={jest.fn()} />
      </SelectedElementContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  describe('in element node', () => {
    describe('in objects tab', () => {
      test('not use tag', () => {
        document.body.innerHTML = '<ellipse id="svg_1"></ellipse>';
        const switchPanel = jest.fn();

        const { container } = render(
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={switchPanel} />
          </SelectedElementContext.Provider>
        );
        expect(container).toMatchSnapshot();
        fireEvent.click(container.querySelector('div.layers'));
        expect(switchPanel).toHaveBeenCalledTimes(1);
      });

      test('multiple objects', () => {
        document.body.innerHTML = '<g id="svg_3" data-tempgroup="true"></g>';
        const { container, getByText } = render(
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_3') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext.Provider>
        );
        expect(container).toMatchSnapshot();
        expect(getByText('Multiple Objects')).toBeInTheDocument();
      });

      test('dxf object', () => {
        document.body.innerHTML = '<use id="svg_1" data-dxf="true"></use>';
        const { container, getByText } = render(
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext.Provider>
        );
        expect(container).toMatchSnapshot();
        expect(getByText('DXF Object')).toBeInTheDocument();
      });

      test('svg object', () => {
        document.body.innerHTML = '<use id="svg_1" data-svg="true"></use>';
        const { container, getByText } = render(
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext.Provider>
        );
        expect(container).toMatchSnapshot();
        expect(getByText('SVG Object')).toBeInTheDocument();
      });

      test('textpath object', () => {
        document.body.innerHTML = '<g id="svg_1" data-textpath-g="1"></g>';
        const { container, getByText } = render(
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext.Provider>
        );
        expect(container).toMatchSnapshot();
        expect(getByText('Text on Path')).toBeInTheDocument();
      });

      test('other types', () => {
        document.body.innerHTML = '<use id="svg_1"></use>';
        const { container } = render(
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={jest.fn()} />
          </SelectedElementContext.Provider>
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
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={switchPanel} />
          </SelectedElementContext.Provider>
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
          <SelectedElementContext.Provider
            value={{ selectedElement: document.getElementById('svg_1') }}
          >
            <Tab panelType={PanelType.Object} switchPanel={switchPanel} />
          </SelectedElementContext.Provider>
        );

        getNextStepRequirement.mockReturnValue('');
        fireEvent.click(container.querySelector('div.layers'));
        expect(switchPanel).toHaveBeenCalledTimes(1);
        expect(handleNextStep).not.toHaveBeenCalled();
      });
    });
  });
});
