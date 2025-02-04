import React from 'react';

import { render } from '@testing-library/react';

const mockClearAllDialogComponents = jest.fn();
const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  clearAllDialogComponents: (...args) => mockClearAllDialogComponents(...args),
  showLoginDialog: (...args) => mockShowLoginDialog(...args),
}));

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockGet(...args),
}));

import FluxIdLogin from './FluxIdLogin';

test('should render correctly', () => {
  const { container } = render(<FluxIdLogin />);

  expect(container).toMatchSnapshot();
  expect(mockClearAllDialogComponents).toHaveBeenCalledTimes(1);
  expect(mockGet).toHaveBeenCalledTimes(1);
  expect(mockGet).toHaveBeenNthCalledWith(1, 'printer-is-ready');
  expect(mockShowLoginDialog).toHaveBeenCalledTimes(1);
});
