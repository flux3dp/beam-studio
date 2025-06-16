import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

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

import Mask from './Mask';

test('should render correctly', () => {
  mockGetPreference.mockReturnValue(true);

  const { container } = render(
    <Mask
      options={
        [
          { label: 'On', value: true },
          { label: 'Off', value: false },
        ] as any
      }
    />,
  );

  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('.select-control'), { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'enable_mask', false);
});
