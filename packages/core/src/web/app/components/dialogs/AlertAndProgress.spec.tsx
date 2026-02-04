import React from 'react';

import { render } from '@testing-library/react';

import AlertAndProgress from './AlertAndProgress';

jest.mock('./Alert', () => ({ data }: any) => <div>DummyAlert {JSON.stringify(data)}</div>);
jest.mock('./Progress', () => ({ data }: any) => <div>DummyProgress {JSON.stringify(data)}</div>);
jest.mock('./NonStopProgress', () => ({ data }: any) => <div>DummyNonStopProgress {JSON.stringify(data)}</div>);

jest.mock('@core/app/contexts/AlertProgressContext', () => ({
  AlertProgressContext: React.createContext({
    alertProgressStack: [
      {
        buttons: [
          {
            label: 'Yes',
            title: 'Yes',
          },
          {
            label: 'No',
            title: 'No',
          },
        ],
        caption: 'Hello World',
        checkboxCallbacks: jest.fn(),
        checkboxText: 'Select',
        iconUrl: 'https://www.flux3dp.com/icon.svg',
        id: 'alert',
        message: 'Yes or No',
      },
      {
        id: 'progress',
        isProgress: true,
      },
    ],
    popById: jest.fn(),
    popFromStack: jest.fn(),
  }),
}));

test('should render correctly', () => {
  const { baseElement } = render(<AlertAndProgress />);

  expect(baseElement).toMatchSnapshot();
});
