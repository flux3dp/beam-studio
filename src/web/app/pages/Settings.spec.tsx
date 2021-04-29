import * as React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';

jest.mock('app/app-settings', () => ({
  i18n: {
    supported_langs: {
      de: 'Deutsche',
      en: 'English',
      es: 'Español',
      'zh-tw': '繁體中文',
      ja: '日本語',
      'zh-cn': '简体中文',
    },
  },
}));

function DummySettingGeneral() {
  return (
    <div>
      Hello World
    </div>
  );
}
jest.mock('app/views/settings/Setting-General', () => DummySettingGeneral);

// eslint-disable-next-line import/first
import settings from './Settings';

describe('test Settings', () => {
  test('should render correctly', () => {
    const HomeView = settings();
    const wrapper = mount(<HomeView />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
