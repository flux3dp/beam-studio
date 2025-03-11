import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

jest.mock('@core/helpers/useI18n', () => () => ({
  settings: {
    bottom_up: 'bottom_up',
    fast_gradient: 'Speed Optimization',
    groups: {
      engraving: 'Rastering (Scanning)',
    },
    help_center_urls: {
      fast_gradient: 'https://support.flux3dp.com/hc/en-us/articles/360004496235',
    },
    top_down: 'top_down',
  },
}));

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('./components/SettingSelect');
jest.mock('./components/SettingFormItem');

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

import Engraving from './Engraving';

test('should render correctly', () => {
  mockGetPreference.mockImplementation((key: string) => {
    if (key.startsWith('padding_accel')) {
      return 4000;
    }

    return true;
  });

  const { container } = render(
    <Engraving
      options={
        [
          { label: 'On', value: true },
          { label: 'Off', value: false },
        ] as any
      }
    />,
  );

  expect(mockGetPreference).toHaveBeenCalledTimes(4);
  expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'fast_gradient');
  expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'reverse-engraving');
  expect(container).toMatchSnapshot();

  const controls = container.querySelectorAll('.select-control');

  fireEvent.change(controls[0], { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'fast_gradient', false);

  fireEvent.change(controls[1], { target: { value: false } });

  expect(mockSetPreference).toHaveBeenCalledTimes(2);
  expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'reverse-engraving', false);
});
