import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('./components/SettingSelect');
jest.mock('./components/SettingSwitch');

import TextToPath from './TextToPath';

test('should render correctly', () => {
  mockGetPreference.mockImplementation((key: string) => (key === 'font-substitute' ? true : '2.0'));

  const { container } = render(<TextToPath />);

  expect(container).toMatchSnapshot();

  // Test SettingSwitch control
  const switchControl = container.querySelector('.switch-control');

  fireEvent.click(switchControl);
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'font-substitute', false);

  // Test SettingSelect control
  const selectControl = container.querySelector('.select-control');

  fireEvent.change(selectControl, { target: { value: '2.0' } });
  expect(mockSetPreference).toHaveBeenCalledTimes(2);
  expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'font-convert', '2.0');
});
