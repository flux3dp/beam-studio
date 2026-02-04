import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import Rotation from './Rotation';

const mockCreateEventEmitter = jest.fn();
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args: any) => mockCreateEventEmitter(...args),
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

jest.mock('@core/helpers/useI18n', () => () => ({
  topbar: {
    menu: {
      rotate: 'rotate',
    },
  },
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockOnChange = jest.fn();

describe('test Rotation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockCreateEventEmitter.mockReturnValue({
      on: mockOn,
      removeListener: mockRemoveListener,
    });
  });

  it('should render correctly on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);

    expect(container).toMatchSnapshot();
  });

  test('onChange on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: 1 } });
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith(1);
  });

  test('UPDATE_DIMENSION_VALUES event on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container, unmount } = render(<Rotation onChange={mockOnChange} value={0} />);

    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockOn).toBeCalledTimes(1);
    expect(mockOn).toBeCalledWith('UPDATE_DIMENSION_VALUES', expect.any(Function));
    expect(mockRemoveListener).toBeCalledTimes(0);

    const handler = mockOn.mock.calls[0][1];

    handler({ rotation: 1 });
    expect(container.querySelector('input').value).toBe('1.00');
    unmount();
    expect(mockRemoveListener).toBeCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', handler);
  });

  test('onChange on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnChange).toBeCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith(1);
  });
});
