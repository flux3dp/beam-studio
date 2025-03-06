import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/useI18n', () => () => ({
  settings: {
    groups: {
      mask: 'Workarea Clipping',
    },
    help_center_urls: {
      mask: 'https://support.flux3dp.com/hc/en-us/articles/360004408876',
    },
    mask: 'Workarea Clipping',
    off: 'Off',
    on: 'On',
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

jest.mock('./components/SettingSelect', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input
      className="select-control"
      onChange={(e) =>
        onChange(['false', 'true'].includes(e.target.value) ? e.target.value === 'true' : e.target.value)
      }
    />
  </div>
));

import Mask from './Mask';

test('should render correctly', () => {
  mockGetPreference.mockReturnValue(true);

  const { container } = render(
    <Mask
      options={
        [
          { label: 'On', value: true },
          { label: 'Off', value: false },
        ] as any
      }
    />,
  );

  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('.select-control'), { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'enable_mask', false);
});
