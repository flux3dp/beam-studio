import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';

import LeftPanel from './LeftPanel';

const on = jest.fn();
jest.mock('helpers/shortcuts', () => ({
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
jest.mock('app/actions/beambox/svgeditor-function-wrapper', () => ({
  clearSelection: () => clearSelection(),
  useSelectTool: () => useSelectTool(),
  importImage: () => importImage(),
  insertText: () => insertText(),
  insertRectangle: () => insertRectangle(),
  insertEllipse: () => insertEllipse(),
  insertLine: () => insertLine(),
  insertPath: () => insertPath(),
  insertPolygon: () => insertPolygon(),
}));

jest.mock(
  'app/components/beambox/left-panel/DrawingToolButtonGroup',
  () =>
    function DrawingToolButtonGroup() {
      return <div>This is dummy DrawingToolButtonGroup</div>;
    }
);

jest.mock('app/components/beambox/left-panel/PreviewToolButtonGroup', () => () => (
  <div>This is dummy PreviewToolButtonGroup</div>
));

jest.mock(
  'app/components/beambox/left-panel/CurveEngravingTool',
  () =>
    ({ className }: { className: string }) =>
      <div className={className}>MockCurveEngravingTool</div>
);

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext(null),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      left_panel: {
        label: {
          end_preview: 'End Preview',
        },
      },
    },
  },
}));

describe('test LeftPanel', () => {
  test('neither in previewing nor in path previewing', () => {
    Object.defineProperty(window, 'os', {
      value: 'MacOS',
    });
    document.body.innerHTML = '<div id="svg_editor" />';

    const { container, unmount } = render(
      <CanvasContext.Provider
        value={
          {
            togglePathPreview: jest.fn(),
            mode: CanvasMode.Draw,
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(
      document.getElementById('svg_editor').className.split(' ').indexOf('color') !== -1
    ).toBeTruthy();

    unmount();
    expect(document.getElementById('svg_editor').className.split(' ').indexOf('color')).toBe(-1);
  });

  test('not in path previewing', () => {
    Object.defineProperty(window, 'os', { value: 'Windows' });
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            togglePathPreview: jest.fn(),
            mode: CanvasMode.Preview,
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>
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
            togglePathPreview,
            mode: CanvasMode.PathPreview,
          } as any
        }
      >
        <LeftPanel />
      </CanvasContext.Provider>
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
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
