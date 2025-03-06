import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { create } from 'zustand';

jest.mock('@core/helpers/i18n', () => ({
  lang: { settings: { groups: { privacy: 'Privacy' }, share_with_flux: 'Share Beam Studio Analytics' } },
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
    <input className="select-control" onChange={(e) => onChange(e.target.value === 'true')} />
  </div>
));

import Privacy from './Privacy';

test('should render correctly', () => {
  mockGetConfig.mockReturnValue(true);

  const { container } = render(
    <Privacy
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
  expect(mockGetConfig).toHaveBeenCalledWith('enable-sentry');
  expect(mockSetConfig).toHaveBeenCalledWith('enable-sentry', false);
});
