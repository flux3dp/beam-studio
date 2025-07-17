import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockUseImageEditPanelStore = jest.fn();
const mockSetCornerRadius = jest.fn();
const mockState = {
  cornerRadius: 50,
  setCornerRadius: mockSetCornerRadius,
};

jest.mock('../../store', () => ({
  useImageEditPanelStore: mockUseImageEditPanelStore,
}));

import CornerRadius from './CornerRadius';

describe('test CornerRadius', () => {
  beforeEach(() => {
    mockUseImageEditPanelStore.mockImplementation((pick?) => {
      if (pick) {
        return pick(mockState);
      }

      return mockState;
    });
  });

  it('should render correctly', () => {
    const { container } = render(<CornerRadius />);

    expect(container).toMatchSnapshot();
  });

  test('setValue', () => {
    const { container } = render(<CornerRadius />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '75' } });

    expect(mockSetCornerRadius).toHaveBeenCalledWith(75, false);

    fireEvent.blur(input);
    // mock state did not change, so it is still 50
    expect(mockSetCornerRadius).toHaveBeenCalledWith(50, true);
  });
});
