import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { OptionValues } from 'app/constants/enums';

import Editor from './Editor';

jest.mock('helpers/is-dev', () => () => true);

const getFontOfPostscriptName = jest.fn();
jest.mock('app/actions/beambox/font-funcs', () => ({
  requestAvailableFontFamilies: () => ['Arial', 'Courier', 'Apple LiSung'],
  fontNameMap: new Map(
    Object.entries({
      Arial: 'Arial',
      Courier: 'Courier',
      'Apple LiSung': '蘋果儷細宋',
    })
  ),
  requestFontsOfTheFontFamily: (family) => {
    const fonts = {
      Arial: [
        {
          family: 'Arial',
          style: 'Regular',
          postscriptName: 'ArialMT',
        },
        {
          family: 'Arial',
          style: 'Bold',
          postscriptName: 'Arial-BoldMT',
        },
        {
          family: 'Arial',
          style: 'Bold Italic',
          postscriptName: 'Arial-BoldItalicMT',
        },
        {
          family: 'Arial',
          style: 'Italic',
          postscriptName: 'Arial-ItalicMT',
        },
      ],
      Courier: [
        {
          family: 'Courier',
          style: 'Regular',
          postscriptName: 'Regular',
        },
        {
          family: 'Courier',
          style: 'Bold',
          postscriptName: 'Courier-Bold',
        },
        {
          family: 'Courier',
          style: 'Bold Oblique',
          postscriptName: 'Courier-BoldOblique',
        },
        {
          family: 'Courier',
          style: 'Oblique',
          postscriptName: 'Courier-Oblique',
        },
      ],
      'Apple LiSung': [
        {
          family: 'Apple LiSung',
          style: 'Light',
          postscriptName: 'LiSungLight',
        },
      ],
    };
    return fonts[family];
  },
  getFontOfPostscriptName: (...args) => getFontOfPostscriptName(...args),
}));

const map = new Map();
map.set('default-font', {
  family: 'Arial',
  style: 'Regular',
});
jest.mock('implementations/storage', () => ({
  get: (key) => map.get(key),
  set: (key, value) => map.set(key, value),
}));

jest.mock('app/constants/workarea-constants', () => ({
  getWorkarea: () => ({
    label: 'Beambox',
    width: 400,
    pxWidth: 4000,
    height: 375,
    pxHeight: 3750,
    maxSpeed: 300,
    minSpeed: 0.5,
    minPower: 10,
    vectorSpeedLimit: 20,
  }),
}));

jest.mock(
  'app/components/settings/SelectControl',
  () =>
    ({ id, label, url, onChange, options }: any) =>
      (
        <div>
          mock-select-control id:{id}
          label:{label}
          url:{url}
          options:{JSON.stringify(options)}
          <input className="select-control" onChange={onChange} />
        </div>
      )
);

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ id, unit, min, max, defaultValue, getValue, forceUsePropsUnit, className }: any) =>
      (
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
      )
);

jest.mock('helpers/api/swiftray-client', () => ({
  hasSwiftray: true,
}));

jest.mock('helpers/locale-helper', () => ({
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
        selectedModel="fbb1b"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        updateConfigChange={updateConfigChange}
        updateBeamboxPreferenceChange={updateBeamboxPreferenceChange}
        updateModel={updateModel}
      />
    );
    expect(mockGetBeamboxPreferenceEditingValue).toBeCalledTimes(11);
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(1, 'guide_x0');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(2, 'guide_y0');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(3, 'show_guides');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(4, 'image_downsampling');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(5, 'anti-aliasing');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(6, 'continuous_drawing');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(
      7,
      'simplify_clipper_path'
    );
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(8, 'enable-low-speed');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(9, 'auto-switch-tab');
    expect(mockGetBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(
      10,
      'enable-custom-backlash'
    );
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
      style: 'Bold',
      postscriptName: 'Courier-Bold',
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
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(
      6,
      'simplify_clipper_path',
      'TRUE'
    );

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
    expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(
      12,
      'enable-custom-backlash',
      'TRUE'
    );
  });
});
