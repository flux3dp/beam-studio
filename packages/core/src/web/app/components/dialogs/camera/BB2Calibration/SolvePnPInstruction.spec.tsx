import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SolvePnPInstruction from './SolvePnPInstruction';

const mockOnClose = jest.fn();
const mockOnNext = jest.fn();
const mockOnPrev = jest.fn();

describe('test SolvePnPInstruction', () => {
  it('should render correctly', () => {
    const { baseElement } = render(
      <SolvePnPInstruction onClose={mockOnClose} onNext={mockOnNext} onPrev={mockOnPrev} />,
    );

    expect(baseElement).toMatchSnapshot();
  });

  test('should call onClose when close button is clicked', () => {
    const { baseElement } = render(
      <SolvePnPInstruction onClose={mockOnClose} onNext={mockOnNext} onPrev={mockOnPrev} />,
    );

    const closeButton = baseElement.querySelector('.ant-modal-close');

    fireEvent.click(closeButton!);

    expect(mockOnClose).toHaveBeenCalledWith(false);
  });

  test('onNext and onPrev should be called when respective buttons are clicked', () => {
    const { getByText } = render(<SolvePnPInstruction onClose={mockOnClose} onNext={mockOnNext} onPrev={mockOnPrev} />);

    const nextButton = getByText('Next');
    const prevButton = getByText('Back');

    expect(mockOnNext).not.toHaveBeenCalled();
    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalled();

    expect(mockOnPrev).not.toHaveBeenCalled();
    fireEvent.click(prevButton);
    expect(mockOnPrev).toHaveBeenCalled();
  });
});
