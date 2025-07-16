import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const mockUseImageEditPanelStore = jest.fn();
const mockSetBrushSize = jest.fn();
const mockState = {
  brushSize: 20,
  setBrushSize: mockSetBrushSize,
};

jest.mock('../../store', () => ({
  useImageEditPanelStore: mockUseImageEditPanelStore,
}));

import Eraser from './Eraser';

describe('test Eraser', () => {
  beforeEach(() => {
    mockUseImageEditPanelStore.mockImplementation((pick?) => {
      if (pick) {
        return pick(mockState);
      }

      return mockState;
    });
  });

  it('should render correctly', () => {
    const { container } = render(<Eraser />);

    expect(container).toMatchSnapshot();
  });

  test('setValue', () => {
    const { container } = render(<Eraser />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '50' } });

    expect(mockSetBrushSize).toHaveBeenCalledWith(50);
  });
});
