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

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

const showElementPanel = jest.fn();
const showMyCloud = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showElementPanel: (...args) => showElementPanel(...args),
  showMyCloud: (...args) => showMyCloud(...args),
}));

const getCurrentUser = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  getCurrentUser: () => getCurrentUser(),
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({}),
}));

const mockShowPassThrough = jest.fn();

jest.mock('@core/app/components/pass-through', () => ({
  showPassThrough: mockShowPassThrough,
}));

jest.mock('@core/app/constants/social-media-constants', () => ({
  getSocialMedia: () => ({ instagram: { link: 'instagram_link' } }),
}));

import DrawingToolButtonGroup from './DrawingToolButtonGroup';

const mockCurveEngravingModeControllerStart = jest.fn();

jest.mock('@core/app/actions/canvas/curveEngravingModeController', () => ({
  start: () => mockCurveEngravingModeControllerStart(),
}));

describe('test DrawingToolButtonGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(showElementPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Pen'));
    expect(container).toMatchSnapshot();
    expect(mockInsertPath).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Cursor'));
    expect(container).toMatchSnapshot();
    expect(mockUseSelectTool).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-DesignMarket'));
    expect(container).toMatchSnapshot();
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith('https://dmkt.io');

    fireEvent.click(container.querySelector('#left-MyCloud'));
    expect(container).toMatchSnapshot();
    expect(showMyCloud).toHaveBeenCalledTimes(1);
    expect(showMyCloud).toHaveBeenCalledWith(mockUseSelectTool);

    fireEvent.click(container.querySelector('#left-Instagram'));
    expect(container).toMatchSnapshot();
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(mockOpen).toHaveBeenLastCalledWith('instagram_link');
  });

  test('preview button should render correctly', () => {
    const contextValue = { changeToPreviewMode: jest.fn(), setupPreviewMode: jest.fn() };
    const { container } = render(
      <CanvasContext.Provider value={contextValue as any}>
        <DrawingToolButtonGroup className="flux" />
      </CanvasContext.Provider>,
    );

    fireEvent.click(container.querySelector('#left-Preview'));
    expect(contextValue.changeToPreviewMode).toHaveBeenCalledTimes(1);
    expect(contextValue.setupPreviewMode).toHaveBeenCalledTimes(1);
  });

  test('should render flux plus icon correctly', () => {
    getCurrentUser.mockReturnValue({ info: { subscription: { is_valid: true } } });

    const { container } = render(<DrawingToolButtonGroup className="flux" />);

    const myCloudButton = container.querySelector('#left-MyCloud');

    expect(myCloudButton).toMatchSnapshot();

    fireEvent.click(myCloudButton);
    expect(myCloudButton).toMatchSnapshot();
    expect(showMyCloud).toHaveBeenCalledTimes(1);
    expect(showMyCloud).toHaveBeenCalledWith(mockUseSelectTool);
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

  test('should render correctly when model is bb2', () => {
    const contextValue = { selectedDevice: { model: 'fbb2' } };
    const { container } = render(
      <CanvasContext.Provider value={contextValue as any}>
        <DrawingToolButtonGroup className="flux" />
      </CanvasContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockCurveEngravingModeControllerStart).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('#left-curve-engrave'));
    expect(mockCurveEngravingModeControllerStart).toHaveBeenCalledTimes(1);
    expect(mockCurveEngravingModeControllerStart).toHaveBeenCalledWith();
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
