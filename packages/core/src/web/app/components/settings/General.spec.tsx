import React from 'react';

import { fireEvent, render } from '@testing-library/react';

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

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

import General from './General';

describe('should render correctly', () => {
  test('desktop version', () => {
    const changeActiveLang = jest.fn();
    const updateConfigChange = jest.fn();
    const { container } = render(
      <General
        changeActiveLang={changeActiveLang}
        isWeb={false}
        notificationOptions={[
          {
            label: 'On',
            selected: true,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: false,
            value: 'FALSE',
          },
        ]}
        supportedLangs={{
          de: 'Deutsche',
          en: 'English',
          es: 'Español',
          ja: '日本語',
          'zh-cn': '简体中文',
          'zh-tw': '繁體中文',
        }}
        updateConfigChange={updateConfigChange}
      />,
    );

    expect(container).toMatchSnapshot();

    const controls = container.querySelectorAll('.select-control');

    fireEvent.change(controls[0], { target: { value: 'de' } });
    expect(changeActiveLang).toHaveBeenCalledTimes(1);

    fireEvent.change(controls[1], {
      target: {
        value: 'FALSE',
      },
    });
    expect(updateConfigChange).toHaveBeenCalledTimes(1);
    expect(updateConfigChange).toHaveBeenNthCalledWith(1, 'notification', 'FALSE');
  });

  test('web version', () => {
    const changeActiveLang = jest.fn();
    const updateConfigChange = jest.fn();
    const { container } = render(
      <General
        changeActiveLang={changeActiveLang}
        isWeb
        notificationOptions={[
          {
            label: 'On',
            selected: true,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: false,
            value: 'FALSE',
          },
        ]}
        supportedLangs={{
          de: 'Deutsche',
          en: 'English',
          es: 'Español',
          ja: '日本語',
          'zh-cn': '简体中文',
          'zh-tw': '繁體中文',
        }}
        updateConfigChange={updateConfigChange}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
