import React from 'react';
import { create } from 'zustand';
import { render } from '@testing-library/react';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({ getPreference: mockGetPreference, setPreference: mockSetPreference }));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
jest.mock('./components/SettingSelect');
jest.mock('./components/SettingFormItem');

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
