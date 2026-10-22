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

jest.mock('../shared/components/SettingSelect');
jest.mock('../shared/components/SettingSwitch');

import Privacy from './Privacy';

test('should render correctly', () => {
  mockGetConfig.mockImplementation((key: string) => (key === 'enable-sentry' ? true : null));

  const { container } = render(<Privacy />);

  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.switch-control'));
  expect(mockGetConfig).toHaveBeenCalledWith('enable-sentry');
  expect(mockSetConfig).toHaveBeenCalledWith('enable-sentry', false);

  fireEvent.change(container.querySelector('.select-control'), { target: { value: 'never' } });
  expect(mockGetConfig).toHaveBeenCalledWith('error-report-upload');
  expect(mockSetConfig).toHaveBeenCalledWith('error-report-upload', 'never');
});
