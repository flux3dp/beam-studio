import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

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

  expect(mockGetPreference).toHaveBeenCalledTimes(5);
  expect(mockGetPreference).toHaveBeenNthCalledWith(1, 'fast_gradient');
  expect(mockGetPreference).toHaveBeenNthCalledWith(2, 'reverse-engraving');
  expect(mockGetPreference).toHaveBeenNthCalledWith(3, 'segmented-engraving');
  expect(container).toMatchSnapshot();

  const controls = container.querySelectorAll('.select-control');

  fireEvent.change(controls[0], { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'fast_gradient', false);

  fireEvent.change(controls[1], { target: { value: false } });

  expect(mockSetPreference).toHaveBeenCalledTimes(2);
  expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'reverse-engraving', false);

  fireEvent.change(controls[2], { target: { value: false } });

  expect(mockSetPreference).toHaveBeenCalledTimes(3);
  expect(mockSetPreference).toHaveBeenNthCalledWith(3, 'segmented-engraving', false);
});
