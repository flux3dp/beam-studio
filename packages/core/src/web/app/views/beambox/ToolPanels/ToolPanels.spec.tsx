import React from 'react';

import { render } from '@testing-library/react';

const get = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get,
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const setMode = jest.fn();
const gridArraySelectedElement = jest.fn();
const nestElements = jest.fn();

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      gridArraySelectedElement,
      nestElements,
      setMode,
    },
  });
});

const mockSetHasUnsavedChanges = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  setHasUnsavedChanges: (...args) => mockSetHasUnsavedChanges(...args),
}));

const offsetElements = jest.fn();

jest.mock(
  '@core/helpers/clipper/offset',
  () =>
    (...args) =>
      offsetElements(...args),
);

jest.mock('@core/app/views/beambox/ToolPanels/Interval', () => 'dummy-interval');
jest.mock('@core/app/views/beambox/ToolPanels/NestGAPanel', () => ({ nestOptions }: any) => (
  <div>dummy-nest-ga-panel nestOptions: {JSON.stringify(nestOptions)}</div>
));
jest.mock('@core/app/views/beambox/ToolPanels/NestRotationPanel', () => 'dummy-nest-rotation-panel');
jest.mock('@core/app/views/beambox/ToolPanels/NestSpacingPanel', () => 'dummy-nest-spacing-panel');
jest.mock('@core/app/views/beambox/ToolPanels/OffsetPanel', () => 'dummy-offset-panel');
jest.mock('@core/app/views/beambox/ToolPanels/RowColumn', () => 'dummy-row-column');
jest.mock('@core/app/actions/beambox/toolPanelsController', () => ({}));

const isMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  isMobile: () => isMobile(),
}));

const isIdExist = jest.fn();
const popDialogById = jest.fn();
const addDialogComponent = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  addDialogComponent,
  isIdExist,
  popDialogById,
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
        data={{
          distance: {
            dx: 0,
            dy: 0,
          },
          rowcolumn: {
            column: 1,
            row: 1,
          },
        }}
        type="gridArray"
        unmount={unmount}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('type is offset', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        data={{
          distance: {
            dx: 0,
            dy: 0,
          },
          rowcolumn: {
            column: 1,
            row: 1,
          },
        }}
        type="offset"
        unmount={unmount}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('type is nest', () => {
    const unmount = jest.fn();
    const { container } = render(
      <ToolPanels
        data={{
          distance: {
            dx: 0,
            dy: 0,
          },
          rowcolumn: {
            column: 1,
            row: 1,
          },
        }}
        type="nest"
        unmount={unmount}
      />,
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
        data={{
          distance: {
            dx: 0,
            dy: 0,
          },
          rowcolumn: {
            column: 1,
            row: 1,
          },
        }}
        type="gridArray"
        unmount={unmount}
      />,
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
        data={{
          distance: {
            dx: 0,
            dy: 0,
          },
          rowcolumn: {
            column: 1,
            row: 1,
          },
        }}
        type="offset"
        unmount={unmount}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(isIdExist).toBeCalledWith('offset');
    expect(addDialogComponent).toBeCalledTimes(1);
    expect(addDialogComponent).toBeCalledWith('offset', expect.anything());
    expect(addDialogComponent.mock.calls[0][1]).toMatchSnapshot();
  });
});
