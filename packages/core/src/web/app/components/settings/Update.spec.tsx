import React from 'react';

import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    settings: {
      check_updates: 'Auto Check',
      groups: {
        update: 'Software Updates',
      },
    },
  },
}));

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({ getConfig: mockGetConfig, setConfig: mockSetConfig }));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
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

jest.mock('@core/helpers/is-web', () => mockIsWeb);

import Update from './Update';

describe('should render correctly', () => {
  test('desktop version', () => {
    mockIsWeb.mockReturnValue(false);

    const { container } = render(
      <Update
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
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'auto_check_update', false);
  });

  test('web version', () => {
    mockIsWeb.mockReturnValue(true);

    const { container } = render(
      <Update
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
