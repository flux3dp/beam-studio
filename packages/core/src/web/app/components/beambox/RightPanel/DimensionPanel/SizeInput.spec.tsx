import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import SizeInput from './SizeInput';

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
const mockOnBlur = jest.fn();

describe('test SizeInput', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockCreateEventEmitter.mockReturnValue({
      on: mockOn,
      removeListener: mockRemoveListener,
    });
  });

  it('should render correctly on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<SizeInput onChange={mockOnChange} type="w" value={0} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<SizeInput onChange={mockOnChange} type="w" value={0} />);

    expect(container).toMatchSnapshot();
  });

  test('onChange on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<SizeInput onChange={mockOnChange} type="w" value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: 1 } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith('width', 1);
  });

  test('UPDATE_DIMENSION_VALUES event on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container, unmount } = render(<SizeInput onChange={mockOnChange} type="w" value={0} />);

    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledWith('UPDATE_DIMENSION_VALUES', expect.any(Function));
    expect(mockRemoveListener).toHaveBeenCalledTimes(0);

    const handler = mockOn.mock.calls[0][1];

    mockGetValue.mockReturnValue(1);
    handler({ width: 10 });
    expect(container.querySelector('input').value).toBe('1.00');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenNthCalledWith(1, { width: 10 }, 'w', {
      allowUndefined: true,
      unit: 'mm',
    });
    unmount();
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', handler);
  });

  test('onChange on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<SizeInput onChange={mockOnChange} type="w" value={0} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith('width', 1);
  });

  test('onBlur', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<SizeInput onBlur={mockOnBlur} onChange={mockOnChange} type="w" value={0} />);
    const input = container.querySelector('input');

    fireEvent.blur(input);
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });
});
