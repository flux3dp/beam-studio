import React from 'react';
import { create } from 'zustand';
import { render } from '@testing-library/react';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({ getPreference: mockGetPreference, setPreference: mockSetPreference }));

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
jest.mock('./components/SettingFormItem', () => ({ children, id, label, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    {children}
  </div>
));

import Camera from './Camera';

test('should render correctly', () => {
  const { container } = render(
    <Camera
      options={
        [
          { label: 'On', value: false },
          { label: 'Off', value: true },
        ] as any
      }
    />,
  );

  expect(container).toMatchSnapshot();
});
