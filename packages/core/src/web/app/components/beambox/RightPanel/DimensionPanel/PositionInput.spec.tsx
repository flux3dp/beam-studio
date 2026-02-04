import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import PositionInput from './PositionInput';

const mockCreateEventEmitter = jest.fn();
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args: any) => mockCreateEventEmitter(...args),
}));

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('../ObjectPanelItem', () => ({
  Number: ({ id, label, updateValue, value }: any) => (
    <div id={id}>
      {label}
      <div>{value}</div>
      <button onClick={() => updateValue(value + 1)} type="button" />
    </div>
  ),
}));

const mockGetValue = jest.fn();

jest.mock('./utils', () => ({
  getValue: (...args: any) => mockGetValue(...args),
}));

const mockOnChange = jest.fn();

describe('test PositionInput', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockCreateEventEmitter.mockReturnValue({
      on: mockOn,
      removeListener: mockRemoveListener,
    });
  });

  it('should render correctly on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container, rerender } = render(<PositionInput onChange={mockOnChange} type="x" value={0} />);

    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="y" value={0} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="x1" value={0} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="y1" value={0} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="x2" value={0} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="y2" value={0} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="cx" value={0} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput onChange={mockOnChange} type="cy" value={0} />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<PositionInput onChange={mockOnChange} type="x" value={0} />);

    expect(container).toMatchSnapshot();
  });

  test('onChange on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<PositionInput onChange={mockOnChange} type="x" value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: 1 } });
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith('x', 1);
  });

  test('UPDATE_DIMENSION_VALUES event on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container, unmount } = render(<PositionInput onChange={mockOnChange} type="x" value={0} />);

    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockOn).toBeCalledTimes(1);
    expect(mockOn).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', expect.any(Function));
    expect(mockRemoveListener).toBeCalledTimes(0);
    mockGetValue.mockReturnValue(1);

    const handler = mockOn.mock.calls[0][1];

    handler({ x: 10 });
    expect(mockGetValue).toBeCalledTimes(1);
    expect(mockGetValue).toHaveBeenNthCalledWith(1, { x: 10 }, 'x', {
      allowUndefined: true,
      unit: 'mm',
    });
    expect(container.querySelector('input').value).toBe('1.00');
    unmount();
    expect(mockRemoveListener).toBeCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', handler);
  });

  test('onChange on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<PositionInput onChange={mockOnChange} type="x" value={0} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith('x', 1);
  });
});
