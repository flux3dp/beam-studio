import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

jest.mock('@core/helpers/i18n', () => ({
  getActiveLang: () => 'en',
  lang: {
    settings: {
      groups: {
        general: 'General',
      },
      language: 'Language',
      notifications: 'Desktop Notifications',
    },
  },
}));

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({
  getConfig: mockGetConfig,
  setConfig: mockSetConfig,
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

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => ({
  __esModule: true,
  default: mockIsWeb,
}));

import General from './General';

describe('should render correctly', () => {
  test('desktop version', () => {
    mockIsWeb.mockReturnValue(false);

    const changeActiveLang = jest.fn();
    const { container } = render(
      <General
        changeActiveLang={changeActiveLang}
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', selected: false, value: false },
          ] as any
        }
        supportedLangs={{
          de: 'Deutsche',
          en: 'English',
          es: 'Español',
          ja: '日本語',
          'zh-cn': '简体中文',
          'zh-tw': '繁體中文',
        }}
      />,
    );

    expect(container).toMatchSnapshot();

    const controls = container.querySelectorAll('.select-control');

    fireEvent.change(controls[0], { target: { value: 'de' } });
    expect(changeActiveLang).toHaveBeenCalledTimes(1);

    fireEvent.change(controls[1], { target: { value: false } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'notification', false);
  });

  test('web version', () => {
    mockIsWeb.mockReturnValue(true);

    const changeActiveLang = jest.fn();
    const { container } = render(
      <General
        changeActiveLang={changeActiveLang}
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', selected: false, value: false },
          ] as any
        }
        supportedLangs={{
          de: 'Deutsche',
          en: 'English',
          es: 'Español',
          ja: '日本語',
          'zh-cn': '简体中文',
          'zh-tw': '繁體中文',
        }}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
