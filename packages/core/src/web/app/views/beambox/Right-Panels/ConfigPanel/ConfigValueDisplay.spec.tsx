import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigValueDisplay from './ConfigValueDisplay';

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ decimal, defaultValue, disabled, displayMultiValue, getValue, id, max, min, unit }: any) => (
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
        <button onClick={() => getValue(7)} type="button">
          change
        </button>
      </div>
    ),
);

jest.mock('antd', () => ({
  ConfigProvider: ({ children, ...props }: any) => (
    <div>
      <p>Props: {JSON.stringify(props)}</p>
      {children}
    </div>
  ),
  InputNumber: ({ className, controls, max, min, onChange, precision, type, value }: any) => (
    <div>
      Mock InputNumber
      <p>precision: {precision}</p>
      <p>controls: {controls ? 'y' : 'n'}</p>
      <input
        className={className}
        max={max}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        type={type}
        value={value}
      />
    </div>
  ),
}));

describe('test ConfigValueDisplay when type is not panel-item', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={() => {}}
        type="default"
        unit="mm"
        value={5}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const mockOnChange = jest.fn();
    const { getByText } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={mockOnChange}
        type="default"
        unit="mm"
        value={5}
      />,
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
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={() => {}}
        type="panel-item"
        unit="mm"
        value={5}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const mockOnChange = jest.fn();
    const { container } = render(
      <ConfigValueDisplay
        decimal={2}
        hasMultiValue={false}
        inputId="mock-input-id"
        max={100}
        min={0}
        onChange={mockOnChange}
        type="panel-item"
        unit="mm"
        value={5}
      />,
    );
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '7' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 7);
  });
});
