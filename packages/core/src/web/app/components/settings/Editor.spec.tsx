import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { OptionValues } from '@core/app/constants/enums';

import Editor from './Editor';

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
jest.mock('@app/implementations/storage', () => ({
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

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
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

describe('settings/Editor', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('initially no warning', async () => {
    const updateConfigChange = jest.fn();
    const updateBeamboxPreferenceChange = jest.fn();
    const updateModel = jest.fn();
    const mockGetBeamboxPreferenceEditingValue = jest.fn();

    mockGetBeamboxPreferenceEditingValue.mockImplementation((key) => {
      if (key === 'guide_x0' || key === 'guide_y0') {
        return 0;
      }

      return false;
    });

    const { container } = render(
      <Editor
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="fbb1b"
        updateBeamboxPreferenceChange={updateBeamboxPreferenceChange}
        updateConfigChange={updateConfigChange}
        updateModel={updateModel}
      />,
    );

    expect(mockGetBeamboxPreferenceEditingValue).toBeCalledTimes(11);
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(1, 'guide_x0');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(2, 'guide_y0');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(3, 'show_guides');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(4, 'image_downsampling');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(5, 'anti-aliasing');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(6, 'continuous_drawing');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(7, 'simplify_clipper_path');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(8, 'enable-low-speed');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(9, 'auto-switch-tab');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(10, 'enable-custom-backlash');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(11, 'path-engine');
    expect(container).toMatchSnapshot();

    const SelectControls = container.querySelectorAll('.select-control');
    const UnitInputs = container.querySelectorAll('.unit-input');

    fireEvent.change(SelectControls[0], { target: { value: 'inches' } });
    expect(updateConfigChange).toHaveBeenCalledTimes(1);
    expect(updateConfigChange).toHaveBeenNthCalledWith(1, 'default-units', 'inches');

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
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(1);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(1, 'model', 'fbm1');
    expect(updateModel).toHaveBeenCalledTimes(1);
    expect(updateModel).toHaveBeenNthCalledWith(1, 'fbm1');

    fireEvent.change(SelectControls[4], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(2);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(2, 'show_guides', 'TRUE');

    fireEvent.change(SelectControls[5], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(3);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(3, 'image_downsampling', 'TRUE');

    fireEvent.change(SelectControls[6], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(4);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(4, 'anti-aliasing', 'TRUE');

    fireEvent.change(SelectControls[7], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(5);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(5, 'continuous_drawing', 'TRUE');

    fireEvent.change(SelectControls[8], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(6);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(6, 'simplify_clipper_path', 'TRUE');

    fireEvent.change(SelectControls[9], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(7);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(7, 'enable-low-speed', 'TRUE');

    fireEvent.change(SelectControls[10], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(8);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(8, 'auto-switch-tab', 'TRUE');

    fireEvent.change(UnitInputs[0], { target: { value: 1 } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(9);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(9, 'guide_x0', 1);

    fireEvent.change(UnitInputs[1], { target: { value: 2 } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(10);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(10, 'guide_y0', 2);

    fireEvent.change(SelectControls[11], { target: { value: 'swiftray' } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(11);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(11, 'path-engine', 'swiftray');

    fireEvent.change(SelectControls[12], { target: { value: OptionValues.TRUE } });
    expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(12);
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(12, 'enable-custom-backlash', 'TRUE');
  });
});
