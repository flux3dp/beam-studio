import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock(
  './ActionsPanel',
  () =>
    function DummyActionsPanel() {
      return <div>This is dummy ActionsPanel</div>;
    },
);

jest.mock(
  './DimensionPanel/DimensionPanel',
  () =>
    function DummyDimensionPanel() {
      return <div>This is dummy DimensionPanel</div>;
    },
);

jest.mock(
  './OptionsPanel',
  () =>
    function DummyOptionsPanel() {
      return <div>This is dummy OptionsPanel</div>;
    },
);

jest.mock(
  './ConfigPanel/ConfigPanel',
  () =>
    function DummyConfigPanel() {
      return <div>This is dummy ConfigPanel</div>;
    },
);

jest.mock('./ObjectPanelItem', () => ({
  ActionList: function DummyObjectPanelActionList({ actions, id }: any) {
    return (
      <div id={id}>
        This is dummy ObjectPanelActionList
        {actions.map(({ icon, label, onClick }) => (
          <div key={label}>
            {icon}
            <button onClick={onClick} type="button">
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
  Item: function DummyObjectPanelItem({ id, label, onClick }: any) {
    return (
      <div id={id}>
        This is dummy ObjectPanelItem
        <button onClick={onClick} type="button">
          {label}
        </button>
      </div>
    );
  },
}));

const alignTop = jest.fn();
const alignMiddle = jest.fn();
const alignBottom = jest.fn();
const alignLeft = jest.fn();
const alignCenter = jest.fn();
const alignRight = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  alignBottom,
  alignCenter,
  alignLeft,
  alignMiddle,
  alignRight,
  alignTop,
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const calcPathClosed = jest.fn();
const distHori = jest.fn();
const distVert = jest.fn();
const groupSelectedElements = jest.fn();
const ungroupSelectedElement = jest.fn();
const getLayerName = jest.fn();
const deleteSelected = jest.fn();

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      calcPathClosed,
      distHori,
      distVert,
      getCurrentDrawing: () => ({ getLayerName }),
      groupSelectedElements,
      ungroupSelectedElement,
    },
    Editor: { deleteSelected },
  });
});

const addDialogComponent = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  addDialogComponent: (...args) => addDialogComponent(...args),
}));

const mockConvertAndBooleanOperate = jest.fn();

jest.mock('./utils/convertAndBooleanOperate', () => ({
  convertAndBooleanOperate: ({ operation }) => mockConvertAndBooleanOperate(operation),
}));

const mockCloneSelectedElements = jest.fn();

jest.mock('@core/app/svgedit/operations/clipboard', () => ({
  cloneSelectedElements: (...args) => mockCloneSelectedElements(...args),
}));

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { ObjectPanelContext } from './contexts/ObjectPanelContext';
import ObjectPanel from './ObjectPanel';

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('no elements', () => {
    const { container } = render(
      <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
        <ObjectPanelContext
          value={{
            activeKey: null,
            dimensionValues: {
              rx: 1,
            },
            getDimensionValues: jest.fn(),
            polygonSides: 5,
            updateActiveKey: jest.fn(),
            updateDimensionValues: jest.fn(),
            updateObjectPanel: jest.fn(),
          }}
        >
          <ObjectPanel />
        </ObjectPanelContext>
        ,
      </SelectedElementContext>,
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
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
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
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
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
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_3') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
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
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(1);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(1, 'union');
      fireEvent.click(container.querySelector('button[title="Subtract"]'));
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(2);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(2, 'diff');
      fireEvent.click(container.querySelector('button[title="Intersect"]'));
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(3);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(3, 'intersect');
      fireEvent.click(container.querySelector('button[title="Difference"]'));
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(4);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(4, 'xor');
    });

    test('contains other types of elements', () => {
      document.body.innerHTML =
        '<g id="svg_3" data-tempgroup="true"><path id="svg_1"></path><line id="svg_2"></line></g>';
      calcPathClosed.mockReturnValue(true);

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_3') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(calcPathClosed).toHaveBeenCalledTimes(1);
      expect(calcPathClosed).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
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
      <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
        <ObjectPanelContext
          value={{
            activeKey: null,
            dimensionValues: {
              rx: 1,
            },
            getDimensionValues: jest.fn(),
            polygonSides: 5,
            updateActiveKey: jest.fn(),
            updateDimensionValues: jest.fn(),
            updateObjectPanel: jest.fn(),
          }}
        >
          <ObjectPanel />
        </ObjectPanelContext>
      </SelectedElementContext>,
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
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
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
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_1') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
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
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_3') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
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
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(1);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(1, 'union');
      fireEvent.click(getByText('Subtract'));
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(2);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(2, 'diff');
      fireEvent.click(getByText('Intersect'));
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(3);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(3, 'intersect');
      fireEvent.click(getByText('Difference'));
      expect(mockConvertAndBooleanOperate).toHaveBeenCalledTimes(4);
      expect(mockConvertAndBooleanOperate).toHaveBeenNthCalledWith(4, 'xor');
    });

    test('contains other types of elements', () => {
      document.body.innerHTML =
        '<g id="svg_3" data-tempgroup="true"><path id="svg_1"></path><line id="svg_2"></line></g>';
      calcPathClosed.mockReturnValue(true);

      const { container } = render(
        <SelectedElementContext value={{ selectedElement: document.getElementById('svg_3') }}>
          <ObjectPanelContext
            value={{
              activeKey: null,
              dimensionValues: {
                rx: 1,
              },
              getDimensionValues: jest.fn(),
              polygonSides: 5,
              updateActiveKey: jest.fn(),
              updateDimensionValues: jest.fn(),
              updateObjectPanel: jest.fn(),
            }}
          >
            <ObjectPanel />
          </ObjectPanelContext>
        </SelectedElementContext>,
      );

      expect(container).toMatchSnapshot();
      expect(calcPathClosed).toHaveBeenCalledTimes(1);
      expect(calcPathClosed).toHaveBeenNthCalledWith(1, document.getElementById('svg_1'));
    });
  });
});
