import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import MediaTutorial from './MediaTutorial';

const data = [
  {
    description: '1',
    mediaSources: [{ src: 'img/1.png', type: 'image/png' }],
  },
  {
    description: '2',
    mediaSources: [{ src: 'img/2.png', type: 'image/png' }],
  },
  {
    description: '3',
    isVideo: true,
    mediaSources: [
      { src: 'video/3.webm', type: 'image/webm' },
      { src: 'video/3.mp4', type: 'image/mp4' },
    ],
  },
];

const mockOnClose = jest.fn();
const mockMediaLoad = jest.fn();

describe('should MediaTutorial', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('next step should work', () => {
    window.HTMLMediaElement.prototype.load = mockMediaLoad;

    const { baseElement, getByText } = render(<MediaTutorial data={data} onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Next'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(0);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Back'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(0);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Next'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(0);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Next'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Done'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
  });

  test('cancel button should work', () => {
    const { baseElement } = render(<MediaTutorial data={data} onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
