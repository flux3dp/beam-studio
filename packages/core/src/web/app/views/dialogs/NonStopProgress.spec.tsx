import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { IProgressDialog } from '@core/interfaces/IProgress';

import NonStopProgress from './NonStopProgress';

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

jest.mock('antd-mobile', () => ({
  SpinLoading: () => <div>SpinLoading</div>,
}));

const mockOnCancel = jest.fn();
const mockData = {
  id: 'progress',
  caption: 'Hello World',
  percentage: 0,
  key: 123,
  timeout: 1000,
  onCancel: mockOnCancel,
};

describe('test NonStopProgress', () => {
  it('should render correctly', () => {
    const { baseElement } = render(<NonStopProgress data={mockData as IProgressDialog} />);
    expect(baseElement).toMatchSnapshot();
  });
});
