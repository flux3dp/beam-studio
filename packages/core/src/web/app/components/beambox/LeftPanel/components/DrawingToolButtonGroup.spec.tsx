import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

const mockUseSelectTool = jest.fn();
const mockImportImage = jest.fn();
const mockInsertText = jest.fn();
const mockInsertRectangle = jest.fn();
const mockInsertEllipse = jest.fn();
const mockInsertLine = jest.fn();
const mockInsertPath = jest.fn();
const mockInsertPolygon = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  importImage: mockImportImage,
  insertEllipse: mockInsertEllipse,
  insertLine: mockInsertLine,
  insertPath: mockInsertPath,
  insertPolygon: mockInsertPolygon,
  insertRectangle: mockInsertRectangle,
  insertText: mockInsertText,
  useSelectTool: mockUseSelectTool,
}));

const mockShowElementPanel = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showElementPanel: mockShowElementPanel,
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({}),
}));

const mockShowPassThrough = jest.fn();

jest.mock('@core/app/components/pass-through', () => ({
  showPassThrough: mockShowPassThrough,
}));

const mockChangeToPreviewMode = jest.fn();
const mockSetupPreviewMode = jest.fn();
const mockStartBackgroundPreviewMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/previewMode', () => ({
  changeToPreviewMode: mockChangeToPreviewMode,
  setupPreviewMode: mockSetupPreviewMode,
  startBackgroundPreviewMode: mockStartBackgroundPreviewMode,
}));

import DrawingToolButtonGroup from './DrawingToolButtonGroup';

describe('test DrawingToolButtonGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('should render correctly', () => {
    const { container } = render(<DrawingToolButtonGroup className="flux" />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('#left-Photo'));
    expect(container).toMatchSnapshot();
    expect(mockImportImage).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Text'));
    expect(container).toMatchSnapshot();
    expect(mockInsertText).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Rectangle'));
    expect(container).toMatchSnapshot();
    expect(mockInsertRectangle).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Ellipse'));
    expect(container).toMatchSnapshot();
    expect(mockInsertEllipse).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Polygon'));
    expect(container).toMatchSnapshot();
    expect(mockInsertPolygon).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Line'));
    expect(container).toMatchSnapshot();
    expect(mockInsertLine).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Element'));
    expect(container).toMatchSnapshot();
    expect(mockShowElementPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Pen'));
    expect(container).toMatchSnapshot();
    expect(mockInsertPath).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Cursor'));
    expect(container).toMatchSnapshot();
    expect(mockUseSelectTool).toHaveBeenCalledTimes(1);
  });

  test('preview button should render correctly', () => {
    jest.useFakeTimers();

    const { container } = render(<DrawingToolButtonGroup className="flux" />);
    const button = container.querySelector('#left-Preview');

    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    expect(mockStartBackgroundPreviewMode).toHaveBeenCalledTimes(1);
    expect(mockChangeToPreviewMode).not.toHaveBeenCalled();
    expect(mockSetupPreviewMode).not.toHaveBeenCalled();

    fireEvent.mouseDown(button);
    jest.advanceTimersByTime(1000);
    fireEvent.mouseUp(button);
    expect(mockChangeToPreviewMode).toHaveBeenCalledTimes(1);
    expect(mockSetupPreviewMode).toHaveBeenCalledTimes(1);
  });

  test('should render correctly when in pass through mode', () => {
    const contextValue = { hasPassthroughExtension: true };
    const { container } = render(
      <CanvasContext.Provider value={contextValue as any}>
        <DrawingToolButtonGroup className="flux" />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockShowPassThrough).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('#left-PassThrough'));
    expect(mockShowPassThrough).toHaveBeenCalledTimes(1);
    expect(mockShowPassThrough).toHaveBeenCalledWith(mockUseSelectTool);
  });

  test('event emitter', async () => {
    const eventEmitter = eventEmitterFactory.createEventEmitter('drawing-tool');
    const { container } = render(<DrawingToolButtonGroup className="flux" />);

    expect(container.querySelector('#left-Cursor')).toHaveClass('active');
    eventEmitter.emit('SET_ACTIVE_BUTTON', 'Pen');
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('#left-Cursor')).not.toHaveClass('active');
    expect(container.querySelector('#left-Pen')).toHaveClass('active');
  });
});
