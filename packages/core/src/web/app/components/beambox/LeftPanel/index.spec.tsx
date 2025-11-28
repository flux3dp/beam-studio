import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

import LeftPanel from '.';

const mockRegisterCanvasShortcuts = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock('@core/app/stores/canvas/utils/registerCanvasShortcuts', () => ({
  registerCanvasShortcuts: (...args) => mockRegisterCanvasShortcuts(...args),
}));

jest.mock(
  '@core/app/components/beambox/LeftPanel/components/DrawingToolButtonGroup',
  () =>
    function DrawingToolButtonGroup() {
      return <div>This is dummy DrawingToolButtonGroup</div>;
    },
);

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
    mockRegisterCanvasShortcuts.mockReturnValue(mockUnsubscribe);
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  });

  test('shortcuts are registered on mount and unregistered on unmount', () => {
    const { unmount } = render(<LeftPanel />);

    expect(mockRegisterCanvasShortcuts).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  test('neither in previewing nor in path previewing', () => {
    const { container, unmount } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();
    unmount();
  });

  test('not in path previewing', () => {
    useCanvasStore.getState().setMode(CanvasMode.CurveEngraving);

    const { container } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();
  });

  test('in path previewing', () => {
    useCanvasStore.getState().setMode(CanvasMode.PathPreview);

    const { container } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();

    const div = container.querySelector('div#Exit-Preview');

    fireEvent.click(div);
    expect(useCanvasStore.getState().mode).toBe(CanvasMode.Draw);
  });

  test('in curve engraving mode', () => {
    useCanvasStore.getState().setMode(CanvasMode.CurveEngraving);

    const { container } = render(<LeftPanel />);

    expect(container).toMatchSnapshot();
  });
});
