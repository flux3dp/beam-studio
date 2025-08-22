import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockUseI18n = jest.fn();
const mockUseStampMakerPanelStore = jest.fn();
const mockRedo = jest.fn();
const mockUndo = jest.fn();

jest.mock('@core/helpers/useI18n', () => mockUseI18n);
jest.mock('../../store', () => ({
  useStampMakerPanelStore: mockUseStampMakerPanelStore,
}));

import TopBar from './index';

describe('test TopBar', () => {
  const mockHandleReset = jest.fn();
  const mockHandleZoomByScale = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseI18n.mockReturnValue({
      global: {
        editing: {
          redo: 'Redo',
          reset: 'Reset',
          undo: 'Undo',
          zoom_in: 'Zoom In',
          zoom_out: 'Zoom Out',
        },
      },
    });

    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: {
          index: 1,
          operations: [{ mode: 'filter' }, { mode: 'filter' }],
        },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });
  });

  it('should render correctly', () => {
    const { container } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should display zoom scale percentage', () => {
    const { getByText } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1.5} />,
    );

    expect(getByText('150%')).toBeInTheDocument();
  });

  it('should handle zoom out', () => {
    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const zoomOutButton = getByTitle('Zoom Out');

    fireEvent.click(zoomOutButton);

    expect(mockHandleZoomByScale).toHaveBeenCalledWith(0.8);
  });

  it('should handle zoom in', () => {
    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const zoomInButton = getByTitle('Zoom In');

    fireEvent.click(zoomInButton);

    expect(mockHandleZoomByScale).toHaveBeenCalledWith(1.2);
  });

  it('should handle reset', () => {
    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const resetButton = getByTitle('Reset');

    fireEvent.click(resetButton);

    expect(mockHandleReset).toHaveBeenCalled();
  });

  it('should handle undo when enabled', () => {
    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const undoButton = getByTitle('Undo');

    expect(undoButton).not.toBeDisabled();

    fireEvent.click(undoButton);
    expect(mockUndo).toHaveBeenCalled();
  });

  it('should disable undo when index is 0', () => {
    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: {
          index: 0,
          operations: [],
        },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });

    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const undoButton = getByTitle('Undo');

    expect(undoButton).toBeDisabled();
  });

  it('should handle redo when enabled', () => {
    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const redoButton = getByTitle('Redo');

    expect(redoButton).not.toBeDisabled();

    fireEvent.click(redoButton);
    expect(mockRedo).toHaveBeenCalled();
  });

  it('should disable redo when index equals operations length', () => {
    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: {
          index: 2,
          operations: [{ mode: 'filter' }, { mode: 'filter' }],
        },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });

    const { getByTitle } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const redoButton = getByTitle('Redo');

    expect(redoButton).toBeDisabled();
  });

  it('should round zoom scale to nearest integer', () => {
    const { getByText } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={0.754} />,
    );

    expect(getByText('75%')).toBeInTheDocument();
  });
});
