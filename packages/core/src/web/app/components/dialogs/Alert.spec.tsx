import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';
import type { IAlert } from '@core/interfaces/IAlert';

const mockPopFromStack = jest.fn();

jest.mock('@core/app/contexts/AlertProgressContext', () => ({
  AlertProgressContext: React.createContext({
    popFromStack: () => mockPopFromStack,
  }),
}));

const mockGetHelpCenterURL = jest.fn();

jest.mock('@core/helpers/help-center', () => ({
  getHelpCenterURL: mockGetHelpCenterURL,
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

import Alert from './Alert';

describe('test Alert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetHelpCenterURL.mockReturnValue('https://support.flux3dp.com/hc/en-us/articles/360001809676');
  });

  it('should render correctly', () => {
    const { baseElement } = render(<Alert data={mockData} />);

    expect(baseElement).toMatchSnapshot();
    expect(mockGetHelpCenterURL).not.toHaveBeenCalled();
  });

  it('should render correctly with help center link', () => {
    const { baseElement, getByText } = render(
      <Alert data={{ ...mockData, links: undefined, message: '#801 error' }} />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockGetHelpCenterURL).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('Learn More'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, 'https://support.flux3dp.com/hc/en-us/articles/360001809676');
  });

  describe('connection issue guide', () => {
    const guideText = i18n.lang.connection_issue_guide.alert_link;

    beforeEach(() => {
      // No help center article for connection error codes
      mockGetHelpCenterURL.mockReturnValue(undefined);
    });

    it('should show the guide for a connection issue code without device', () => {
      const { queryByText } = render(<Alert data={{ ...mockData, links: undefined, message: '#805 timeout' }} />);

      expect(queryByText(guideText)).toBeInTheDocument();
    });

    it('should show the guide for a non-Promark device', () => {
      const { queryByText } = render(
        <Alert data={{ ...mockData, device: { model: 'fbb2' } as any, links: undefined, message: '#805 timeout' }} />,
      );

      expect(queryByText(guideText)).toBeInTheDocument();
    });

    it('should hide the guide for a Promark (fpm1) device', () => {
      const { queryByText } = render(
        <Alert data={{ ...mockData, device: { model: 'fpm1' } as any, links: undefined, message: '#805 timeout' }} />,
      );

      expect(queryByText(guideText)).not.toBeInTheDocument();
    });
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
