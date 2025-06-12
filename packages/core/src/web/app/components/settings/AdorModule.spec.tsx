import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { ModuleOffsets } from '@core/app/constants/layer-module/module-offsets';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';

const mockGetPreference = jest.fn();
const mockSetPreference = jest.fn();
const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({
  getConfig: mockGetConfig,
  getPreference: mockGetPreference,
  setConfig: mockSetConfig,
  setPreference: mockSetPreference,
}));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
jest.mock('./components/SettingSelect');
jest.mock('./components/SettingFormItem');

const mockOffsets: ModuleOffsets = { ado1: { [LayerModule.LASER_10W_DIODE]: [10, 10] } };
const props = {
  options: [
    { label: 'On', value: true },
    { label: 'Off', value: false },
  ] as any,
  unitInputProps: {
    isInch: false,
    precision: 2,
    step: 1,
    unit: 'mm',
  },
};

import AdorModule from './AdorModule';

describe('test AdorModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreference.mockImplementation(
      (key) =>
        ({
          'default-laser-module': LayerModule.LASER_10W_DIODE,
          low_power: 3,
          'module-offsets': mockOffsets,
          'print-advanced-mode': true,
        })[key],
    );
  });

  it('should render correctly', () => {
    const { container } = render(<AdorModule {...props} />);

    expect(container).toMatchSnapshot();
  });

  test('edit value', () => {
    const { container, rerender } = render(<AdorModule {...props} />);
    let input = container.querySelector('#\\31 0w-laser-offset-y') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '20' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('module-offsets', {
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [10, 20],
      },
    });
    mockOffsets.ado1[LayerModule.LASER_10W_DIODE] = [10, 20];
    rerender(<AdorModule {...props} />);
    input = container.querySelector('#printer-offset-x') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '30' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenLastCalledWith('module-offsets', {
      ado1: {
        [LayerModule.LASER_10W_DIODE]: [10, 20],
        [LayerModule.PRINTER]: [30, moduleOffsets.ado1[LayerModule.PRINTER][1]],
      },
    });
  });

  test('edit print advanced mode', () => {
    const { container } = render(<AdorModule {...props} />);
    const selectControl = container.querySelector('#print-advanced-mode') as HTMLInputElement;

    fireEvent.change(selectControl, { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('print-advanced-mode', true);
  });

  test('edit default laser module', () => {
    const { container } = render(<AdorModule {...props} />);
    const selectControl = container.querySelector('#default-laser-module') as HTMLInputElement;

    fireEvent.change(selectControl, { target: { value: LayerModule.LASER_20W_DIODE } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('default-laser-module', '2');
  });

  test('edit low laser power', () => {
    const { container } = render(<AdorModule {...props} />);
    const input = container.querySelector('#low-power') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '5' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('low_power', 5);
  });
});
