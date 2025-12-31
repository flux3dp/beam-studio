import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { create } from 'zustand';

jest.mock('@core/helpers/is-dev', () => () => true);

const getFontOfPostscriptName = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  fontNameMap: new Map(
    Object.entries({
      'Apple LiSung': '蘋果儷細宋',
      Arial: 'Arial',
      Courier: 'Courier',
    }),
  ),
  getFontOfPostscriptName: (...args) => getFontOfPostscriptName(...args),
  requestAvailableFontFamilies: () => ['Arial', 'Courier', 'Apple LiSung'],
  requestFontsOfTheFontFamily: (family) => {
    const fonts = {
      'Apple LiSung': [
        {
          family: 'Apple LiSung',
          postscriptName: 'LiSungLight',
          style: 'Light',
        },
      ],
      Arial: [
        {
          family: 'Arial',
          postscriptName: 'ArialMT',
          style: 'Regular',
        },
        {
          family: 'Arial',
          postscriptName: 'Arial-BoldMT',
          style: 'Bold',
        },
        {
          family: 'Arial',
          postscriptName: 'Arial-BoldItalicMT',
          style: 'Bold Italic',
        },
        {
          family: 'Arial',
          postscriptName: 'Arial-ItalicMT',
          style: 'Italic',
        },
      ],
      Courier: [
        {
          family: 'Courier',
          postscriptName: 'Regular',
          style: 'Regular',
        },
        {
          family: 'Courier',
          postscriptName: 'Courier-Bold',
          style: 'Bold',
        },
        {
          family: 'Courier',
          postscriptName: 'Courier-BoldOblique',
          style: 'Bold Oblique',
        },
        {
          family: 'Courier',
          postscriptName: 'Courier-Oblique',
          style: 'Oblique',
        },
      ],
    };

    return fonts[family];
  },
}));

const map = new Map();

map.set('default-font', {
  family: 'Arial',
  style: 'Regular',
});
jest.mock('@core/implementations/storage', () => ({
  get: (key) => map.get(key),
  set: (key, value) => map.set(key, value),
}));

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: () => ({
    height: 375,
    label: 'Beambox',
    maxSpeed: 300,
    minPower: 10,
    minSpeed: 0.5,
    pxHeight: 3750,
    pxWidth: 4000,
    vectorSpeedLimit: 20,
    width: 400,
  }),
}));

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();
const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getConfig: mockGetConfig,
  getPreference: mockGetPreference,
  setConfig: mockSetConfig,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('../components/SettingSelect');
jest.mock('../components/SettingFormItem');
jest.mock('../components/SettingSwitch');

jest.mock('@core/helpers/api/swiftray-client', () => ({
  hasSwiftray: true,
}));

jest.mock('@core/helpers/locale-helper', () => ({
  isTwOrHk: true,
}));

import Editor from '.';

