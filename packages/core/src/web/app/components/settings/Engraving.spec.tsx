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
jest.mock('./components/SettingFormItem');
jest.mock('./components/SettingSwitch');

import Engraving from './Engraving';

test('should render correctly', () => {
  mockGetPreference.mockImplementation((key: string) => {
    if (key.startsWith('padding_accel')) {
      return 4000;
    }

    return true;
  });

  const { container } = render(<Engraving />);

  expect(mockGetPreference).toHaveBeenCalledTimes(5);
  expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'fast_gradient');
  expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'reverse-engraving');
  expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'segmented-engraving');
  expect(container).toMatchSnapshot();

  // Test SettingSwitch controls
  const switchControls = container.querySelectorAll('.switch-control');

  fireEvent.click(switchControls[0]);
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'fast_gradient', false);

  fireEvent.click(switchControls[1]);
  expect(mockSetPreference).toHaveBeenCalledTimes(2);
  expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'segmented-engraving', false);

  // Test SettingSelect control
  const selectControl = container.querySelector('.select-control');

  fireEvent.change(selectControl, { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(3);
  expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'reverse-engraving', false);
});
