import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({
  getConfig: mockGetConfig,
  setConfig: mockSetConfig,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({
  useSettingStore,
}));

jest.mock('./components/SettingSelect');
jest.mock('./components/SettingSwitch');

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => mockIsWeb);

jest.mock('@core/helpers/system-helper', () => ({
  getArchDisplayName: () => 'Apple Silicon',
}));

import General from './General';

describe('should render correctly', () => {
  beforeAll(() => {
    window.FLUX = { version: '2.5.0' } as typeof window.FLUX;
  });

  test('desktop version', () => {
    mockIsWeb.mockReturnValue(false);

    const changeActiveLang = jest.fn();
    const { container } = render(
      <General
        changeActiveLang={changeActiveLang}
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

    const selectControl = container.querySelector('.select-control');

    fireEvent.change(selectControl, { target: { value: 'de' } });
    expect(changeActiveLang).toHaveBeenCalledTimes(1);

    const switchControls = container.querySelectorAll('.switch-control');

    fireEvent.click(switchControls[0]);
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'auto_check_update', true);

    fireEvent.click(switchControls[1]);
    expect(mockSetConfig).toHaveBeenCalledTimes(2);
    expect(mockSetConfig).toHaveBeenNthCalledWith(2, 'notification', true);
  });

  test('web version', () => {
    mockIsWeb.mockReturnValue(true);

    const changeActiveLang = jest.fn();
    const { container } = render(
      <General
        changeActiveLang={changeActiveLang}
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
