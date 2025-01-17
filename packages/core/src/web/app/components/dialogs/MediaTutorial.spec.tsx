import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import MediaTutorial from './MediaTutorial';

jest.mock('helpers/i18n', () => ({
  lang: {
    buttons: {
      next: 'NEXT',
      back: 'BACK',
      done: 'DONE',
    },
  },
}));

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
    isVideo: true,
    description: '3',
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
    fireEvent.click(getByText('NEXT'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(0);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('BACK'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(0);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('NEXT'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(0);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('NEXT'));
    expect(mockMediaLoad).toHaveBeenCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('DONE'));
    expect(mockOnClose).toBeCalledTimes(1);
    expect(baseElement).toMatchSnapshot();
  });

  test('cancel button should work', () => {
    const { baseElement } = render(<MediaTutorial data={data} onClose={mockOnClose} />);
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(mockOnClose).toBeCalledTimes(1);
  });
});
