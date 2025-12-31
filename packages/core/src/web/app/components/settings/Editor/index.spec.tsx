import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { create } from 'zustand';

jest.mock('@core/helpers/is-dev', () => () => true);

const getFontOfPostscriptName = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  fontNameMap: new Map(Object.entries({ 'Apple LiSung': '蘋果儷細宋', Arial: 'Arial', Courier: 'Courier' })),
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

jest.mock('@core/app/components/settings/components/SettingSelect');
jest.mock('@core/app/components/settings/components/SettingFormItem');
jest.mock('@core/app/components/settings/components/SettingSwitch');

jest.mock('@core/helpers/api/swiftray-client', () => ({ hasSwiftray: true }));

jest.mock('@core/helpers/locale-helper', () => ({ isTwOrHk: true }));

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

    // Editor now renders: Text -> Workarea -> Performance
    // Text: font-substitute, font-convert
    // Workarea: model (x2), show_guides, guide_x0, guide_y0, auto-switch-tab, continuous_drawing,
    //           enable-custom-backlash, enable-uv-print-file, print-advanced-mode, use-real-boundary, crop-task-thumbnail
    // Performance: image_downsampling, anti-aliasing, path-engine, simplify_clipper_path
    expect(mockGetPreference).toHaveBeenCalledTimes(18);
    expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'font-substitute');
    expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'font-convert');
    expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(4, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(5, 'show_guides');
    expect(mockGetPreference).toHaveBeenNthCalledWith(6, 'guide_x0');
    expect(mockGetPreference).toHaveBeenNthCalledWith(7, 'guide_y0');
    expect(mockGetPreference).toHaveBeenNthCalledWith(8, 'auto-switch-tab');
    expect(mockGetPreference).toHaveBeenNthCalledWith(9, 'continuous_drawing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(10, 'enable-custom-backlash');
    expect(mockGetPreference).toHaveBeenNthCalledWith(11, 'enable-uv-print-file');
    expect(mockGetPreference).toHaveBeenNthCalledWith(12, 'print-advanced-mode');
    expect(mockGetPreference).toHaveBeenNthCalledWith(13, 'use-real-boundary');
    expect(mockGetPreference).toHaveBeenNthCalledWith(14, 'crop-task-thumbnail');
    expect(mockGetPreference).toHaveBeenNthCalledWith(15, 'image_downsampling');
    expect(mockGetPreference).toHaveBeenNthCalledWith(16, 'anti-aliasing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(17, 'path-engine');
    expect(mockGetPreference).toHaveBeenNthCalledWith(18, 'simplify_clipper_path');
    expect(container).toMatchSnapshot();

    // Test SettingSelect controls - order is now:
    // Text: [0] font-family, [1] font-style, [2] font-convert
    // Workarea: [3] default-units, [4] model
    // Performance: [5] image_downsampling, [6] path-engine
    const selectControls = container.querySelectorAll('.select-control');

    // Font family select
    fireEvent.change(selectControls[0], { target: { value: 'Apple LiSung' } });
    expect(container).toMatchSnapshot();

    fireEvent.change(selectControls[0], { target: { value: 'Courier' } });
    expect(container).toMatchSnapshot();

    // Font style select
    getFontOfPostscriptName.mockReturnValue({
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    fireEvent.change(selectControls[1], { target: { value: 'Courier-Bold' } });
    expect(container).toMatchSnapshot();

    // Font convert select
    fireEvent.change(selectControls[2], { target: { value: '2.0' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'font-convert', '2.0');

    // Default units select
    fireEvent.change(selectControls[3], { target: { value: 'inches' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-units', 'inches');

    // Model select
    fireEvent.change(selectControls[4], { target: { value: 'fbm1' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'model', 'fbm1');

    // Image downsampling select
    fireEvent.change(selectControls[5], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(3);
    expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'image_downsampling', true);

    // Path engine select
    fireEvent.change(selectControls[6], { target: { value: 'swiftray' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(4);
    expect(mockSetPreference).toHaveBeenNthCalledWith(4, 'path-engine', 'swiftray');

    // Test SettingSwitch controls - order is now:
    // Text: [0] font-substitute
    // Workarea: [1] show_guides, [2] auto-switch-tab, [3] continuous_drawing, [4] enable-custom-backlash,
    //           [5] enable-uv-print-file, [6] print-advanced-mode, [7] use-real-boundary, [8] crop-task-thumbnail
    // Performance: [9] anti-aliasing, [10] simplify_clipper_path
    const switchControls = container.querySelectorAll('.switch-control');

    // font-substitute (starts as false, toggle to true)
    fireEvent.click(switchControls[0]);
    expect(mockSetPreference).toHaveBeenCalledTimes(5);
    expect(mockSetPreference).toHaveBeenNthCalledWith(5, 'font-substitute', true);

    // show_guides
    fireEvent.click(switchControls[1]);
    expect(mockSetPreference).toHaveBeenCalledTimes(6);
    expect(mockSetPreference).toHaveBeenNthCalledWith(6, 'show_guides', true);

    // auto-switch-tab
    fireEvent.click(switchControls[2]);
    expect(mockSetPreference).toHaveBeenCalledTimes(7);
    expect(mockSetPreference).toHaveBeenNthCalledWith(7, 'auto-switch-tab', true);

    // continuous_drawing
    fireEvent.click(switchControls[3]);
    expect(mockSetPreference).toHaveBeenCalledTimes(8);
    expect(mockSetPreference).toHaveBeenNthCalledWith(8, 'continuous_drawing', true);

    // enable-custom-backlash
    fireEvent.click(switchControls[4]);
    expect(mockSetPreference).toHaveBeenCalledTimes(9);
    expect(mockSetPreference).toHaveBeenNthCalledWith(9, 'enable-custom-backlash', true);

    // enable-uv-print-file
    fireEvent.click(switchControls[5]);
    expect(mockSetPreference).toHaveBeenCalledTimes(10);
    expect(mockSetPreference).toHaveBeenNthCalledWith(10, 'enable-uv-print-file', true);

    // print-advanced-mode
    fireEvent.click(switchControls[6]);
    expect(mockSetPreference).toHaveBeenCalledTimes(11);
    expect(mockSetPreference).toHaveBeenNthCalledWith(11, 'print-advanced-mode', true);

    // use-real-boundary
    fireEvent.click(switchControls[7]);
    expect(mockSetPreference).toHaveBeenCalledTimes(12);
    expect(mockSetPreference).toHaveBeenNthCalledWith(12, 'use-real-boundary', true);

    // crop-task-thumbnail
    fireEvent.click(switchControls[8]);
    expect(mockSetPreference).toHaveBeenCalledTimes(13);
    expect(mockSetPreference).toHaveBeenNthCalledWith(13, 'crop-task-thumbnail', true);

    // anti-aliasing
    fireEvent.click(switchControls[9]);
    expect(mockSetPreference).toHaveBeenCalledTimes(14);
    expect(mockSetPreference).toHaveBeenNthCalledWith(14, 'anti-aliasing', true);

    // simplify_clipper_path
    fireEvent.click(switchControls[10]);
    expect(mockSetPreference).toHaveBeenCalledTimes(15);
    expect(mockSetPreference).toHaveBeenNthCalledWith(15, 'simplify_clipper_path', true);

    // Test XYItem controls (guide axis)
    fireEvent.change(container.querySelector('#set-guide-axis-x'), { target: { value: 1 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(16);
    expect(mockSetPreference).toHaveBeenNthCalledWith(16, 'guide_x0', 1);

    fireEvent.change(container.querySelector('#set-guide-axis-y'), { target: { value: 2 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(17);
    expect(mockSetPreference).toHaveBeenNthCalledWith(17, 'guide_y0', 2);
  });
});
