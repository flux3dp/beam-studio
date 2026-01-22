import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({
  getConfig: mockGetConfig,
  setConfig: mockSetConfig,
}));

jest.mock('@core/app/components/settings/shared/hooks/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('../shared/components/SettingSwitch');

import Privacy from './Privacy';

test('should render correctly', () => {
  mockGetConfig.mockReturnValue(true);

  const { container } = render(<Privacy />);

  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.switch-control'));
  expect(mockGetConfig).toHaveBeenCalledWith('enable-sentry');
  expect(mockSetConfig).toHaveBeenCalledWith('enable-sentry', false);
});
