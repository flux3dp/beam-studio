import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets } from '@core/app/constants/layer-module/module-offsets';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();

const useSettingStore = create(() => ({
  getPreference: mockGetPreference,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
jest.mock('./components/SettingFormItem');

const mockOffsets: ModuleOffsets = { fbm2: { [LayerModule.LASER_UNIVERSAL]: [10, 10] } };
const props = {
  unitInputProps: {
    isInch: false,
    precision: 2,
    step: 1,
    unit: 'mm',
  },
};

import Beamo2Module from './Beamo2Module';

describe('test Beamo2Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreference.mockImplementation(
      (key) =>
        ({
          'module-offsets': mockOffsets,
        })[key],
    );
  });

  it('should render correctly', () => {
    const { container } = render(<Beamo2Module {...props} />);

    expect(container).toMatchSnapshot();
  });

  test('edit offset value', () => {
    const { container, rerender } = render(<Beamo2Module {...props} />);
    let input = container.querySelector('#laser-offset-y') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '20' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('module-offsets', {
      fbm2: {
        [LayerModule.LASER_UNIVERSAL]: [10, 20],
      },
    });
    mockOffsets.fbm2[LayerModule.LASER_UNIVERSAL] = [10, 20];
    rerender(<Beamo2Module {...props} />);
    input = container.querySelector('#uv-white-ink-offset-x') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '30' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenLastCalledWith('module-offsets', {
      fbm2: {
        [LayerModule.LASER_UNIVERSAL]: [10, 20],
        [LayerModule.UV_WHITE_INK]: [29.3, -22.8],
      },
    });
  });
});
