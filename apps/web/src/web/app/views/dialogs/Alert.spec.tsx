import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { IAlert } from 'interfaces/IAlert';

import Alert from './Alert';

const mockGetActiveLang = jest.fn();
jest.mock('helpers/i18n', () => ({
  getActiveLang: () => mockGetActiveLang(),
}));

jest.mock('helpers/useI18n', () => () => ({
  alert: {
    learn_more: 'Learn more',
  },
}));

const mockPopFromStack = jest.fn();
jest.mock('app/contexts/AlertProgressContext', () => ({
  AlertProgressContext: React.createContext({
    popFromStack: () => mockPopFromStack,
  }),
}));

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open: (...args: any) => mockOpen(...args),
}));

const mockOnYes = jest.fn();
const mockOnNo = jest.fn();
const mockOnCheckedYes = jest.fn();
const mockOnCheckedNo = jest.fn();

const mockData: IAlert = {
  id: 'alert',
  message: 'Yes or No',
  caption: 'Hello World',
  iconUrl: 'https://www.flux3dp.com/icon.svg',
  buttons: [
    {
      title: 'Yes',
      label: 'Yes',
      onClick: mockOnYes,
    },
    {
      title: 'No',
      label: 'No',
      onClick: mockOnNo,
    },
  ],
  checkbox: {
    text: 'checkbox',
    callbacks: [mockOnCheckedYes, mockOnCheckedNo],
  },
  links: [
    { text: 'link1', url: 'https://link1.com' },
    { text: 'link2', url: 'https://link2.com' },
  ],
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
      <Alert data={{ ...mockData, message: '#801 error', links: null }} />
    );
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Learn more'));
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(
      1,
      'https://support.flux3dp.com/hc/en-us/articles/360001809676'
    );

    mockGetActiveLang.mockReturnValue('zh-tw');
    rerender(<Alert data={{ ...mockData, message: '#801 error', links: null }} />);
    fireEvent.click(getByText('Learn more'));
    expect(mockOpen).toBeCalledTimes(2);
    expect(mockOpen).toHaveBeenNthCalledWith(
      2,
      'https://support.flux3dp.com/hc/zh-tw/articles/360001809676'
    );
  });

  test('should call callback when click button', () => {
    const { getByText } = render(<Alert data={mockData} />);
    fireEvent.click(getByText('Yes'));
    expect(mockOnYes).toBeCalledTimes(1);
    fireEvent.click(getByText('No'));
    expect(mockOnNo).toBeCalledTimes(1);
    fireEvent.click(getByText('checkbox'));

    expect(mockOnCheckedYes).not.toBeCalled();
    fireEvent.click(getByText('Yes'));
    expect(mockOnCheckedYes).toBeCalledTimes(1);
    expect(mockOnYes).toBeCalledTimes(1);

    expect(mockOnCheckedNo).not.toBeCalled();
    fireEvent.click(getByText('No'));
    expect(mockOnCheckedNo).toBeCalledTimes(1);
    expect(mockOnNo).toBeCalledTimes(1);
  });
});
