import React from 'react';

import { render } from '@testing-library/react';

const mockUseStampMakerPanelStore = jest.fn();
const mockRedo = jest.fn();
const mockUndo = jest.fn();

jest.mock('../../store', () => ({
  useStampMakerPanelStore: mockUseStampMakerPanelStore,
}));

jest.mock('@core/app/components/common/ZoomableTopBar', () => ({
  __esModule: true,
  default: jest.fn(({ handleReset, handleZoomByScale, undoRedo, zoomScale, ...props }) => (
    <div data-testid="zoomable-topbar">
      <div data-testid="undo-redo-config">
        {JSON.stringify({
          redoable: undoRedo.redoable,
          undoable: undoRedo.undoable,
        })}
      </div>
      <div data-testid="props">
        {JSON.stringify({
          hasHandleReset: typeof handleReset === 'function',
          hasHandleZoomByScale: typeof handleZoomByScale === 'function',
          zoomScale,
          ...props,
        })}
      </div>
    </div>
  )),
}));

import TopBar from './index';

describe('test StampMakerPanel TopBar wrapper', () => {
  const mockHandleReset = jest.fn();
  const mockHandleZoomByScale = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: { index: 1, operations: [{ mode: 'filter' }, { mode: 'filter' }] },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });
  });

  it('should render ZoomableTopBar with correct props', () => {
    const { getByTestId } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1.5} />,
    );

    const propsElement = getByTestId('props');
    const props = JSON.parse(propsElement.textContent!);

    expect(props.hasHandleReset).toBe(true);
    expect(props.hasHandleZoomByScale).toBe(true);
    expect(props.zoomScale).toBe(1.5);
  });

  it('should pass correct undo/redo config when both are enabled', () => {
    const { getByTestId } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const configElement = getByTestId('undo-redo-config');
    const config = JSON.parse(configElement.textContent!);

    expect(config.undoable).toBe(true); // index (1) > 0
    expect(config.redoable).toBe(true); // index (1) < operations.length (2)
  });

  it('should disable undo when index is 0', () => {
    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: { index: 0, operations: [{ mode: 'filter' }] },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const configElement = getByTestId('undo-redo-config');
    const config = JSON.parse(configElement.textContent!);

    expect(config.undoable).toBe(false);
    expect(config.redoable).toBe(true);
  });

  it('should disable redo when index equals operations length', () => {
    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: { index: 2, operations: [{ mode: 'filter' }, { mode: 'filter' }] },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const configElement = getByTestId('undo-redo-config');
    const config = JSON.parse(configElement.textContent!);

    expect(config.undoable).toBe(true);
    expect(config.redoable).toBe(false);
  });

  it('should disable both undo and redo when appropriate', () => {
    mockUseStampMakerPanelStore.mockImplementation((selector) => {
      const state = {
        history: { index: 0, operations: [] },
        redo: mockRedo,
        undo: mockUndo,
      };

      return selector ? selector(state) : state;
    });

    const { getByTestId } = render(
      <TopBar handleReset={mockHandleReset} handleZoomByScale={mockHandleZoomByScale} zoomScale={1} />,
    );

    const configElement = getByTestId('undo-redo-config');
    const config = JSON.parse(configElement.textContent!);

    expect(config.undoable).toBe(false);
    expect(config.redoable).toBe(false);
  });
});
