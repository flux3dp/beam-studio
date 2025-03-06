import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

jest.mock('@core/helpers/useI18n', () => () => ({
  settings: {
    font_convert: 'Convert Text to Path',
    font_substitute: 'Substitute Unsupported Characters',
    groups: {
      text_to_path: 'Text',
    },
    help_center_urls: {
      font_convert: 'https://support.flux3dp.com/hc/Convert-Text-to-Path',
      font_substitute: 'https://support.flux3dp.com/hc/en-us/articles/360004496575',
    },
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

import TextToPath from './TextToPath';

test('should render correctly', () => {
  mockGetPreference.mockImplementation((key: string) => (key === 'font-substitute' ? true : '2.0'));

  const { container } = render(
    <TextToPath
      options={
        [
          { label: 'On', value: true },
          { label: 'Off', value: false },
        ] as any
      }
    />,
  );

  expect(container).toMatchSnapshot();

  const controls = container.querySelectorAll('.select-control');

  fireEvent.change(controls[0], { target: { value: false } });
  expect(mockSetPreference).toHaveBeenCalledTimes(1);
  expect(mockSetPreference).toHaveBeenNthCalledWith(1, 'font-substitute', false);

  fireEvent.change(controls[1], { target: { value: '2.0' } });
  expect(mockSetPreference).toHaveBeenCalledTimes(2);
  expect(mockSetPreference).toHaveBeenNthCalledWith(2, 'font-convert', '2.0');
});
