import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({ getPreference: mockGetPreference, setPreference: mockSetPreference }));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
jest.mock('./components/SettingSelect');
jest.mock('./components/SettingFormItem');
jest.mock('./components/SettingSwitch');

import Camera from './Camera';

describe('test Camera settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    const { container } = render(<Camera />);

    expect(container).toMatchSnapshot();
  });

  test('change preview speed level', () => {
    const { container } = render(<Camera />);

    const selectControl = container.querySelector('.select-control');

    fireEvent.change(selectControl, { target: { value: '2' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenCalledWith('preview_movement_speed_level', 2);
  });

  test('toggle switch controls', () => {
    const { container } = render(<Camera />);

    const switchControls = container.querySelectorAll('.switch-control');

    fireEvent.click(switchControls[0]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'enable-custom-preview-height', true);

    fireEvent.click(switchControls[1]);
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'keep-preview-result', true);
  });
});
