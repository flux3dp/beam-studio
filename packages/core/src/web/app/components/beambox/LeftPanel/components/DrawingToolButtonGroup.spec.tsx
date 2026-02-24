import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasContext } from '@core/app/contexts/CanvasContext';

const mockSetMouseMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/mouseMode', () => ({
  setMouseMode: (...args) => mockSetMouseMode(...args),
}));

const mockUseSelectTool = jest.fn();
const mockImportImage = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  importImage: mockImportImage,
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

const mockHandlePreviewClick = jest.fn();

jest.mock('@core/helpers/device/camera/previewMode', () => ({
  handlePreviewClick: mockHandlePreviewClick,
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
    expect(mockImportImage).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Text'));
    expect(mockSetMouseMode).toHaveBeenCalledTimes(1);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(1, 'text');

    fireEvent.click(container.querySelector('#left-Rectangle'));
    expect(mockSetMouseMode).toHaveBeenCalledTimes(2);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(2, 'rect');

    fireEvent.click(container.querySelector('#left-Ellipse'));
    expect(mockSetMouseMode).toHaveBeenCalledTimes(3);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(3, 'ellipse');

    fireEvent.click(container.querySelector('#left-Polygon'));
    expect(mockSetMouseMode).toHaveBeenCalledTimes(4);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(4, 'polygon');

    fireEvent.click(container.querySelector('#left-Line'));
    expect(mockSetMouseMode).toHaveBeenCalledTimes(5);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(5, 'line');

    fireEvent.click(container.querySelector('#left-Element'));
    expect(mockShowElementPanel).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('#left-Pen'));
    expect(mockSetMouseMode).toHaveBeenCalledTimes(6);
    expect(mockSetMouseMode).toHaveBeenNthCalledWith(6, 'path');

    fireEvent.click(container.querySelector('#left-Cursor'));
    expect(mockUseSelectTool).toHaveBeenCalledTimes(1);
  });

  test('preview button should render correctly', () => {
    jest.useFakeTimers();

    const { container } = render(<DrawingToolButtonGroup className="flux" />);

    fireEvent.click(container.querySelector('#left-Preview'));
    expect(mockHandlePreviewClick).toHaveBeenCalledTimes(1);
  });

  test('should render correctly when in pass through mode', () => {
    const contextValue = { hasPassthroughExtension: true };
    const { container } = render(
      <CanvasContext value={contextValue as any}>
        <DrawingToolButtonGroup className="flux" />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    expect(mockShowPassThrough).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('#left-PassThrough'));
    expect(mockShowPassThrough).toHaveBeenCalledTimes(1);
    expect(mockShowPassThrough).toHaveBeenCalledWith(mockUseSelectTool);
  });
});
