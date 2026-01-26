import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/components/settings/shared/hooks/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('../shared/components/SettingSelect');
jest.mock('../shared/components/SettingFormItem');
jest.mock('../shared/components/SettingSwitch');

import Engraving from './Engraving';

test('should render correctly', () => {
  mockGetPreference.mockImplementation((key: string) => {
    if (key.startsWith('padding_accel')) {
      return 4000;
    }

    return true;
  });

  const { container } = render(<Engraving />);

  expect(mockGetPreference).toHaveBeenCalledTimes(6);
  expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'engrave_dpi');
  expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'fast_gradient');
  expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'reverse-engraving');
  expect(mockGetPreference).toHaveBeenNthCalledWith(4, 'segmented-engraving');
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
  const selectControls = container.querySelectorAll('.select-control');

  fireEvent.change(selectControls[0], { target: { value: 'detailed' } });
  expect(mockSetPreference).toHaveBeenCalledTimes(3);
  expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'engrave_dpi', 'detailed');

  fireEvent.change(selectControls[1], { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(4);
  expect(mockSetPreference).toHaveBeenNthCalledWith(4, 'reverse-engraving', false);
});
