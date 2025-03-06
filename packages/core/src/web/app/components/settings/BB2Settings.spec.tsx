import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { create } from 'zustand';

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
    <input className="select-control" onChange={(e) => onChange(e.target.value === 'true')} />
  </div>
));

import BB2Settings from './BB2Settings';

describe('test BB2Settings', () => {
  it('should render correctly', () => {
    const { container } = render(
      <BB2Settings
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

  test('set value', () => {
    const { container } = render(
      <BB2Settings
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );

    const selectControl = container.querySelector('.select-control') as HTMLInputElement;

    fireEvent.change(selectControl, { target: { value: true } });

    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenCalledWith('curve_engraving_speed_limit', true);
  });
});