describe('settings/Editor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initially no warning', async () => {
    mockGetPreference.mockImplementation((key) => (['guide_x0', 'guide_y0'].includes(key) ? 0 : false));

    const { container } = render(
      <Editor
        unitInputProps={{
          isInch: false,
          precision: 2,
          step: 1,
          unit: 'mm',
        }}
      />,
    );

    expect(mockGetPreference).toHaveBeenCalledTimes(16);
    expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'show_guides');
    expect(mockGetPreference).toHaveBeenNthCalledWith(4, 'guide_x0');
    expect(mockGetPreference).toHaveBeenNthCalledWith(5, 'guide_y0');
    expect(mockGetPreference).toHaveBeenNthCalledWith(6, 'image_downsampling');
    expect(mockGetPreference).toHaveBeenNthCalledWith(7, 'anti-aliasing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(8, 'continuous_drawing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(9, 'simplify_clipper_path');
    expect(mockGetPreference).toHaveBeenNthCalledWith(10, 'auto-switch-tab');
    expect(mockGetPreference).toHaveBeenNthCalledWith(11, 'path-engine');
    expect(mockGetPreference).toHaveBeenNthCalledWith(12, 'enable-custom-backlash');
    expect(mockGetPreference).toHaveBeenNthCalledWith(13, 'enable-uv-print-file');
    expect(mockGetPreference).toHaveBeenNthCalledWith(14, 'print-advanced-mode');
    expect(mockGetPreference).toHaveBeenNthCalledWith(15, 'use-real-boundary');
    expect(mockGetPreference).toHaveBeenNthCalledWith(16, 'crop-task-thumbnail');
    expect(container).toMatchSnapshot();

    // Test SettingSelect controls
    const selectControls = container.querySelectorAll('.select-control');

    fireEvent.change(selectControls[0], { target: { value: 'inches' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-units', 'inches');

    fireEvent.change(selectControls[1], { target: { value: 'Apple LiSung' } });
    expect(container).toMatchSnapshot();

    fireEvent.change(selectControls[1], { target: { value: 'Courier' } });
    expect(container).toMatchSnapshot();

    getFontOfPostscriptName.mockReturnValue({
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    fireEvent.change(selectControls[2], { target: { value: 'Courier-Bold' } });
    expect(container).toMatchSnapshot();

    fireEvent.change(selectControls[3], { target: { value: 'fbm1' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'model', 'fbm1');

    fireEvent.change(selectControls[4], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'image_downsampling', true);

    fireEvent.change(selectControls[5], { target: { value: 'swiftray' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(3);
    expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'path-engine', 'swiftray');

    // Test SettingSwitch controls
    const switchControls = container.querySelectorAll('.switch-control');

    fireEvent.click(switchControls[0]);
    expect(mockSetPreference).toHaveBeenCalledTimes(4);
    expect(mockSetPreference).toHaveBeenNthCalledWith(4, 'show_guides', true);

    fireEvent.click(switchControls[1]);
    expect(mockSetPreference).toHaveBeenCalledTimes(5);
    expect(mockSetPreference).toHaveBeenNthCalledWith(5, 'anti-aliasing', true);

    fireEvent.click(switchControls[2]);
    expect(mockSetPreference).toHaveBeenCalledTimes(6);
    expect(mockSetPreference).toHaveBeenNthCalledWith(6, 'continuous_drawing', true);

    fireEvent.click(switchControls[3]);
    expect(mockSetPreference).toHaveBeenCalledTimes(7);
    expect(mockSetPreference).toHaveBeenNthCalledWith(7, 'simplify_clipper_path', true);

    fireEvent.click(switchControls[4]);
    expect(mockSetPreference).toHaveBeenCalledTimes(8);
    expect(mockSetPreference).toHaveBeenNthCalledWith(8, 'auto-switch-tab', true);

    fireEvent.click(switchControls[5]);
    expect(mockSetPreference).toHaveBeenCalledTimes(9);
    expect(mockSetPreference).toHaveBeenNthCalledWith(9, 'enable-custom-backlash', true);

    fireEvent.click(switchControls[6]);
    expect(mockSetPreference).toHaveBeenCalledTimes(10);
    expect(mockSetPreference).toHaveBeenNthCalledWith(10, 'enable-uv-print-file', true);

    fireEvent.click(switchControls[7]);
    expect(mockSetPreference).toHaveBeenCalledTimes(11);
    expect(mockSetPreference).toHaveBeenNthCalledWith(11, 'print-advanced-mode', true);

    fireEvent.click(switchControls[8]);
    expect(mockSetPreference).toHaveBeenCalledTimes(12);
    expect(mockSetPreference).toHaveBeenNthCalledWith(12, 'use-real-boundary', true);

    fireEvent.click(switchControls[9]);
    expect(mockSetPreference).toHaveBeenCalledTimes(13);
    expect(mockSetPreference).toHaveBeenNthCalledWith(13, 'crop-task-thumbnail', true);

    // Test XYItem controls (guide axis)
    fireEvent.change(container.querySelector('#set-guide-axis-x'), { target: { value: 1 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(14);
    expect(mockSetPreference).toHaveBeenNthCalledWith(14, 'guide_x0', 1);

    fireEvent.change(container.querySelector('#set-guide-axis-y'), { target: { value: 2 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(15);
    expect(mockSetPreference).toHaveBeenNthCalledWith(15, 'guide_y0', 2);
  });
});
