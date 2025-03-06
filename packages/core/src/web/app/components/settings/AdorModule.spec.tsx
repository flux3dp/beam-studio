import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

import LayerModule from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        slider: {
          regular: 'Regular',
          very_high: 'Max',
        },
      },
    },
  },
  layer_module: {
    laser_2w_infrared: 'laser_2w_infrared',
    laser_10w_diode: 'laser_10w_diode',
    laser_20w_diode: 'laser_20w_diode',
    printing: 'printing',
  },
  settings: {
    default_laser_module: 'default_laser_module',
    groups: {
      ador_modules: 'ador_modules',
    },
    low_laser_for_preview: 'Laser for Running Frame',
    module_offset_2w_ir: 'module_offset_2w_ir',
    module_offset_10w: 'module_offset_10w',
    module_offset_20w: 'module_offset_20w',
    module_offset_printer: 'module_offset_printer',
    none: 'None',
    printer_advanced_mode: 'printer_advanced_mode',
  },
}));

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ defaultValue, getValue, id }: { defaultValue: number; getValue: (val: number) => void; id: string }) => (
      <div>
        <input
          data-testid={id}
          id={id}
          onChange={(e) => getValue(Number.parseFloat(e.target.value))}
          type="number"
          value={defaultValue}
        />
      </div>
    ),
);

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
jest.mock('./components/SettingSelect', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    {options.map((opt) => (
      <button
        key={opt.label}
        onClick={() => onChange(['false', 'true'].includes(opt.value) ? opt.value === 'true' : opt.value)}
        type="button"
      >
        {opt.label}
      </button>
    ))}
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

const mockOffsetInit: { [m: number]: [number, number] } = {
  [LayerModule.LASER_10W_DIODE]: [10, 10],
};

import AdorModule from './AdorModule';

describe('test AdorModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPreference
      .mockReturnValueOnce(LayerModule.LASER_10W_DIODE)
      .mockReturnValueOnce(mockOffsetInit)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(3);
  });

  it('should render correctly', () => {
    const { container } = render(
      <AdorModule
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

  test('edit value', () => {
    const { getByTestId, rerender } = render(
      <AdorModule
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );
    let input = getByTestId('10w-laser-y-offset') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '20' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('module-offsets', {
      [LayerModule.LASER_10W_DIODE]: [10, 20],
    });

    const offsetValue = { ...mockOffsetInit };

    offsetValue[LayerModule.LASER_10W_DIODE] = [10, 20];
    mockGetPreference.mockClear();
    mockGetPreference
      .mockReturnValueOnce(LayerModule.LASER_10W_DIODE)
      .mockReturnValueOnce(offsetValue)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(3);
    rerender(
      <AdorModule
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );
    input = getByTestId('printer-x-offset') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '30' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(2);
    expect(mockSetPreference).toHaveBeenLastCalledWith('module-offsets', {
      [LayerModule.LASER_10W_DIODE]: [10, 20],
      [LayerModule.PRINTER]: [30, moduleOffsets[LayerModule.PRINTER][1]],
    });
  });

  test('edit print advanced mode', () => {
    const { getByText } = render(
      <AdorModule
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );
    const button = getByText('On');

    fireEvent.click(button);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('print-advanced-mode', true);
  });

  test('edit default laser module', () => {
    const { getByText } = render(
      <AdorModule
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );
    const button = getByText('laser_20w_diode');

    fireEvent.click(button);
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('default-laser-module', LayerModule.LASER_20W_DIODE);
  });

  test('edit low laser power', () => {
    const { getByTestId } = render(<AdorModule options={[]} />);
    const input = getByTestId('low-power') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '5' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('low_power', 5);
  });
});
