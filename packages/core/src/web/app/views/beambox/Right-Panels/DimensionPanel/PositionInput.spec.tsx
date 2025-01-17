import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import PositionInput from './PositionInput';

const mockCreateEventEmitter = jest.fn();
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args: any) => mockCreateEventEmitter(...args),
}));

const mockGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Number: ({ id, value, updateValue, label }: any) => (
    <div id={id}>
      {label}
      <div>{value}</div>
      <button type="button" onClick={() => updateValue(value + 1)} />
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
    const { container, rerender } = render(<PositionInput type="x" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="y" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="x1" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="y1" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="x2" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="y2" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="cx" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
    rerender(<PositionInput type="cy" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    const { container } = render(<PositionInput type="x" value={0} onChange={mockOnChange} />);
    expect(container).toMatchSnapshot();
  });

  test('onChange on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);
    const { container } = render(<PositionInput type="x" value={0} onChange={mockOnChange} />);
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: 1 } });
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith('x', 1);
  });

  test('UPDATE_DIMENSION_VALUES event on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);
    const { container, unmount } = render(<PositionInput type="x" value={0} onChange={mockOnChange} />);
    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockOn).toBeCalledTimes(1);
    expect(mockOn).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', expect.any(Function));
    expect(mockRemoveListener).toBeCalledTimes(0);
    mockGetValue.mockReturnValue(1);
    const handler = mockOn.mock.calls[0][1];
    handler({ x: 10 });
    expect(mockGetValue).toBeCalledTimes(1);
    expect(mockGetValue).toHaveBeenNthCalledWith(1, { x: 10 }, 'x', { unit: 'mm', allowUndefined: true });
    expect(container.querySelector('input').value).toBe('1.00');
    unmount();
    expect(mockRemoveListener).toBeCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', handler);
  });

  test('onChange on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    const { container } = render(<PositionInput type="x" value={0} onChange={mockOnChange} />);
    const button = container.querySelector('button');
    fireEvent.click(button);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith('x', 1);
  });
});
