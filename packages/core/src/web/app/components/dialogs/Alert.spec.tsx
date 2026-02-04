import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import type { IAlert } from '@core/interfaces/IAlert';

import Alert from './Alert';
import { setStorage } from '@mocks/@core/app/stores/storageStore';

const mockPopFromStack = jest.fn();

jest.mock('@core/app/contexts/AlertProgressContext', () => ({
  AlertProgressContext: React.createContext({
    popFromStack: () => mockPopFromStack,
  }),
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args: any) => mockOpen(...args),
}));

const mockOnYes = jest.fn();
const mockOnNo = jest.fn();
const mockOnCheckedYes = jest.fn();
const mockOnCheckedNo = jest.fn();

const mockData: IAlert = {
  buttons: [
    {
      label: 'Yes',
      onClick: mockOnYes,
      title: 'Yes',
    },
    {
      label: 'No',
      onClick: mockOnNo,
      title: 'No',
    },
  ],
  caption: 'Hello World',
  checkbox: {
    callbacks: [mockOnCheckedYes, mockOnCheckedNo],
    text: 'checkbox',
  },
  iconUrl: 'https://www.flux3dp.com/icon.svg',
  id: 'alert',
  links: [
    { text: 'link1', url: 'https://link1.com' },
    { text: 'link2', url: 'https://link2.com' },
  ],
  message: 'Yes or No',
};

describe('test Alert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement } = render(<Alert data={mockData} />);

    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly with help center link', () => {
    const { baseElement, getByText, rerender } = render(
      <Alert data={{ ...mockData, links: null, message: '#801 error' }} />,
    );

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Learn More'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, 'https://support.flux3dp.com/hc/en-us/articles/360001809676');

    setStorage('active-lang', 'zh-tw');
    rerender(<Alert data={{ ...mockData, links: null, message: '#801 error' }} />);
    fireEvent.click(getByText('Learn More'));
    expect(mockOpen).toHaveBeenCalledTimes(2);
    expect(mockOpen).toHaveBeenNthCalledWith(2, 'https://support.flux3dp.com/hc/zh-tw/articles/360001809676');
  });

  test('should call callback when click button', () => {
    const { getByText } = render(<Alert data={mockData} />);

    fireEvent.click(getByText('Yes'));
    expect(mockOnYes).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('No'));
    expect(mockOnNo).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('checkbox'));

    expect(mockOnCheckedYes).not.toHaveBeenCalled();
    fireEvent.click(getByText('Yes'));
    expect(mockOnCheckedYes).toHaveBeenCalledTimes(1);
    expect(mockOnYes).toHaveBeenCalledTimes(1);

    expect(mockOnCheckedNo).not.toHaveBeenCalled();
    fireEvent.click(getByText('No'));
    expect(mockOnCheckedNo).toHaveBeenCalledTimes(1);
    expect(mockOnNo).toHaveBeenCalledTimes(1);
  });
});
