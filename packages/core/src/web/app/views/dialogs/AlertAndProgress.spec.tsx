import React from 'react';
import { render } from '@testing-library/react';

import AlertAndProgress from './AlertAndProgress';

jest.mock('app/views/dialogs/Alert', () => ({ data }: any) => (
  <div>DummyAlert {JSON.stringify(data)}</div>
));
jest.mock('app/views/dialogs/Progress', () => ({ data }: any) => (
  <div>DummyProgress {JSON.stringify(data)}</div>
));
jest.mock('app/views/dialogs/NonStopProgress', () => ({ data }: any) => (
  <div>DummyNonStopProgress {JSON.stringify(data)}</div>
));

jest.mock('app/contexts/AlertProgressContext', () => ({
  AlertProgressContext: React.createContext({
    alertProgressStack: [
      {
        id: 'alert',
        message: 'Yes or No',
        caption: 'Hello World',
        iconUrl: 'https://www.flux3dp.com/icon.svg',
        buttons: [
          {
            title: 'Yes',
            label: 'Yes',
          },
          {
            title: 'No',
            label: 'No',
          },
        ],
        checkboxText: 'Select',
        checkboxCallbacks: jest.fn(),
      },
      {
        id: 'progress',
        isProgress: true,
      },
    ],
    popFromStack: jest.fn(),
    popById: jest.fn(),
  }),
}));

test('should render correctly', () => {
  const { baseElement } = render(<AlertAndProgress />);
  expect(baseElement).toMatchSnapshot();
});
