import React from 'react';

import { act, render } from '@testing-library/react';

jest.useFakeTimers();
jest.spyOn(Math, 'random').mockReturnValue(0.5);

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => mockUseWorkarea);

import Tips from './Tips';

describe('test Tips', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<Tips />);
    const tips = container.querySelectorAll('.slick-slide');

    expect(container).toMatchSnapshot();
    expect(tips.length).toBe(20);
    expect(tips[0]).toHaveClass('slick-current');
    expect(tips[1]).not.toHaveClass('slick-current');

    // Auto play
    act(() => jest.advanceTimersByTime(10000));
    act(() => jest.advanceTimersByTime(1000));
    expect(container).toMatchSnapshot();
    expect(tips[0]).not.toHaveClass('slick-current');
    expect(tips[1]).toHaveClass('slick-current');
  });

  it('should wait for the container to be laid out before mounting the carousel', () => {
    let resize: () => void = () => {};
    const disconnect = jest.fn();
    const offsetWidth = jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(0);

    global.ResizeObserver = jest.fn((callback) => {
      resize = callback;

      return { disconnect, observe: jest.fn(), unobserve: jest.fn() };
    }) as unknown as typeof ResizeObserver;

    try {
      const { container } = render(<Tips />);

      expect(container.querySelector('.slick-slider')).toBeNull();

      // still hidden: keep waiting
      act(() => resize());
      expect(container.querySelector('.slick-slider')).toBeNull();

      offsetWidth.mockReturnValue(472);
      act(() => resize());
      expect(container.querySelector('.slick-slider')).not.toBeNull();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      offsetWidth.mockRestore();
      // @ts-expect-error jsdom has no ResizeObserver
      delete global.ResizeObserver;
    }
  });

  it('should show diffent tips with Promark', () => {
    mockUseWorkarea.mockReturnValue('fpm1');

    const { container } = render(<Tips />);

    expect(container).toMatchSnapshot();
  });
});
