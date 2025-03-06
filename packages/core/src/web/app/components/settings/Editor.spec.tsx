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

jest.mock('./components/SettingSelect', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input
      className="select-control"
      onChange={({ target: { value } }) => onChange(['false', 'true'].includes(value) ? value === 'true' : value)}
    />
  </div>
));

jest.mock('./components/SettingFormItem', () => ({ children, id, label, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    {children}
  </div>
));

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ className, defaultValue, forceUsePropsUnit, getValue, id, max, min, unit }: any) => (
      <div>
        mock-unit-input id:{id}
        unit:{unit}
        min:{min}
        max:{max}
        defaultValue:{defaultValue}
        forceUsePropsUnit:{forceUsePropsUnit ? 'true' : 'false'}
        className:{JSON.stringify(className)}
        <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
      </div>
    ),
);

jest.mock('@core/helpers/api/swiftray-client', () => ({
  hasSwiftray: true,
}));

jest.mock('@core/helpers/locale-helper', () => ({
  isTwOrHk: true,
}));

import Editor from './Editor';

describe('settings/Editor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initially no warning', async () => {
    mockGetPreference.mockImplementation((key) => (['guide_x0', 'guide_y0'].includes(key) ? 0 : false));

    const { container } = render(
      <Editor
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );

    expect(mockGetPreference).toHaveBeenCalledTimes(12);
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
    expect(container).toMatchSnapshot();

    const SelectControls = container.querySelectorAll('.select-control');
    const UnitInputs = container.querySelectorAll('.unit-input');

    fireEvent.change(SelectControls[0], { target: { value: 'inches' } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'default-units', 'inches');

    fireEvent.change(SelectControls[1], { target: { value: 'Apple LiSung' } });
    expect(container).toMatchSnapshot();

    fireEvent.change(SelectControls[1], { target: { value: 'Courier' } });
    expect(container).toMatchSnapshot();

    getFontOfPostscriptName.mockReturnValue({
      family: 'Courier',
      postscriptName: 'Courier-Bold',
      style: 'Bold',
    });
    fireEvent.change(SelectControls[2], { target: { value: 'Courier-Bold' } });
    expect(container).toMatchSnapshot();

    fireEvent.change(SelectControls[3], { target: { value: 'fbm1' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'model', 'fbm1');

    fireEvent.change(SelectControls[4], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'show_guides', true);

    fireEvent.change(SelectControls[5], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(3);
    expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'image_downsampling', true);

    fireEvent.change(SelectControls[6], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(4);
    expect(mockSetPreference).toHaveBeenNthCalledWith(4, 'anti-aliasing', true);

    fireEvent.change(SelectControls[7], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(5);
    expect(mockSetPreference).toHaveBeenNthCalledWith(5, 'continuous_drawing', true);

    fireEvent.change(SelectControls[8], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(6);
    expect(mockSetPreference).toHaveBeenNthCalledWith(6, 'simplify_clipper_path', true);

    fireEvent.change(SelectControls[9], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(7);
    expect(mockSetPreference).toHaveBeenNthCalledWith(7, 'auto-switch-tab', true);

    fireEvent.change(UnitInputs[0], { target: { value: 1 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(8);
    expect(mockSetPreference).toHaveBeenNthCalledWith(8, 'guide_x0', 1);

    fireEvent.change(UnitInputs[1], { target: { value: 2 } });
    expect(mockSetPreference).toHaveBeenCalledTimes(9);
    expect(mockSetPreference).toHaveBeenNthCalledWith(9, 'guide_y0', 2);

    fireEvent.change(SelectControls[10], { target: { value: 'swiftray' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(10);
    expect(mockSetPreference).toHaveBeenNthCalledWith(10, 'path-engine', 'swiftray');

    fireEvent.change(SelectControls[11], { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(11);
    expect(mockSetPreference).toHaveBeenNthCalledWith(11, 'enable-custom-backlash', true);
  });
});
