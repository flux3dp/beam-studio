import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { DEFAULT_CONTROLLER_MM } from '@core/app/constants/boxgen-constants';

import Controller from './Controller';

const mockSetBoxData = jest.fn();

jest.mock('@core/app/stores/boxgenStore', () => ({
  useBoxgenStore: jest.fn(() => ({
    boxData: DEFAULT_CONTROLLER_MM,
    setBoxData: mockSetBoxData,
  })),
}));

jest.mock('./useBoxgenWorkarea', () => () => ({
  lengthUnit: { decimal: 2, unit: 'mm', unitRatio: 1 },
  workarea: { canvasHeight: 210, canvasWidth: 300, label: 'beamo', value: 'fbm1' },
}));

describe('test Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    const { container } = render(<Controller />);

    expect(container).toMatchSnapshot();
  });

  test('should call setBoxData when changing volume', () => {
    const { container } = render(<Controller />);

    fireEvent.click(container.querySelector('input[value="inner"]')!);
    expect(mockSetBoxData).toHaveBeenCalledTimes(1);
    expect(mockSetBoxData).toHaveBeenLastCalledWith({
      ...DEFAULT_CONTROLLER_MM,
      depth: 86,
      height: 86,
      volume: 'inner',
      width: 86,
    });
  });

  test('should call setBoxData when changing width', () => {
    const { container } = render(<Controller />);

    // First change to inner
    fireEvent.click(container.querySelector('input[value="inner"]')!);

    // Then change width
    fireEvent.change(container.querySelector('input#width')!, { target: { value: 90 } });
    expect(mockSetBoxData).toHaveBeenCalledTimes(2);
    expect(mockSetBoxData).toHaveBeenLastCalledWith({
      ...DEFAULT_CONTROLLER_MM,
      depth: 86,
      height: 86,
      volume: 'inner',
      width: 96,
    });
  });
});
