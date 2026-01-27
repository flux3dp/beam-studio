import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import Boxgen from './Boxgen';

jest.mock('@core/app/stores/boxgenStore', () => ({
  useBoxgenStore: jest.fn(() => ({
    boxData: {
      cover: true,
      depth: 80,
      height: 80,
      joint: 'finger',
      sheetThickness: 3,
      teethLength: 40,
      tSlotCount: 0,
      tSlotDiameter: 3,
      tSlotLength: 16,
      volume: 'outer',
      width: 80,
    },
    reset: jest.fn(),
    setBoxData: jest.fn(),
  })),
}));

jest.mock('@core/app/widgets/DraggableModal', () => ({ children, footer, onCancel, title }: any) => (
  <div data-testid="draggable-modal">
    <div>title: {title}</div>
    <div>{children}</div>
    <div>{footer}</div>
    <button onClick={onCancel} type="button">
      close
    </button>
  </div>
));

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock('./BoxCanvas', () => () => <div data-testid="mock-canvas">mock-canvas</div>);
jest.mock('./BoxSelector', () => () => <div data-testid="mock-box-selector">mock-box-selector</div>);
jest.mock('./Controller', () => () => <div data-testid="mock-box-controller">mock-box-controller</div>);
jest.mock('./ExportButton', () => ({ onClose }: { onClose: () => void }) => (
  <button data-testid="mock-export-button" onClick={onClose} type="button">
    mock-export-button
  </button>
));

const mockOnClose = jest.fn();

describe('test Boxgen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    const { container } = render(<Boxgen onClose={mockOnClose} />);

    expect(container).toMatchSnapshot();
  });

  test('should call onClose when close button is clicked', async () => {
    const { container } = render(<Boxgen onClose={mockOnClose} />);

    const button = container.querySelector('button');

    fireEvent.click(button!);
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });

  test('should call onClose when export button is clicked', async () => {
    const { getByTestId } = render(<Boxgen onClose={mockOnClose} />);

    const exportButton = getByTestId('mock-export-button');

    fireEvent.click(exportButton);
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });
});
