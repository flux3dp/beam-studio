import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import LeftPanel from './LeftPanel';

const on = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('@core/helpers/shortcuts', () => ({
  on: (...args) => on(...args),
}));

const clearSelection = jest.fn();
const useSelectTool = jest.fn();
const importImage = jest.fn();
const insertText = jest.fn();
const insertRectangle = jest.fn();
const insertEllipse = jest.fn();
const insertLine = jest.fn();
const insertPath = jest.fn();
const insertPolygon = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  clearSelection: () => clearSelection(),
  importImage: () => importImage(),
  insertEllipse: () => insertEllipse(),
  insertLine: () => insertLine(),
  insertPath: () => insertPath(),
  insertPolygon: () => insertPolygon(),
  insertRectangle: () => insertRectangle(),
  insertText: () => insertText(),
  useSelectTool: () => useSelectTool(),
}));

jest.mock(
  '@core/app/components/beambox/left-panel/DrawingToolButtonGroup',
  () =>
    function DrawingToolButtonGroup() {
      return <div>This is dummy DrawingToolButtonGroup</div>;
    },
);

jest.mock('@core/app/components/beambox/left-panel/PreviewToolButtonGroup', () => () => (
  <div>This is dummy PreviewToolButtonGroup</div>
));

jest.mock(
  '@core/app/components/beambox/left-panel/CurveEngravingTool',
  () =>
    ({ className }: { className: string }) => <div className={className}>MockCurveEngravingTool</div>,
);

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext(null),
}));

describe('test LeftPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    on.mockReturnValue(mockUnsubscribe);
  });

  test('neither in previewing nor in path previewing', () => {
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });
    document.body.innerHTML = '<div id="svg_editor" />';

    const { container, unmount } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.Draw,
            togglePathPreview: jest.fn(),
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    unmount();
  });

  test('not in path previewing', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });

    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.Preview,
            togglePathPreview: jest.fn(),
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('in path previewing', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });

    const togglePathPreview = jest.fn();
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.PathPreview,
            togglePathPreview,
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    expect(togglePathPreview).not.toBeCalled();

    const div = container.querySelector('div#Exit-Preview');

    fireEvent.click(div);
    expect(togglePathPreview).toHaveBeenCalledTimes(1);
  });

  test('in curve engraving mode', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });

    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            mode: CanvasMode.CurveEngraving,
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });
});
