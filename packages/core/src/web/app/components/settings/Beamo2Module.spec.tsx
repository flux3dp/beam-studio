import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
jest.mock('@core/app/actions/canvas/boundaryDrawer', () => {});
jest.mock('./components/SettingFormItem');
jest.mock('./components/SettingSwitch');

import Beamo2Module from './Beamo2Module';

describe('test Beamo2Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<Beamo2Module />);

    expect(container).toMatchSnapshot();
  });

  test('edit on/off value', () => {
    const { container } = render(<Beamo2Module />);

    mockGetPreference.mockReturnValue(false);

    const switchControl = container.querySelector('.switch-control');

    fireEvent.click(switchControl);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'use-union-boundary', true);
  });
});
