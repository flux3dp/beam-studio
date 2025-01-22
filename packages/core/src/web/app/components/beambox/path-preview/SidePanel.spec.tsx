import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import SidePanel from './SidePanel';

const mockGetConvertEngine = jest.fn();

jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  getConvertEngine: () => mockGetConvertEngine(),
}));

describe('side panel test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConvertEngine.mockReturnValue({ useSwiftray: false });
  });

  it('should render correctly when enabled', () => {
    const handleStartHere = jest.fn();
    const togglePathPreview = jest.fn();
    const { container } = render(
      <SidePanel
        currentPosition="50, 50 mm"
        cutDist="50 mm"
        estTime="60 s"
        handleStartHere={handleStartHere}
        isStartHereEnabled
        lightTime="30 s"
        rapidDist="30 mm"
        rapidTime="10 s"
        size="100 x 100 mm"
        togglePathPreview={togglePathPreview}
      />,
    );

    expect(container).toMatchSnapshot();

    const buttons = container.querySelectorAll('div.btn-default');

    fireEvent.click(buttons[0]);
    expect(handleStartHere).toHaveBeenCalledTimes(1);

    fireEvent.click(buttons[1]);
    expect(togglePathPreview).toHaveBeenCalledTimes(1);
  });

  it('should render correctly when disabled', () => {
    const handleStartHere = jest.fn();
    const togglePathPreview = jest.fn();
    const { container } = render(
      <SidePanel
        currentPosition="50, 50 mm"
        cutDist="50 mm"
        estTime="60 s"
        handleStartHere={handleStartHere}
        isStartHereEnabled={false}
        lightTime="30 s"
        rapidDist="30 mm"
        rapidTime="10 s"
        size="100 x 100 mm"
        togglePathPreview={togglePathPreview}
      />,
    );

    expect(container).toMatchSnapshot();

    const buttons = container.querySelectorAll('div.btn-default');

    fireEvent.click(buttons[0]);
    expect(handleStartHere).toHaveBeenCalledTimes(0);

    fireEvent.click(buttons[1]);
    expect(togglePathPreview).toHaveBeenCalledTimes(1);
  });

  it('should render correctly with Swiftray engine', () => {
    mockGetConvertEngine.mockReturnValue({ useSwiftray: true });

    const handleStartHere = jest.fn();
    const togglePathPreview = jest.fn();
    const { container } = render(
      <SidePanel
        currentPosition="50, 50 mm"
        cutDist="50 mm"
        estTime="60 s"
        handleStartHere={handleStartHere}
        isStartHereEnabled
        lightTime="30 s"
        rapidDist="30 mm"
        rapidTime="10 s"
        size="100 x 100 mm"
        togglePathPreview={togglePathPreview}
      />,
    );

    expect(container).toMatchSnapshot();

    const button = container.querySelector('div.btn-default');

    fireEvent.click(button);
    expect(togglePathPreview).toHaveBeenCalledTimes(1);
  });
});
