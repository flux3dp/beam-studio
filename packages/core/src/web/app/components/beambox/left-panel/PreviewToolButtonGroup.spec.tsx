/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { CanvasContext } from 'app/contexts/CanvasContext';

const emitShowCropper = jest.fn();
jest.mock('app/stores/beambox-store', () => ({
  emitShowCropper,
}));

const isClean = jest.fn();
const resetCoordinates = jest.fn();
const clear = jest.fn();
jest.mock('app/actions/beambox/preview-mode-background-drawer', () => ({
  isClean,
  resetCoordinates,
  clear,
}));

const isPreviewMode = jest.fn();
const mockIsLiveModeOn = jest.fn();
jest.mock('app/actions/beambox/preview-mode-controller', () => ({
  isDrawing: false,
  isPreviewMode,
  isLiveModeOn: () => mockIsLiveModeOn(),
}));

const getSVGAsync = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const clearSelection = jest.fn();
getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      clearSelection,
    },
  });
});

const useWorkarea = jest.fn();
jest.mock('helpers/hooks/useWorkarea', () => useWorkarea);

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    left_panel: {
      label: {
        preview: 'Camera Preview',
        trace: 'Trace Image',
        end_preview: 'End Preview',
        clear_preview: 'Clear Preview',
        curve_engraving: {
          title: 'Curve Engraving',
        },
      },
    },
  },
}));

const mockStartCurveEngraving = jest.fn();
jest.mock('app/actions/canvas/curveEngravingModeController', () => ({
  start: mockStartCurveEngraving,
}));

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext(null),
}));

import PreviewToolButtonGroup from './PreviewToolButtonGroup';

const mockIsNorthAmerica = jest.fn();
jest.mock('helpers/locale-helper', () => ({
  get isNorthAmerica() {
    return mockIsNorthAmerica();
  },
}));

describe('test PreviewToolButtonGroup', () => {
  it('should render correctly', () => {
    const endPreviewMode = jest.fn();
    const setupPreviewMode = jest.fn();
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            endPreviewMode,
            setupPreviewMode,
          } as any
        }
      >
      <PreviewToolButtonGroup
        className="left-toolbar"
      />
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(endPreviewMode).not.toBeCalled();
    const back = container.querySelector('#preview-back');
    fireEvent.click(back);
    expect(endPreviewMode).toHaveBeenCalledTimes(1);

    expect(setupPreviewMode).not.toBeCalled();
    const shoot = container.querySelector('#preview-shoot');
    fireEvent.click(shoot);
    expect(setupPreviewMode).toHaveBeenCalledTimes(1);
  });

  it('should render correctly when isNorthAmerica', () => {
    mockIsNorthAmerica.mockReturnValue(true);
    const endPreviewMode = jest.fn();
    const setupPreviewMode = jest.fn();
    const { container } = render(
      <CanvasContext.Provider
        value={
          {
            endPreviewMode,
            setupPreviewMode,
          } as any
        }
      >
      <PreviewToolButtonGroup
        className="left-toolbar"
      />
      </CanvasContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
