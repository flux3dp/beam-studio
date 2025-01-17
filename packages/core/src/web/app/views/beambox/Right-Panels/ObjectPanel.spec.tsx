/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock(
  'app/views/beambox/Right-Panels/ActionsPanel',
  () =>
    function DummyActionsPanel() {
      return <div>This is dummy ActionsPanel</div>;
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/DimensionPanel/DimensionPanel',
  () =>
    function DummyDimensionPanel() {
      return <div>This is dummy DimensionPanel</div>;
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/OptionsPanel',
  () =>
    function DummyOptionsPanel() {
      return <div>This is dummy OptionsPanel</div>;
    }
);

jest.mock(
  'app/views/beambox/Right-Panels/ConfigPanel/ConfigPanel',
  () =>
    function DummyConfigPanel() {
      return <div>This is dummy ConfigPanel</div>;
    }
);

jest.mock('app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Item: function DummyObjectPanelItem({ id, label, onClick }: any) {
    return (
      <div id={id}>
        This is dummy ObjectPanelItem
        <button type="button" onClick={onClick}>
          {label}
        </button>
      </div>
    );
  },
  ActionList: function DummyObjectPanelActionList({ id, actions }: any) {
    return (
      <div id={id}>
        This is dummy ObjectPanelActionList
        {actions.map(({ icon, label, onClick }) => (
          <div key={label}>
            {icon}
            <button type="button" onClick={onClick}>
              {label}
            </button>
          </div>
        ))}
      </div>
    );
  },
  Divider: function DummyObjectPanelDivider() {
    return <div>This is dummy ObjectPanelDivider</div>;
  },
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        group: 'Group',
        ungroup: 'Ungroup',
        distribute: 'Distribute',
        hdist: 'Horizontal Distribute',
        vdist: 'Vertical Distribute',
        align: 'Align',
        left_align: 'Left Align',
        center_align: 'Center Align',
        right_align: 'Right Align',
        top_align: 'Top Align',
        middle_align: 'Middle Align',
        bottom_align: 'Bottom Align',
        boolean: 'Boolean',
        union: 'Union',
        subtract: 'Subtract',
        intersect: 'Intersect',
        difference: 'Difference',
      },
      laser_panel: {
        parameters: 'Parameters',
      },
    },
  },
  topbar: {
    menu: {
      delete: 'Delete',
      duplicate: 'Duplicate',
    },
  },
}));

const alignTop = jest.fn();
const alignMiddle = jest.fn();
const alignBottom = jest.fn();
const alignLeft = jest.fn();
const alignCenter = jest.fn();
const alignRight = jest.fn();
jest.mock('app/actions/beambox/svgeditor-function-wrapper', () => ({
  alignTop,
  alignMiddle,
  alignBottom,
  alignLeft,
  alignCenter,
  alignRight,
}));

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const isElemFillable = jest.fn();
const distHori = jest.fn();
const distVert = jest.fn();
const groupSelectedElements = jest.fn();
const ungroupSelectedElement = jest.fn();
const booleanOperationSelectedElements = jest.fn();
const getLayerName = jest.fn();
const deleteSelected = jest.fn();
getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      isElemFillable,
      distHori,
      distVert,
      groupSelectedElements,
      ungroupSelectedElement,
      booleanOperationSelectedElements,
      getCurrentDrawing: () => ({ getLayerName }),
    },
    Editor: { deleteSelected },
  });
});

const addDialogComponent = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  addDialogComponent: (...args) => addDialogComponent(...args),
}));

import { ObjectPanelContext } from 'app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';

