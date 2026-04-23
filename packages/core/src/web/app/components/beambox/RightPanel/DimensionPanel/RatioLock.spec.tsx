import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

jest.mock('../ObjectPanelItem', () => ({
  Item: ({ content, id, onClick }: any) => (
    <div id={id}>
      <div>{content}</div>
      <button onClick={onClick} type="button" />
    </div>
  ),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      object_panel: {
        lock_aspect: 'lock_aspect',
        unlock_aspect: 'unlock_aspect',
      },
    },
  },
}));

const mockOnClick = jest.fn();

import RatioLock from './RatioLock';

describe('test RatioLock', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly on desktop', () => {
    useScreenStore.setState({ isMobile: false });

    const { container, rerender } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);

    expect(container).toMatchSnapshot();
    rerender(<RatioLock isLocked onClick={mockOnClick} />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const { container, rerender } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);

    expect(container).toMatchSnapshot();
    rerender(<RatioLock isLocked onClick={mockOnClick} />);
    expect(container).toMatchSnapshot();
  });

  test('onClick on desktop', () => {
    useScreenStore.setState({ isMobile: false });

    const { container } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('onClick on mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const { container } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
