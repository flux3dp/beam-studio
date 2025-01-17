/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigValueDisplay from './ConfigValueDisplay';

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ id, min, max, unit, defaultValue, decimal, displayMultiValue, getValue, disabled }: any) =>
      (
        <div>
          MockUnitInput
          <p>id: {id}</p>
          <p>min: {min}</p>
          <p>max: {max}</p>
          <p>unit: {unit}</p>
          <p>defaultValue: {defaultValue}</p>
          <p>decimal: {decimal}</p>
          <p>displayMultiValue: {displayMultiValue}</p>
          <p>disabled: {disabled ? 'y' : 'n'}</p>
          <button type="button" onClick={() => getValue(7)}>
            change
          </button>
        </div>
      )
);

jest.mock('antd', () => ({
  ConfigProvider: ({ children, ...props }: any) => (
    <div>
      <p>Props: {JSON.stringify(props)}</p>
      {children}
    </div>
  ),
  InputNumber: ({ className, type, min, max, value, onChange, precision, controls }: any) => (
    <div>
      Mock InputNumber
      <p>precision: {precision}</p>
      <p>controls: {controls ? 'y' : 'n'}</p>
      <input
        className={className}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  ),
}));

describe('test ConfigValueDisplay when type is not panel-item', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigValueDisplay
        inputId="mock-input-id"
        type="default"
        max={100}
        min={0}
        value={5}
        unit="mm"
        hasMultiValue={false}
        decimal={2}
        onChange={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <ConfigValueDisplay
        inputId="mock-input-id"
        type="default"
        max={100}
        min={0}
        value={5}
        unit="mm"
        hasMultiValue={false}
        decimal={2}
        onChange={mockOnChange}
      />
    );
    fireEvent.click(getByText('change'));
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 7);
  });
});

describe('test ConfigValueDisplay when type is panel-item', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigValueDisplay
        inputId="mock-input-id"
        type="panel-item"
        max={100}
        min={0}
        value={5}
        unit="mm"
        hasMultiValue={false}
        decimal={2}
        onChange={() => {}}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <ConfigValueDisplay
        inputId="mock-input-id"
        type="panel-item"
        max={100}
        min={0}
        value={5}
        unit="mm"
        hasMultiValue={false}
        decimal={2}
        onChange={mockOnChange}
      />
    );
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '7' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 7);
  });
});