import ObjectPanel from './ObjectPanel';

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('no elements', () => {
    const { container } = render(
      <SelectedElementContext.Provider
        value={{ selectedElement: document.getElementById('svg_1') }}
      >
        <ObjectPanelContext.Provider
          value={{
            activeKey: null,
            polygonSides: 5,
            dimensionValues: {
              rx: 1,
            },
            updateActiveKey: jest.fn(),
            updateDimensionValues: jest.fn(),
            getDimensionValues: jest.fn(),
            updateObjectPanel: jest.fn(),
          }}
        >
          <ObjectPanel />
        </ObjectPanelContext.Provider>
        ,
      </SelectedElementContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  describe('one element', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('not g element', () => {
      document.body.innerHTML = '<rect id="svg_1" />';
      const { container } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_1') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();
      fireEvent.click(container.querySelector('button[title="Top Align"]'));
      expect(alignTop).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Middle Align"]'));
      expect(alignMiddle).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Bottom Align"]'));
      expect(alignBottom).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Left Align"]'));
      expect(alignLeft).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Center Align"]'));
      expect(alignCenter).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Right Align"]'));
      expect(alignRight).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Group"]'));
      expect(groupSelectedElements).toHaveBeenCalledTimes(1);
    });

    test('is g element', () => {
      document.body.innerHTML = '<g id="svg_1" />';
      const { container } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_1') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();
      fireEvent.click(container.querySelector('button[title="Ungroup"]'));
      expect(ungroupSelectedElement).toHaveBeenCalledTimes(1);
    });
  });

  describe('two elements', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('contains rect, polygon or ellipse elements', () => {
      document.body.innerHTML =
        '<g id="svg_3" data-tempgroup="true"><rect id="svg_1"></rect><ellipse id="svg_2"></ellipse></g>';
      const { container } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_3') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();

      fireEvent.click(container.querySelector('button[title="Top Align"]'));
      expect(alignTop).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Middle Align"]'));
      expect(alignMiddle).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Bottom Align"]'));
      expect(alignBottom).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Left Align"]'));
      expect(alignLeft).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Center Align"]'));
      expect(alignCenter).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Right Align"]'));
      expect(alignRight).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Group"]'));
      expect(groupSelectedElements).toHaveBeenCalledTimes(1);
      fireEvent.click(container.querySelector('button[title="Union"]'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(1);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(1, 'union');
      fireEvent.click(container.querySelector('button[title="Subtract"]'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(2);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(2, 'diff');
      fireEvent.click(container.querySelector('button[title="Intersect"]'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(3);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(3, 'intersect');
      fireEvent.click(container.querySelector('button[title="Difference"]'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(4);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(4, 'xor');
    });

    test('contains other types of elements', () => {
      document.body.innerHTML =
        '<g id="svg_3" data-tempgroup="true"><path id="svg_1"></path><line id="svg_2"></line></g>';
      isElemFillable.mockReturnValue(true);
      const { container } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_3') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();
      expect(isElemFillable).toHaveBeenCalledTimes(5);
      expect(isElemFillable).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
      expect(isElemFillable).toHaveBeenNthCalledWith(2, document.getElementById('svg_1'));
      expect(isElemFillable).toHaveBeenNthCalledWith(3, document.getElementById('svg_1'));
      expect(isElemFillable).toHaveBeenNthCalledWith(4, document.getElementById('svg_1'));
    });
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useIsMobile.mockReturnValue(true);
  });

  test('no elements', () => {
    const { container } = render(
      <SelectedElementContext.Provider
        value={{ selectedElement: document.getElementById('svg_1') }}
      >
        <ObjectPanelContext.Provider
          value={{
            activeKey: null,
            polygonSides: 5,
            dimensionValues: {
              rx: 1,
            },
            updateActiveKey: jest.fn(),
            updateDimensionValues: jest.fn(),
            getDimensionValues: jest.fn(),
            updateObjectPanel: jest.fn(),
          }}
        >
          <ObjectPanel />
        </ObjectPanelContext.Provider>
      </SelectedElementContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  describe('one element', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      useIsMobile.mockReturnValue(true);
    });

    test('not g element', () => {
      document.body.innerHTML = '<rect id="svg_1" />';
      const { container, getByText } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_1') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();

      fireEvent.click(getByText('Top Align'));
      expect(alignTop).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Middle Align'));
      expect(alignMiddle).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Bottom Align'));
      expect(alignBottom).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Left Align'));
      expect(alignLeft).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Center Align'));
      expect(alignCenter).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Right Align'));
      expect(alignRight).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Group'));
      expect(groupSelectedElements).toHaveBeenCalledTimes(1);
    });

    test('is g element', () => {
      document.body.innerHTML = '<g id="svg_1" />';
      const { container, getByText } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_1') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();

      fireEvent.click(getByText('Ungroup'));
      expect(ungroupSelectedElement).toHaveBeenCalledTimes(1);
    });
  });

  describe('two elements', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      useIsMobile.mockReturnValue(true);
    });

    test('contains rect, polygon or ellipse elements', () => {
      document.body.innerHTML =
        '<g id="svg_3" data-tempgroup="true"><rect id="svg_1"></rect><ellipse id="svg_2"></ellipse></g>';
      const { container, getByText } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_3') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();

      fireEvent.click(getByText('Top Align'));
      expect(alignTop).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Middle Align'));
      expect(alignMiddle).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Bottom Align'));
      expect(alignBottom).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Left Align'));
      expect(alignLeft).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Center Align'));
      expect(alignCenter).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Right Align'));
      expect(alignRight).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Group'));
      expect(groupSelectedElements).toHaveBeenCalledTimes(1);
      fireEvent.click(getByText('Union'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(1);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(1, 'union');
      fireEvent.click(getByText('Subtract'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(2);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(2, 'diff');
      fireEvent.click(getByText('Intersect'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(3);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(3, 'intersect');
      fireEvent.click(getByText('Difference'));
      expect(booleanOperationSelectedElements).toHaveBeenCalledTimes(4);
      expect(booleanOperationSelectedElements).toHaveBeenNthCalledWith(4, 'xor');
    });

    test('contains other types of elements', () => {
      document.body.innerHTML =
        '<g id="svg_3" data-tempgroup="true"><path id="svg_1"></path><line id="svg_2"></line></g>';
      isElemFillable.mockReturnValue(true);
      const { container } = render(
        <SelectedElementContext.Provider
          value={{ selectedElement: document.getElementById('svg_3') }}
        >
          <ObjectPanelContext.Provider
            value={{
              activeKey: null,
              polygonSides: 5,
              dimensionValues: {
                rx: 1,
              },
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              getDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext.Provider>
        </SelectedElementContext.Provider>
      );

      expect(container).toMatchSnapshot();
      expect(isElemFillable).toHaveBeenCalledTimes(5);
      expect(isElemFillable).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
      expect(isElemFillable).toHaveBeenNthCalledWith(2, document.getElementById('svg_1'));
      expect(isElemFillable).toHaveBeenNthCalledWith(3, document.getElementById('svg_1'));
      expect(isElemFillable).toHaveBeenNthCalledWith(4, document.getElementById('svg_1'));
    });
  });
});
