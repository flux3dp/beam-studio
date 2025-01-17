/* eslint-disable import/first */
import React from 'react';
import { render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        cancel: 'Cancel',
        confirm: 'Confirm',
        grid_array: 'Create Grid Array',
        offset: 'Offset',
      },
    },
  },
}));

const get = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
}));

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const setMode = jest.fn();
const gridArraySelectedElement = jest.fn();
const nestElements = jest.fn();
getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      setMode,
      gridArraySelectedElement,
      nestElements,
    },
  });
});

const mockSetHasUnsavedChanges = jest.fn();
jest.mock('app/svgedit/currentFileManager', () => ({
  setHasUnsavedChanges: (...args) => mockSetHasUnsavedChanges(...args),
}));

const offsetElements = jest.fn();
jest.mock(
  'helpers/clipper/offset',
  () =>
    (...args) =>
      offsetElements(...args)
);

jest.mock('app/views/beambox/ToolPanels/Interval', () => 'dummy-interval');
jest.mock('app/views/beambox/ToolPanels/NestGAPanel', () => ({ nestOptions }: any) => (
  <div>dummy-nest-ga-panel nestOptions: {JSON.stringify(nestOptions)}</div>
));
jest.mock('app/views/beambox/ToolPanels/NestRotationPanel', () => 'dummy-nest-rotation-panel');
jest.mock('app/views/beambox/ToolPanels/NestSpacingPanel', () => 'dummy-nest-spacing-panel');
jest.mock('app/views/beambox/ToolPanels/OffsetCornerPanel', () => 'dummy-offset-corner-panel');
jest.mock(
  'app/views/beambox/ToolPanels/OffsetDirectionPanel',
  () => 'dummy-offset-direction-panel'
);
jest.mock('app/views/beambox/ToolPanels/OffsetDistancePanel', () => 'dummy-offset-distance-panel');
jest.mock('app/views/beambox/ToolPanels/RowColumn', () => 'dummy-row-column');
jest.mock('app/actions/beambox/toolPanelsController', () => ({}));

const isMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  isMobile: () => isMobile(),
}));

const isIdExist = jest.fn();
const popDialogById = jest.fn();
const addDialogComponent = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  isIdExist,
  popDialogById,
  addDialogComponent,
}));

import ToolPanels from './ToolPanels';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('type is gridArray', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        type="gridArray"
        data={{
          rowcolumn: {
            row: 1,
            column: 1,
          },
          distance: {
            dx: 0,
            dy: 0,
          },
        }}
        unmount={unmount}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('type is offset', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        type="offset"
        data={{
          rowcolumn: {
            row: 1,
            column: 1,
          },
          distance: {
            dx: 0,
            dy: 0,
          },
        }}
        unmount={unmount}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('type is nest', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        type="nest"
        data={{
          rowcolumn: {
            row: 1,
            column: 1,
          },
          distance: {
            dx: 0,
            dy: 0,
          },
        }}
        unmount={unmount}
      />
    );
    expect(container).toMatchSnapshot();
  });
});

describe('should render correctly in mobile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    isMobile.mockReturnValue(true);
  });

  test('type is gridArray', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        type="gridArray"
        data={{
          rowcolumn: {
            row: 1,
            column: 1,
          },
          distance: {
            dx: 0,
            dy: 0,
          },
        }}
        unmount={unmount}
      />
    );
    expect(container).toMatchSnapshot();
    expect(isIdExist).toBeCalledTimes(1);
    expect(isIdExist).toBeCalledWith('gridArray');
    expect(addDialogComponent).toBeCalledTimes(1);
    expect(addDialogComponent).toBeCalledWith('gridArray', expect.anything());
    expect(addDialogComponent.mock.calls[0][1]).toMatchSnapshot();
  });

  test('type is offset', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        type="offset"
        data={{
          rowcolumn: {
            row: 1,
            column: 1,
          },
          distance: {
            dx: 0,
            dy: 0,
          },
        }}
        unmount={unmount}
      />
    );
    expect(container).toMatchSnapshot();
    expect(isIdExist).toBeCalledWith('offset');
    expect(addDialogComponent).toBeCalledTimes(1);
    expect(addDialogComponent).toBeCalledWith('offset', expect.anything());
    expect(addDialogComponent.mock.calls[0][1]).toMatchSnapshot();
  });
});
