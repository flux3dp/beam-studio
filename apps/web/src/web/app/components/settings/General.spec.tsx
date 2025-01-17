import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    settings: {
      language: 'Language',
      notifications: 'Desktop Notifications',
      groups: {
        general: 'General',
      },
    },
  },
  getActiveLang: () => 'en',
}));

jest.mock('app/components/settings/SelectControl', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, label, onChange, options }: any) => (
    <div>
      mock-select-control id:{id}
      label:{label}
      options:{JSON.stringify(options)}
      <input className="select-control" onChange={onChange} />
    </div>
  )
);

// eslint-disable-next-line import/first
import General from './General';

describe('should render correctly', () => {
  test('desktop version', () => {
    const changeActiveLang = jest.fn();
    const updateConfigChange = jest.fn();
    const { container } = render(
      <General
        isWeb={false}
        supportedLangs={{
          de: 'Deutsche',
          en: 'English',
          es: 'Español',
          'zh-tw': '繁體中文',
          ja: '日本語',
          'zh-cn': '简体中文',
        }}
        notificationOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: true,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: false,
          },
        ]}
        changeActiveLang={changeActiveLang}
        updateConfigChange={updateConfigChange}
      />
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
        isWeb
        supportedLangs={{
          de: 'Deutsche',
          en: 'English',
          es: 'Español',
          'zh-tw': '繁體中文',
          ja: '日本語',
          'zh-cn': '简体中文',
        }}
        notificationOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: true,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: false,
          },
        ]}
        changeActiveLang={changeActiveLang}
        updateConfigChange={updateConfigChange}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
