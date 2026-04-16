import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { create } from 'zustand';

import { setStorage } from '@mocks/@core/app/stores/storageStore';

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
  beforeEach(() => {
    setStorage('default-font', { family: 'Arial', postscriptName: 'ArialMT', style: 'Regular' });

    mockGetPreference.mockImplementation((key) => {
      if (['guide_x0', 'guide_y0'].includes(key)) return 0;

      if (key === 'show_guides') return true;

      if (key === 'model') return 'fbb1b';

      if (key === 'path-engine') return 'swiftray';

      return false;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Reset store state between tests
    useSettingStore.setState({ configChanges: {} });
  });

  test('initially no warning', async () => {
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
    // Workarea: model and model-annotation for initModel, model, show_guides, guide_x0, guide_y0,
    //           auto-switch-tab, continuous_drawing, enable-custom-backlash, enable-uv-print-file,
    //           print-advanced-mode, use-real-boundary, crop-task-thumbnail
    // Text: font-substitute, font-convert
    // Performance: image_downsampling, anti-aliasing, simplify_clipper_path, path-engine
    expect(mockGetPreference).toHaveBeenCalledTimes(20);
    expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'model');
    expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'model-annotation');
    expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'model');
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
    expect(mockGetPreference).toHaveBeenNthCalledWith(16, 'path-engine');
    expect(mockGetPreference).toHaveBeenNthCalledWith(17, 'image_downsampling');
    expect(mockGetPreference).toHaveBeenNthCalledWith(18, 'anti-aliasing');
    expect(mockGetPreference).toHaveBeenNthCalledWith(19, 'simplify_clipper_path');
    expect(mockGetPreference).toHaveBeenNthCalledWith(20, 'use_ga_reorder');
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
    mockSetConfig.mockClear();

    // Model select Promark Safe
    fireEvent.change(selectControls[1], { target: { value: 'fpm1_safe' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'model', 'fpm1');
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'model-annotation', { fpm1: { safe: true } });
    mockSetPreference.mockClear();

    // Model select
    fireEvent.change(selectControls[1], { target: { value: 'fbm1' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'model', 'fbm1');
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'model-annotation', {});
    mockSetPreference.mockClear();

    // Font family select - should use setConfig for deferred update
    fireEvent.change(selectControls[2], { target: { value: 'Apple LiSung' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-font', {
      family: 'Apple LiSung',
      postscriptName: 'LiSungLight',
      style: 'Light',
    });
    expect(container).toMatchSnapshot();
    mockSetConfig.mockClear();

    fireEvent.change(selectControls[2], { target: { value: 'Courier' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-font', {
      family: 'Courier',
      postscriptName: 'Regular',
      style: 'Regular',
    });
    expect(container).toMatchSnapshot();
    mockSetConfig.mockClear();

    // Font style select - should use setConfig for deferred update
    getFontOfPostscriptName.mockReturnValue({
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    fireEvent.change(selectControls[3], { target: { value: 'Courier-Bold' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-font', {
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    expect(container).toMatchSnapshot();
    mockSetConfig.mockClear();

    // Font convert select
    fireEvent.change(selectControls[4], { target: { value: '2.0' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'font-convert', '2.0');
    mockSetPreference.mockClear();

    // Image downsampling select
    fireEvent.change(selectControls[5], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'image_downsampling', true);
    mockSetPreference.mockClear();

    // Test SettingSwitch controls - order is now (Workarea -> Text -> Performance):
    // Workarea: [0] show_guides, [1] auto-switch-tab, [2] continuous_drawing, [3] enable-custom-backlash,
    //           [4] enable-uv-print-file, [5] print-advanced-mode, [6] use-real-boundary, [7] crop-task-thumbnail
    // Text: [8] font-substitute
    // Performance: [9] anti-aliasing, [10] simplify_clipper_path, [11] path-engine
    const switchControls = container.querySelectorAll('.switch-control');

    // show_guides (starts as true, toggle to false)
    fireEvent.click(switchControls[0]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'show_guides', false);
    mockSetPreference.mockClear();

    // auto-switch-tab
    fireEvent.click(switchControls[1]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'auto-switch-tab', true);
    mockSetPreference.mockClear();

    // continuous_drawing
    fireEvent.click(switchControls[2]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'continuous_drawing', true);
    mockSetPreference.mockClear();

    // enable-custom-backlash
    fireEvent.click(switchControls[3]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'enable-custom-backlash', true);
    mockSetPreference.mockClear();

    // enable-uv-print-file
    fireEvent.click(switchControls[4]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'enable-uv-print-file', true);
    mockSetPreference.mockClear();

    // print-advanced-mode
    fireEvent.click(switchControls[5]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'print-advanced-mode', true);
    mockSetPreference.mockClear();

    // use-real-boundary
    fireEvent.click(switchControls[6]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'use-real-boundary', true);
    mockSetPreference.mockClear();

    // crop-task-thumbnail
    fireEvent.click(switchControls[7]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'crop-task-thumbnail', true);
    mockSetPreference.mockClear();

    // font-substitute
    fireEvent.click(switchControls[8]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'font-substitute', true);
    mockSetPreference.mockClear();

    // anti-aliasing
    fireEvent.click(switchControls[9]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'anti-aliasing', true);
    mockSetPreference.mockClear();

    // simplify_clipper_path
    fireEvent.click(switchControls[10]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'simplify_clipper_path', true);
    mockSetPreference.mockClear();

    // path-engine (switch, not select - toggles between 'swiftray' and 'fluxghost')
    fireEvent.click(switchControls[11]);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'path-engine', 'fluxghost');
    mockSetPreference.mockClear();

    // Test XYItem controls (guide axis)
    fireEvent.change(container.querySelector('#set-guide-axis-x'), { target: { value: 1 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'guide_x0', 1);
    mockSetPreference.mockClear();

    fireEvent.change(container.querySelector('#set-guide-axis-y'), { target: { value: 2 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'guide_y0', 2);
    mockSetPreference.mockClear();
  });
});
