import React from 'react';
import { render } from '@testing-library/react';

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
const mockPreprocessByUrl = jest.fn();
const mockCalculateBase64 = jest.fn();
const mockHandleFinish = jest.fn();
const mockUseKonvaCanvas = jest.fn();
const mockUseNewShortcutsScope = jest.fn();
const mockShortcutsOn = jest.fn();
const mockUseStampMakerPanelStore = jest.fn();
const mockResetState = jest.fn();
const mockUndo = jest.fn();
const mockRedo = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  __esModule: true,
  default: {
    openNonstopProgress: mockOpenNonstopProgress,
    popById: mockPopById,
  },
}));

jest.mock('@core/app/widgets/FullWindowPanel/FullWindowPanel', () => {
  const { forwardRef } = jest.requireActual('react');

  return {
    __esModule: true,
    default: forwardRef(({ onClose, renderContents }: any, ref: any) => (
      <div data-testid="full-window-panel" ref={ref}>
        {renderContents && renderContents()}
        <button onClick={onClose}>Close</button>
      </div>
    )),
  };
});

jest.mock('@core/helpers/hooks/konva/useKonvaCanvas', () => mockUseKonvaCanvas);
jest.mock('@core/helpers/hooks/useNewShortcutsScope', () => mockUseNewShortcutsScope);
jest.mock('@core/helpers/image-edit-panel/preprocess', () => ({ preprocessByUrl: mockPreprocessByUrl }));
jest.mock('@core/helpers/image-edit-panel/calculate-base64', () => mockCalculateBase64);
jest.mock('@core/helpers/image-edit-panel/handle-finish', () => mockHandleFinish);
jest.mock('@core/helpers/shortcuts', () => ({ __esModule: true, default: { on: mockShortcutsOn } }));

jest.mock('./components/Sider', () => ({ handleComplete, onClose }: any) => (
  <div data-testid="sider">
    <button onClick={handleComplete}>Complete</button>
    <button onClick={onClose}>Close</button>
  </div>
));

jest.mock('./components/TopBar', () => ({ handleReset, handleZoomByScale, zoomScale }: any) => (
  <div data-testid="topbar">
    <button onClick={handleReset}>Reset</button>
    <button onClick={() => handleZoomByScale(1.2)}>Zoom In</button>
    <span>Zoom: {zoomScale}</span>
  </div>
));

jest.mock('./components/KonvaImage', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');

  return {
    __esModule: true,
    default: forwardRef(({ filters, horizontalFlip, src }: any, ref: any) => {
      useImperativeHandle(ref, () => ({
        _getCachedSceneCanvas: () => ({
          context: { _context: { getImageData: jest.fn(() => new ImageData(100, 100)) } },
        }),
        isCached: () => true,
      }));

      return (
        <div data-testid="konva-image">
          <span>Filters: {filters?.length || 0}</span>
          <span>Flip: {horizontalFlip ? 'true' : 'false'}</span>
          <span>Src: {src}</span>
        </div>
      );
    }),
  };
});

jest.mock('react-konva', () => ({
  Layer: ({ children, ref }: any) => {
    const { useEffect } = jest.requireActual('react');

    useEffect(() => {
      if (ref && ref.current) {
        Object.assign(ref.current, {});
      }
    });

    return (
      <div data-testid="layer" ref={ref}>
        {children}
      </div>
    );
  },
  Stage: ({ children, ref, ...props }: any) => {
    const { useEffect } = jest.requireActual('react');

    useEffect(() => {
      if (ref) {
        const mockStage = {
          batchDraw: jest.fn(),
          height: jest.fn(),
          position: jest.fn(),
          scale: jest.fn(),
          toDataURL: jest.fn(() => 'data:image/png;base64,test'),
          width: jest.fn(),
        };

        if (typeof ref === 'function') {
          ref(mockStage);
        } else if (ref.current !== undefined) {
          ref.current = mockStage;
        }
      }
    });

    return (
      <div data-testid="stage" ref={ref} {...props}>
        {children}
      </div>
    );
  },
}));

jest.mock('./store', () => ({
  useStampMakerPanelStore: mockUseStampMakerPanelStore,
}));

import StampMakerPanel from './index';

