import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

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

const mockOnChange = jest.fn();

import Rotation from './Rotation';

describe('test Rotation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockCreateEventEmitter.mockReturnValue({
      on: mockOn,
      removeListener: mockRemoveListener,
    });
  });

  it('should render correctly on desktop', () => {
    useScreenStore.setState({ isMobile: false });

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);

    expect(container).toMatchSnapshot();
  });

  test('onChange on desktop', () => {
    useScreenStore.setState({ isMobile: false });

    const TestComponent = () => {
      const [val, setVal] = React.useState(0);
      const onChange = (newVal: number, isComplete?: boolean) => {
        setVal(newVal);
        mockOnChange(newVal, isComplete);
      };

      return <Rotation onChange={onChange} value={val} />;
    };

    const { container } = render(<TestComponent />);
    const input = container.querySelector('input')!;

    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 1 } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 1, false);
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 0, false);
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 1, true);
  });

  test('UPDATE_DIMENSION_VALUES event on desktop', () => {
    useScreenStore.setState({ isMobile: false });

    const { container, unmount } = render(<Rotation onChange={mockOnChange} value={0} />);

    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledWith('UPDATE_DIMENSION_VALUES', expect.any(Function));
    expect(mockRemoveListener).toHaveBeenCalledTimes(0);

    const handler = mockOn.mock.calls[0][1];

    handler({ rotation: 1 });
    expect(container.querySelector('input')!.value).toBe('1.00');
    unmount();
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'UPDATE_DIMENSION_VALUES', handler);
  });

  test('onChange on mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const { container } = render(<Rotation onChange={mockOnChange} value={0} />);
    const button = container.querySelector('button')!;

    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenLastCalledWith(1, true);
  });
});
