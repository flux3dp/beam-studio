import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ZoomableTopBar, { type UndoRedoConfig } from './index';

jest.mock('@core/app/icons/top-bar/TopBarIcons', () => ({
  Redo: () => <span>RedoIcon</span>,
  Undo: () => <span>UndoIcon</span>,
}));

describe('ZoomableTopBar', () => {
  const mockHandleReset = jest.fn();
  const mockHandleZoomByScale = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render with minimum required props', () => {
      const { container } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      expect(container.querySelector('.top-bar')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ZoomableTopBar
          className="custom-class"
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          zoomScale={1}
        />,
      );

      expect(container.querySelector('.top-bar.custom-class')).toBeInTheDocument();
    });

    it('should render leftContent when provided', () => {
      const { getByText } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          leftContent={<div>Custom Left Content</div>}
          zoomScale={1}
        />,
      );

      expect(getByText('Custom Left Content')).toBeInTheDocument();
    });
  });

  describe('Zoom controls', () => {
    it('should display current zoom percentage', () => {
      const { getByText } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1.5} />,
      );

      expect(getByText('150%')).toBeInTheDocument();
    });

    it('should round zoom percentage to nearest integer', () => {
      const { getByText } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={0.754} />,
      );

      expect(getByText('75%')).toBeInTheDocument();
    });

    it('should handle zoom out button click', () => {
      const { getByTitle } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      fireEvent.click(getByTitle('Zoom Out'));
      expect(mockHandleZoomByScale).toHaveBeenCalledWith(0.8);
    });

    it('should handle zoom in button click', () => {
      const { getByTitle } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      fireEvent.click(getByTitle('Zoom In'));
      expect(mockHandleZoomByScale).toHaveBeenCalledWith(1.2);
    });

    it('should hide zoom percentage when showZoomPercentage is false', () => {
      const { queryByText } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          showZoomPercentage={false}
          zoomScale={1}
        />,
      );

      expect(queryByText('100%')).not.toBeInTheDocument();
    });
  });

  describe('Zoom dropdown menu', () => {
    it('should open dropdown menu on zoom percentage click', async () => {
      const { getByText } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      const zoomDisplay = getByText('100%');

      fireEvent.click(zoomDisplay);

      await waitFor(
        () => {
          expect(screen.getByText('25%')).toBeVisible();
          expect(screen.getByText('50%')).toBeVisible();
          expect(screen.getByText('75%')).toBeVisible();
          expect(screen.getByText('150%')).toBeVisible();
          expect(screen.getByText('200%')).toBeVisible();
        },
        { timeout: 3000 },
      );
    });

    it('should handle fit to window option', async () => {
      const { container } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      const zoomDisplay = container.querySelector('.zoom-display');

      fireEvent.click(zoomDisplay!);

      await waitFor(() => {
        const fitToWindow = screen.getByText('Fit to Window');

        fireEvent.click(fitToWindow);
      });

      expect(mockHandleReset).toHaveBeenCalled();
    });

    it('should handle preset zoom selection', async () => {
      const { container } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      const zoomDisplay = container.querySelector('.zoom-display');

      fireEvent.click(zoomDisplay!);

      await waitFor(() => {
        const preset50 = screen.getAllByText('50%').find((el) => el.closest('.ant-dropdown-menu-item'));

        expect(preset50).toBeVisible();
        fireEvent.click(preset50!);
      });

      // Should calculate scale factor to reach 50% from current 100%
      expect(mockHandleZoomByScale).toHaveBeenCalledWith(0.5);
    });

    it('should use custom zoom presets', async () => {
      const { getByText } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          zoomPresets={[10, 20, 30]}
          zoomScale={1}
        />,
      );

      const zoomDisplay = getByText('100%');

      fireEvent.click(zoomDisplay);

      await waitFor(() => {
        expect(screen.getByText('10%')).toBeVisible();
        expect(screen.getByText('20%')).toBeVisible();
        expect(screen.getByText('30%')).toBeVisible();
        expect(screen.queryByText('25%')).not.toBeInTheDocument();
      });
    });
  });

  describe('Undo/Redo functionality', () => {
    const mockUndoRedoConfig: UndoRedoConfig = {
      onRedo: jest.fn(),
      onUndo: jest.fn(),
      redoable: true,
      undoable: true,
    };

    it('should render undo/redo buttons when config provided', () => {
      const { getByTitle } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          undoRedo={mockUndoRedoConfig}
          zoomScale={1}
        />,
      );

      expect(getByTitle('Undo')).toBeInTheDocument();
      expect(getByTitle('Redo')).toBeInTheDocument();
    });

    it('should call onUndo when undo button clicked', () => {
      const { getByTitle } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          undoRedo={mockUndoRedoConfig}
          zoomScale={1}
        />,
      );

      fireEvent.click(getByTitle('Undo'));
      expect(mockUndoRedoConfig.onUndo).toHaveBeenCalled();
    });

    it('should call onRedo when redo button clicked', () => {
      const { getByTitle } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          undoRedo={mockUndoRedoConfig}
          zoomScale={1}
        />,
      );

      fireEvent.click(getByTitle('Redo'));
      expect(mockUndoRedoConfig.onRedo).toHaveBeenCalled();
    });

    it('should disable undo button when undoable is false', () => {
      const config = { ...mockUndoRedoConfig, undoable: false };
      const { getByTitle } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          undoRedo={config}
          zoomScale={1}
        />,
      );

      expect(getByTitle('Undo')).toBeDisabled();
    });

    it('should disable redo button when redoable is false', () => {
      const config = { ...mockUndoRedoConfig, redoable: false };
      const { getByTitle } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          undoRedo={config}
          zoomScale={1}
        />,
      );

      expect(getByTitle('Redo')).toBeDisabled();
    });

    it('should prefer leftContent over undoRedo buttons', () => {
      const { getByText, queryByTitle } = render(
        <ZoomableTopBar
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          leftContent={<div>Custom Content</div>}
          undoRedo={mockUndoRedoConfig}
          zoomScale={1}
        />,
      );

      expect(getByText('Custom Content')).toBeInTheDocument();
      expect(queryByTitle('Undo')).not.toBeInTheDocument();
      expect(queryByTitle('Redo')).not.toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex zoom scale changes', async () => {
      const { container, rerender } = render(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={2} />,
      );

      // Check initial zoom display
      const zoomDisplay = container.querySelector('.zoom-display');

      expect(zoomDisplay).toHaveTextContent('200%');

      // Click dropdown to open it
      fireEvent.click(zoomDisplay!);

      // Wait for dropdown to appear and click on 100% option
      await waitFor(() => {
        const preset100 = screen.getAllByText('100%').find((el) => el.closest('.ant-dropdown-menu-item'));

        expect(preset100).toBeVisible();
        fireEvent.click(preset100!);
      });

      // Should calculate scale factor to go from 200% to 100%
      expect(mockHandleZoomByScale).toHaveBeenCalledWith(0.5);

      // Simulate zoom scale update
      rerender(
        <ZoomableTopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
      );

      expect(zoomDisplay).toHaveTextContent('100%');
    });

    it('should work with all features enabled', () => {
      const undoRedoConfig: UndoRedoConfig = {
        onRedo: jest.fn(),
        onUndo: jest.fn(),
        redoable: true,
        undoable: false,
      };

      const { getByText, getByTitle } = render(
        <ZoomableTopBar
          className="test-class"
          handleReset={mockHandleReset}
          handleZoomByScale={mockHandleZoomByScale}
          showZoomPercentage={true}
          undoRedo={undoRedoConfig}
          zoomPresets={[50, 100, 200]}
          zoomScale={1.25}
        />,
      );

      // Check zoom display
      expect(getByText('125%')).toBeInTheDocument();

      // Check undo/redo buttons
      expect(getByTitle('Undo')).toBeDisabled();
      expect(getByTitle('Redo')).not.toBeDisabled();

      // Check zoom buttons
      expect(getByTitle('Zoom In')).toBeInTheDocument();
      expect(getByTitle('Zoom Out')).toBeInTheDocument();
    });
  });
});