describe('test StampMakerPanel', () => {
  const mockOnClose = jest.fn();
  const mockImage = {
    getAttribute: jest.fn((attr) => {
      if (attr === 'data-shading') return 'true';

      if (attr === 'data-threshold') return '128';

      return null;
    }),
  } as unknown as SVGImageElement;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseStampMakerPanelStore.mockReturnValue({
      filters: [],
      horizontalFlip: false,
      lastBevelRadiusFilter: null,
      redo: mockRedo,
      resetState: mockResetState,
      undo: mockUndo,
    });

    mockUseKonvaCanvas.mockReturnValue({
      handleWheel: jest.fn(),
      handleZoom: jest.fn(),
      handleZoomByScale: jest.fn(),
      isDragging: false,
    });

    mockShortcutsOn.mockReturnValue(jest.fn());

    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'blob://test',
      originalHeight: 100,
      originalWidth: 100,
    });

    mockCalculateBase64.mockResolvedValue('data:image/png;base64,processed');

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(),
    }));

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      cb(0);

      return 0;
    });

    // Mock setTimeout to prevent initialization from running
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
      // Don't actually run the initialization timeout
      if (delay === 1000) {
        return 123 as any;
      }

      return jest.requireActual('timers').setTimeout(fn, delay);
    });

    // Mock div element dimensions
    Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', { configurable: true, value: 600 });
    Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', { configurable: true, value: 800 });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render correctly', () => {
    const { container } = render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'stamp-maker-init',
      message: 'Processing',
    });

    expect(container).toMatchSnapshot();
  });

  it('should call resetState on unmount', () => {
    const { unmount } = render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    unmount();
    expect(mockResetState).toHaveBeenCalled();
  });

  it('should render Sider with complete button', () => {
    const { getByText } = render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(getByText('Complete')).toBeInTheDocument();
  });

  it('should setup keyboard shortcuts', () => {
    render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(mockShortcutsOn).toHaveBeenCalledWith(['Escape'], mockOnClose, { isBlocking: true });
    expect(mockShortcutsOn).toHaveBeenCalledWith(['Fnkey+z'], mockUndo, { isBlocking: true });
    expect(mockShortcutsOn).toHaveBeenCalledWith(['Shift+Fnkey+z'], mockRedo, { isBlocking: true });
  });

  it('should handle zoom shortcuts', () => {
    const mockHandleZoomByScale = jest.fn();

    mockUseKonvaCanvas.mockReturnValue({
      handleWheel: jest.fn(),
      handleZoom: jest.fn(),
      handleZoomByScale: mockHandleZoomByScale,
      isDragging: false,
    });

    render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(mockShortcutsOn).toHaveBeenCalledWith(['Fnkey-+', 'Fnkey-='], expect.any(Function), {
      isBlocking: true,
      splitKey: '-',
    });
    expect(mockShortcutsOn).toHaveBeenCalledWith(['Fnkey+-'], expect.any(Function), {
      isBlocking: true,
    });
  });

  it('should render TopBar with zoom controls', () => {
    const { getByText } = render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(getByText('Reset')).toBeInTheDocument();
    expect(getByText('Zoom In')).toBeInTheDocument();
    expect(getByText(/Zoom:/)).toBeInTheDocument();
  });

  it('should pass correct props to components', () => {
    const { getByTestId } = render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(getByTestId('sider')).toBeInTheDocument();
    expect(getByTestId('topbar')).toBeInTheDocument();
    expect(getByTestId('stage')).toBeInTheDocument();
    expect(getByTestId('layer')).toBeInTheDocument();
    expect(getByTestId('konva-image')).toBeInTheDocument();
  });

  it('should handle image with bevel filter correctly', () => {
    const mockBevelFilter = { name: 'BevelFilter' };

    mockUseStampMakerPanelStore.mockReturnValue({
      filters: [mockBevelFilter],
      horizontalFlip: false,
      lastBevelRadiusFilter: mockBevelFilter,
      redo: mockRedo,
      resetState: mockResetState,
      undo: mockUndo,
    });

    render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(mockUseStampMakerPanelStore).toHaveBeenCalled();
  });

  it('should handle image without bevel filter', () => {
    mockUseStampMakerPanelStore.mockReturnValue({
      filters: [],
      horizontalFlip: false,
      lastBevelRadiusFilter: null,
      redo: mockRedo,
      resetState: mockResetState,
      undo: mockUndo,
    });

    render(<StampMakerPanel image={mockImage} onClose={mockOnClose} src="test.png" />);

    expect(mockUseStampMakerPanelStore).toHaveBeenCalled();
  });
});
