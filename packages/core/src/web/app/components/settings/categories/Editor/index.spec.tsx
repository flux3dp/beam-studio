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

const storageMap = new Map<string, unknown>([
  ['default-font', { family: 'Arial', postscriptName: 'ArialMT', style: 'Regular' }],
]);

const mockUseStorageStore = Object.assign(
  (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = Object.fromEntries(storageMap);

    return selector ? selector(state) : state;
  },
  { subscribe: () => () => {} },
);

jest.mock('@core/app/stores/storageStore', () => ({
  getStorage: (key: string) => storageMap.get(key),
  useStorageStore: mockUseStorageStore,
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
const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create<{
  configChanges: Record<string, unknown>;
  getConfig: typeof mockGetConfig;
  getPreference: typeof mockGetPreference;
  setConfig: (key: string, value: unknown) => void;
  setPreference: typeof mockSetPreference;
}>((set, get) => ({
  configChanges: {},
  getConfig: mockGetConfig,
  getPreference: mockGetPreference,
  setConfig: (key, value) => {
    mockSetConfig(key, value);
    set({ configChanges: { ...get().configChanges, [key]: value } });
  },
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/components/settings/shared/hooks/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('@core/app/components/settings/shared/components/SettingSelect');
jest.mock('@core/app/components/settings/shared/components/SettingFormItem');
jest.mock('@core/app/components/settings/shared/components/SettingSwitch');

jest.mock('@core/helpers/api/swiftray-client', () => ({ hasSwiftray: true }));

jest.mock('@core/helpers/locale-helper', () => ({ isTwOrHk: true }));

import Editor from '.';

describe('settings/Editor', () => {
  afterEach(() => {
    jest.resetAllMocks();
    // Reset store state between tests
    useSettingStore.setState({ configChanges: {} });
  });

  test('initially no warning', async () => {
    mockGetPreference.mockImplementation((key) => {
      if (['guide_x0', 'guide_y0'].includes(key)) return 0;

      if (key === 'show_guides') return true;

      return false;
    });

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

    // Editor renders: Workarea -> Text -> Performance (when wrapped=false)
    // Workarea: model (x2), show_guides (x2 - once for switch, once for conditional), guide_x0, guide_y0,
    //           auto-switch-tab, continuous_drawing, enable-custom-backlash, enable-uv-print-file,
    //           print-advanced-mode, use-real-boundary, crop-task-thumbnail
    // Text: font-substitute, font-convert
    // Performance: image_downsampling, anti-aliasing, simplify_clipper_path, path-engine
    expect(mockGetPreference).toHaveBeenCalledTimes(19);
    expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'show_guides');
    expect(mockGetPreference).toHaveBeenNthCalledWith(4, 'show_guides');
    expect(mockGetPreference).toHaveBeenNthCalledWith(5, 'guide_x0');
    expect(mockGetPreference).toHaveBeenNthCalledWith(6, 'guide_y0');
    expect(mockGetPreference).toHaveBeenNthCalledWith(7, 'auto-switch-tab');
    expect(mockGetPreference).toHaveBeenNthCalledWith(8, 'continuous_drawing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(9, 'enable-custom-backlash');
    expect(mockGetPreference).toHaveBeenNthCalledWith(10, 'enable-uv-print-file');
    expect(mockGetPreference).toHaveBeenNthCalledWith(11, 'print-advanced-mode');
    expect(mockGetPreference).toHaveBeenNthCalledWith(12, 'use-real-boundary');
    expect(mockGetPreference).toHaveBeenNthCalledWith(13, 'crop-task-thumbnail');
    expect(mockGetPreference).toHaveBeenNthCalledWith(14, 'font-substitute');
    expect(mockGetPreference).toHaveBeenNthCalledWith(15, 'font-convert');
    expect(mockGetPreference).toHaveBeenNthCalledWith(16, 'image_downsampling');
    expect(mockGetPreference).toHaveBeenNthCalledWith(17, 'anti-aliasing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(18, 'simplify_clipper_path');
    expect(mockGetPreference).toHaveBeenNthCalledWith(19, 'path-engine');
    expect(container).toMatchSnapshot();

    // Test SettingSelect controls - order is now (Workarea -> Text -> Performance):
    // Workarea: [0] default-units, [1] model
    // Text: [2] font-family, [3] font-style, [4] font-convert
    // Performance: [5] image_downsampling
    const selectControls = container.querySelectorAll('.select-control');

    // Default units select
    fireEvent.change(selectControls[0], { target: { value: 'inches' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-units', 'inches');

    // Model select
    fireEvent.change(selectControls[1], { target: { value: 'fbm1' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'model', 'fbm1');

    // Font family select - should use setConfig for deferred update
    fireEvent.change(selectControls[2], { target: { value: 'Apple LiSung' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(2);
    expect(mockSetConfig).toHaveBeenNthCalledWith(2, 'default-font', {
      family: 'Apple LiSung',
      postscriptName: 'LiSungLight',
      style: 'Light',
    });
    expect(container).toMatchSnapshot();

    fireEvent.change(selectControls[2], { target: { value: 'Courier' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(3);
    expect(mockSetConfig).toHaveBeenNthCalledWith(3, 'default-font', {
      family: 'Courier',
      postscriptName: 'Regular',
      style: 'Regular',
    });
    expect(container).toMatchSnapshot();

    // Font style select - should use setConfig for deferred update
    getFontOfPostscriptName.mockReturnValue({
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    fireEvent.change(selectControls[3], { target: { value: 'Courier-Bold' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(4);
    expect(mockSetConfig).toHaveBeenNthCalledWith(4, 'default-font', {
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    expect(container).toMatchSnapshot();

    // Font convert select
    fireEvent.change(selectControls[4], { target: { value: '2.0' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'font-convert', '2.0');

    // Image downsampling select
    fireEvent.change(selectControls[5], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(3);
    expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'image_downsampling', true);

    // Test SettingSwitch controls - order is now (Workarea -> Text -> Performance):
    // Workarea: [0] show_guides, [1] auto-switch-tab, [2] continuous_drawing, [3] enable-custom-backlash,
    //           [4] enable-uv-print-file, [5] print-advanced-mode, [6] use-real-boundary, [7] crop-task-thumbnail
    // Text: [8] font-substitute
    // Performance: [9] anti-aliasing, [10] simplify_clipper_path, [11] path-engine
    const switchControls = container.querySelectorAll('.switch-control');

    // show_guides (starts as true, toggle to false)
    fireEvent.click(switchControls[0]);
    expect(mockSetPreference).toHaveBeenCalledTimes(4);
    expect(mockSetPreference).toHaveBeenNthCalledWith(4, 'show_guides', false);

    // auto-switch-tab
    fireEvent.click(switchControls[1]);
    expect(mockSetPreference).toHaveBeenCalledTimes(5);
    expect(mockSetPreference).toHaveBeenNthCalledWith(5, 'auto-switch-tab', true);

    // continuous_drawing
    fireEvent.click(switchControls[2]);
    expect(mockSetPreference).toHaveBeenCalledTimes(6);
    expect(mockSetPreference).toHaveBeenNthCalledWith(6, 'continuous_drawing', true);

    // enable-custom-backlash
    fireEvent.click(switchControls[3]);
    expect(mockSetPreference).toHaveBeenCalledTimes(7);
    expect(mockSetPreference).toHaveBeenNthCalledWith(7, 'enable-custom-backlash', true);

    // enable-uv-print-file
    fireEvent.click(switchControls[4]);
    expect(mockSetPreference).toHaveBeenCalledTimes(8);
    expect(mockSetPreference).toHaveBeenNthCalledWith(8, 'enable-uv-print-file', true);

    // print-advanced-mode
    fireEvent.click(switchControls[5]);
    expect(mockSetPreference).toHaveBeenCalledTimes(9);
    expect(mockSetPreference).toHaveBeenNthCalledWith(9, 'print-advanced-mode', true);

    // use-real-boundary
    fireEvent.click(switchControls[6]);
    expect(mockSetPreference).toHaveBeenCalledTimes(10);
    expect(mockSetPreference).toHaveBeenNthCalledWith(10, 'use-real-boundary', true);

    // crop-task-thumbnail
    fireEvent.click(switchControls[7]);
    expect(mockSetPreference).toHaveBeenCalledTimes(11);
    expect(mockSetPreference).toHaveBeenNthCalledWith(11, 'crop-task-thumbnail', true);

    // font-substitute
    fireEvent.click(switchControls[8]);
    expect(mockSetPreference).toHaveBeenCalledTimes(12);
    expect(mockSetPreference).toHaveBeenNthCalledWith(12, 'font-substitute', true);

    // anti-aliasing
    fireEvent.click(switchControls[9]);
    expect(mockSetPreference).toHaveBeenCalledTimes(13);
    expect(mockSetPreference).toHaveBeenNthCalledWith(13, 'anti-aliasing', true);

    // simplify_clipper_path
    fireEvent.click(switchControls[10]);
    expect(mockSetPreference).toHaveBeenCalledTimes(14);
    expect(mockSetPreference).toHaveBeenNthCalledWith(14, 'simplify_clipper_path', true);

    // path-engine (switch, not select - toggles between 'swiftray' and 'fluxghost')
    fireEvent.click(switchControls[11]);
    expect(mockSetPreference).toHaveBeenCalledTimes(15);
    expect(mockSetPreference).toHaveBeenNthCalledWith(15, 'path-engine', 'swiftray');

    // Test XYItem controls (guide axis)
    fireEvent.change(container.querySelector('#set-guide-axis-x'), { target: { value: 1 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(16);
    expect(mockSetPreference).toHaveBeenNthCalledWith(16, 'guide_x0', 1);

    fireEvent.change(container.querySelector('#set-guide-axis-y'), { target: { value: 2 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(17);
    expect(mockSetPreference).toHaveBeenNthCalledWith(17, 'guide_y0', 2);
  });
});
