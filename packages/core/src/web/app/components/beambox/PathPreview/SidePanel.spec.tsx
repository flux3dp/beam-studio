import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import SidePanel from './SidePanel';

let mockModel = 'fbb2';

jest.mock('@core/app/svgedit/workarea', () => ({
  get model() {
    return mockModel;
  },
}));

const mockTogglePathPreview = jest.fn();

jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: (selector: (state: any) => any) => {
    if (selector) return selector({ togglePathPreview: mockTogglePathPreview });

    return { togglePathPreview: mockTogglePathPreview };
  },
}));

describe('side panel test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModel = 'fbb2';
  });

  it('should render correctly when enabled', () => {
    const handleStartHere = jest.fn();
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
      />,
    );

    expect(container).toMatchSnapshot();

    const buttons = container.querySelectorAll('.ant-btn-default');

    fireEvent.click(buttons[0]);
    expect(handleStartHere).toHaveBeenCalledTimes(1);

    fireEvent.click(buttons[1]);
    expect(mockTogglePathPreview).toHaveBeenCalledTimes(1);
  });

  it('should render correctly when disabled', () => {
    const handleStartHere = jest.fn();
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
      />,
    );

    expect(container).toMatchSnapshot();

    const buttons = container.querySelectorAll('.ant-btn-default');

    fireEvent.click(buttons[0]);
    expect(handleStartHere).toHaveBeenCalledTimes(0);

    fireEvent.click(buttons[1]);
    expect(mockTogglePathPreview).toHaveBeenCalledTimes(1);
  });

  it('should hide start here for Promark', () => {
    mockModel = 'fpm1';

    const handleStartHere = jest.fn();
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
      />,
    );

    expect(container).toMatchSnapshot();

    const button = container.querySelector('.ant-btn-default');

    fireEvent.click(button);
    expect(mockTogglePathPreview).toHaveBeenCalledTimes(1);
  });
});
