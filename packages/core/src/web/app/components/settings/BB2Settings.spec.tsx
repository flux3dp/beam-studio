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

jest.mock('./components/SettingSwitch');

import BB2Settings from './BB2Settings';

describe('test BB2Settings', () => {
  it('should render correctly', () => {
    const { container } = render(<BB2Settings />);

    expect(container).toMatchSnapshot();
  });

  test('set value', () => {
    const { container } = render(<BB2Settings />);

    const switchControl = container.querySelector('.switch-control') as HTMLInputElement;

    fireEvent.click(switchControl);

    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenCalledWith('curve_engraving_speed_limit', true);
  });
});
