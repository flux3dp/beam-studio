/* eslint-disable import/first */
import React from 'react';
import { render } from '@testing-library/react';

const mockClearAllDialogComponents = jest.fn();
const mockShowLoginDialog = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  clearAllDialogComponents: mockClearAllDialogComponents,
  showLoginDialog: mockShowLoginDialog,
}));

const mockGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: mockGet,
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
