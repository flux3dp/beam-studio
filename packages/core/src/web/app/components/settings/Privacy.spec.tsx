import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({
  getConfig: mockGetConfig,
  setConfig: mockSetConfig,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('./components/SettingSwitch');

import Privacy from './Privacy';

test('should render correctly', () => {
  mockGetConfig.mockReturnValue(true);

  const { container } = render(<Privacy />);

  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.switch-control'));
  expect(mockGetConfig).toHaveBeenCalledWith('enable-sentry');
  expect(mockSetConfig).toHaveBeenCalledWith('enable-sentry', false);
});
