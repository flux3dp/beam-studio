import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import RatioLock from './RatioLock';

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

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

const mockOnClick = jest.fn();

describe('test RatioLock', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container, rerender } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);

    expect(container).toMatchSnapshot();
    rerender(<RatioLock isLocked onClick={mockOnClick} />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container, rerender } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);

    expect(container).toMatchSnapshot();
    rerender(<RatioLock isLocked onClick={mockOnClick} />);
    expect(container).toMatchSnapshot();
  });

  test('onClick on desktop', () => {
    mockUseIsMobile.mockReturnValue(false);

    const { container } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('onClick on mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<RatioLock isLocked={false} onClick={mockOnClick} />);
    const button = container.querySelector('button');

    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
