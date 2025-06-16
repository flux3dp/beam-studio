import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockSetCornerType = jest.fn();
const mockSetMode = jest.fn();
const mockSetDistance = jest.fn();
const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: mockGet,
}));

jest.mock('@core/app/widgets/Unit-Input-v2', () => ({ defaultValue, getValue, min, unit }: any) => (
  <div>
    mock-unit-input min:{min}
    unit:{unit}
    defaultValue:{defaultValue}
    <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
  </div>
));

import OffsetPanel from './index';

describe('OffsetPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(undefined); // Default to mm
  });

  it('default unit is mm', () => {
    const { container } = render(
      <OffsetPanel
        offset={{
          cornerType: 'sharp',
          distance: 5,
          mode: 'outward',
        }}
        setCornerType={mockSetCornerType}
        setDistance={mockSetDistance}
        setMode={mockSetMode}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('p.caption'));
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('#select-offset-dir'), { target: { value: 'outward' } });
    expect(mockSetMode).toHaveBeenCalledTimes(1);
    expect(mockSetMode).toHaveBeenNthCalledWith(1, 'outward');
    expect(mockSetDistance).toHaveBeenCalledTimes(1);
    expect(mockSetDistance).toHaveBeenNthCalledWith(1, 5);
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 50 } });
    expect(mockSetDistance).toHaveBeenCalledTimes(2);
    expect(mockSetDistance).toHaveBeenNthCalledWith(2, 50);
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('#select-offset-corner'), { target: { value: 'round' } });
    expect(mockSetCornerType).toHaveBeenCalledTimes(1);
    expect(mockSetCornerType).toHaveBeenNthCalledWith(1, 'round');
    expect(container).toMatchSnapshot();
  });

  it('default unit is inches', () => {
    mockGet.mockReturnValue('inches');

    const { container } = render(
      <OffsetPanel
        offset={{
          cornerType: 'sharp',
          distance: 5,
          mode: 'outward',
        }}
        setCornerType={mockSetCornerType}
        setDistance={mockSetDistance}
        setMode={mockSetMode}
      />,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('p.caption'));
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('select'), { target: { value: 'inward' } });
    expect(mockSetMode).toHaveBeenCalledTimes(1);
    expect(mockSetMode).toHaveBeenNthCalledWith(1, 'inward');
    expect(container).toMatchSnapshot();
  });
});
