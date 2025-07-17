import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockUseImageEditPanelStore = jest.fn();
const mockSetTolerance = jest.fn();
const mockState = {
  setTolerance: mockSetTolerance,
  tolerance: 20,
};

jest.mock('../../store', () => ({
  useImageEditPanelStore: mockUseImageEditPanelStore,
}));

import MagicWand from './MagicWand';

describe('test MagicWand', () => {
  beforeEach(() => {
    mockUseImageEditPanelStore.mockImplementation((pick?) => {
      if (pick) {
        return pick(mockState);
      }

      return mockState;
    });
  });

  it('should render correctly', () => {
    const { container } = render(<MagicWand />);

    expect(container).toMatchSnapshot();
  });

  test('setValue', () => {
    const { container } = render(<MagicWand />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '70' } });

    expect(mockSetTolerance).toHaveBeenCalledWith(70);
  });
});
