import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { IProgressDialog } from '@core/interfaces/IProgress';

import Progress from './Progress';

const mockPopById = jest.fn();
jest.mock('@core/app/contexts/AlertProgressContext', () => ({
  AlertProgressContext: React.createContext({
    popById: (id: string) => mockPopById(id),
  }),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  alert: {
    cancel: 'Cancel',
  },
}));

const mockOnCancel = jest.fn();
const mockData = {
  id: 'progress',
  caption: 'Hello World',
  message: 'message',
  percentage: 0,
  key: 123,
  timeout: 1000,
  onCancel: mockOnCancel,
};

describe('test Progress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement, getByText } = render(<Progress data={mockData as IProgressDialog} />);
    expect(baseElement).toMatchSnapshot();
    const cancelButton = getByText('Cancel');
    expect(mockPopById).not.toBeCalled();
    expect(mockOnCancel).not.toBeCalled();
    fireEvent.click(cancelButton);
    expect(mockPopById).toBeCalledTimes(1);
    expect(mockPopById).toHaveBeenLastCalledWith('progress');
    expect(mockOnCancel).toBeCalledTimes(1);
  });
});
