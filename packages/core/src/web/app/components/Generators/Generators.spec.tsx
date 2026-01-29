import React from 'react';

import { fireEvent, render } from '@testing-library/react';

// Mock dependencies before importing the component
const mockSetDrawerMode = jest.fn();
const mockOnClick = jest.fn();

jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: () => ({
    setDrawerMode: mockSetDrawerMode,
  }),
}));

// Mock the generators config to avoid dialog-caller dependency
jest.mock('./generators.config', () => ({
  getGenerators: () => [
    {
      icon: <span data-testid="box-icon">BoxIcon</span>,
      id: 'box',
      onClick: mockOnClick,
      titleKey: 'box_generator',
    },
    {
      icon: <span data-testid="code-icon">CodeIcon</span>,
      id: 'code',
      onClick: mockOnClick,
      titleKey: 'code_generator',
    },
    {
      icon: <span data-testid="material-icon">MaterialIcon</span>,
      id: 'material-test',
      onClick: mockOnClick,
      titleKey: 'material_test_generator',
    },
  ],
}));

// Import after mocks are set up
import Generators from './index';

describe('Generators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<Generators />);

    expect(container).toMatchSnapshot();
  });

  it('should render header with title', () => {
    const { container } = render(<Generators />);

    expect(container.querySelector('h2')).toHaveTextContent('Generators');
  });

  it('should render all generator items', () => {
    const { getByText } = render(<Generators />);

    expect(getByText('Box Generator')).toBeInTheDocument();
    expect(getByText('Code Generator')).toBeInTheDocument();
    expect(getByText('Material Test Generator')).toBeInTheDocument();
  });

  it('should close drawer and call onClick when clicking a generator item', () => {
    const { getByText } = render(<Generators />);

    fireEvent.click(getByText('Box Generator'));

    expect(mockSetDrawerMode).toHaveBeenCalledWith('none');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard Enter key on generator items', () => {
    const { getByText } = render(<Generators />);

    fireEvent.keyDown(getByText('Box Generator'), { key: 'Enter' });

    expect(mockSetDrawerMode).toHaveBeenCalledWith('none');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard Space key on generator items', () => {
    const { getByText } = render(<Generators />);

    fireEvent.keyDown(getByText('Code Generator'), { key: ' ' });

    expect(mockSetDrawerMode).toHaveBeenCalledWith('none');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render icons for each generator', () => {
    const { getByTestId } = render(<Generators />);

    expect(getByTestId('box-icon')).toBeInTheDocument();
    expect(getByTestId('code-icon')).toBeInTheDocument();
    expect(getByTestId('material-icon')).toBeInTheDocument();
  });
});
