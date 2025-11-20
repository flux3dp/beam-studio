import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

import LeftPanel from '.';

const on = jest.fn();
const off = jest.fn();

jest.mock('@core/helpers/shortcuts', () => ({
  off: (...args) => off(...args),
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
const mockUnsubscribe = jest.fn();

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
  '@core/app/components/beambox/LeftPanel/components/DrawingToolButtonGroup',
  () =>
    function DrawingToolButtonGroup() {
      return <div>This is dummy DrawingToolButtonGroup</div>;
    },
);

jest.mock('@core/app/components/beambox/LeftPanel/components/PreviewToolButtonGroup', () => () => (
  <div>This is dummy PreviewToolButtonGroup</div>
));

jest.mock(
  '@core/app/components/beambox/LeftPanel/components/CurveEngravingTool',
  () =>
    ({ className }: { className: string }) => <div className={className}>MockCurveEngravingTool</div>,
);

const mockToggleAutoFocus = jest.fn();

jest.mock('@core/app/stores/canvas/utils/autoFocus', () => ({
  toggleAutoFocus: (...args) => mockToggleAutoFocus(...args),
}));

describe('test LeftPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    on.mockReturnValue(mockUnsubscribe);
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  });

  test('neither in previewing nor in path previewing', () => {
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });
    document.body.innerHTML = '<div id="svg_editor" />';

    const { container, unmount } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();
    unmount();
  });

  test('not in path previewing', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();
  });

  test('in path previewing', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });
    useCanvasStore.getState().setMode(CanvasMode.PathPreview);

    const { container } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();

    const div = container.querySelector('div#Exit-Preview');

    fireEvent.click(div);
    expect(useCanvasStore.getState().mode).toBe(CanvasMode.Draw);
  });

  test('in curve engraving mode', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });
    useCanvasStore.getState().setMode(CanvasMode.CurveEngraving);

    const { container } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();
  });
});
