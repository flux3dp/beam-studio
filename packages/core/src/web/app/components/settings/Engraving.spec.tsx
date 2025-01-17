/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/useI18n', () => () => ({
  settings: {
    bottom_up: 'bottom_up',
    top_down: 'top_down',
    fast_gradient: 'Speed Optimization',
    help_center_urls: {
      fast_gradient: 'https://support.flux3dp.com/hc/en-us/articles/360004496235',
    },
    groups: {
      engraving: 'Rastering (Scanning)',
    },
  },
}));

jest.mock('app/components/settings/Control', () => 'mock-control');

jest.mock(
  'app/components/settings/SelectControl',
  () =>
    ({ id, label, onChange, options, url }: any) =>
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

// eslint-disable-next-line import/first
import Engraving from './Engraving';

test('should render correctly', () => {
  const getBeamboxPreferenceEditingValue = jest.fn();
  const updateBeamboxPreferenceChange = jest.fn();
  getBeamboxPreferenceEditingValue.mockImplementation((key: string) => {
    if (key.startsWith('padding_accel')) return 4000;
    return true;
  });
  const { container } = render(
    <Engraving
      getBeamboxPreferenceEditingValue={getBeamboxPreferenceEditingValue}
      updateBeamboxPreferenceChange={updateBeamboxPreferenceChange}
    />
  );
  expect(getBeamboxPreferenceEditingValue).toHaveBeenCalledTimes(2);
  expect(getBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(1, 'fast_gradient');
  expect(getBeamboxPreferenceEditingValue).toHaveBeenNthCalledWith(2, 'reverse-engraving');
  expect(container).toMatchSnapshot();

  const controls = container.querySelectorAll('.select-control');
  fireEvent.change(controls[0], { target: { value: 'FALSE' } });
  expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(1);
  expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(1, 'fast_gradient', 'FALSE');

  fireEvent.change(controls[1], { target: { value: 'FALSE' } });

  expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(2);
  expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(2, 'reverse-engraving', 'FALSE');
});
