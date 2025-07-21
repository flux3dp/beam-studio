import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.useFakeTimers();

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: mockUseIsMobile,
}));

import Banners from './Banners';

const mockBanners = [
  {
    image_desktop: 'desktop-image-1.png',
    image_mobile: 'mobile-image-1.png',
    url: 'url-1',
  },
  {
    image_desktop: 'desktop-image-2.png',
    image_mobile: 'mobile-image-2.png',
    url: 'url-2',
  },
  {
    image_desktop: 'desktop-image-3.png',
    image_mobile: 'mobile-image-3.png',
    url: 'url-3',
  },
];

describe('test Banners', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<Banners banners={mockBanners} />);

    expect(container).toMatchSnapshot();

    const banners = container.querySelector('.banners');

    expect(banners).toBeInTheDocument();

    jest.advanceTimersByTime(3000);
    expect(banners).toHaveStyle('right: 200%');
  });

  test('prev/next buttons', () => {
    const { container } = render(<Banners banners={mockBanners} />);
    const banners = container.querySelector('.banners');
    const buttons = container.querySelectorAll('button');

    fireEvent.click(buttons[0]);
    expect(banners).toHaveStyle('right: 0%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[0]);
    expect(banners).toHaveStyle('right: 200%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[0]);
    expect(banners).toHaveStyle('right: 100%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[0]);
    expect(banners).toHaveStyle('right: 0%');

    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[1]);
    expect(banners).toHaveStyle('right: 100%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[1]);
    expect(banners).toHaveStyle('right: 200%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[1]);
    expect(banners).toHaveStyle('right: 300%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[1]);
    expect(banners).toHaveStyle('right: 400%');
    jest.advanceTimersByTime(500);
    fireEvent.click(buttons[1]);
    expect(banners).toHaveStyle('right: 200%');
  });

  test('auto loop', () => {
    const { container } = render(<Banners banners={mockBanners} />);
    const banners = container.querySelector('.banners');

    jest.advanceTimersByTime(3000);
    expect(banners).toHaveStyle('right: 200%');
    jest.advanceTimersByTime(3500);
    expect(banners).toHaveStyle('right: 300%');
    jest.advanceTimersByTime(3500);
    expect(banners).toHaveStyle('right: 400%');
    jest.advanceTimersByTime(3500);
    expect(banners).toHaveStyle('right: 200%');
  });

  it('should render correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<Banners banners={mockBanners} />);

    expect(container).toMatchSnapshot();
  });

  it('should render nothing without banners', () => {
    const { container } = render(<Banners banners={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render correctly with only one banner', () => {
    const setTimeout = jest.spyOn(global, 'setTimeout');

    const { container } = render(<Banners banners={[mockBanners[0]]} />);

    expect(container).toMatchSnapshot();
    expect(setTimeout).not.toHaveBeenCalled();
  });
});
