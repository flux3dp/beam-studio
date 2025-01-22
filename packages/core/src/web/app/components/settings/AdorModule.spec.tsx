import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { OptionValues } from '@core/app/constants/enums';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';

import AdorModule from './AdorModule';

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
  '@core/app/components/settings/Control',
  () =>
    ({ children, label }: { children: React.ReactNode; label: string }) => (
      <div>
        <div>Mock Control{label}</div>
        {children}
      </div>
    ),
);
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
jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options }: any) => (
  <div>
    Mock SelectControl
    <div>{label}</div>
    <div>{id}</div>
    <div>
      {options.map((opt) => (
        <button key={opt.label} onClick={() => onChange({ target: { value: opt.value } })} type="button">
          {opt.label}
        </button>
      ))}
    </div>
  </div>
));

const mockOffsetInit: { [m: number]: [number, number] } = {
  [LayerModule.LASER_10W_DIODE]: [10, 10],
};

const mockGetBeamboxPreferenceEditingValue = jest.fn();
const mockUpdateBeamboxPreferenceChange = jest.fn();

describe('test AdorModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBeamboxPreferenceEditingValue
      .mockReturnValueOnce(LayerModule.LASER_10W_DIODE)
      .mockReturnValueOnce(mockOffsetInit)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(3);
  });

  it('should render correctly', () => {
    const { container } = render(
      <AdorModule
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="ado1"
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('edit value', () => {
    const { getByTestId, rerender } = render(
      <AdorModule
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="ado1"
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );
    let input = getByTestId('10w-laser-y-offset') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '20' } });
    expect(mockUpdateBeamboxPreferenceChange).toBeCalledTimes(1);
    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenLastCalledWith('module-offsets', {
      [LayerModule.LASER_10W_DIODE]: [10, 20],
    });

    const offsetValue = { ...mockOffsetInit };

    offsetValue[LayerModule.LASER_10W_DIODE] = [10, 20];
    mockGetBeamboxPreferenceEditingValue.mockClear();
    mockGetBeamboxPreferenceEditingValue
      .mockReturnValueOnce(LayerModule.LASER_10W_DIODE)
      .mockReturnValueOnce(offsetValue)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(3);
    rerender(
      <AdorModule
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="ado1"
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );
    input = getByTestId('printer-x-offset') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '30' } });
    expect(mockUpdateBeamboxPreferenceChange).toBeCalledTimes(2);
    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenLastCalledWith('module-offsets', {
      [LayerModule.LASER_10W_DIODE]: [10, 20],
      [LayerModule.PRINTER]: [30, moduleOffsets[LayerModule.PRINTER][1]],
    });
  });

  test('edit print advanced mode', () => {
    const { getByText } = render(
      <AdorModule
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="ado1"
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );
    const button = getByText('On');

    fireEvent.click(button);
    expect(mockUpdateBeamboxPreferenceChange).toBeCalledTimes(1);
    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenLastCalledWith('print-advanced-mode', OptionValues.TRUE);
  });

  test('edit default laser module', () => {
    const { getByText } = render(
      <AdorModule
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="ado1"
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );
    const button = getByText('laser_20w_diode');

    fireEvent.click(button);
    expect(mockUpdateBeamboxPreferenceChange).toBeCalledTimes(1);
    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenLastCalledWith(
      'default-laser-module',
      LayerModule.LASER_20W_DIODE,
    );
  });

  test('edit low laser power', () => {
    const { getByTestId } = render(
      <AdorModule
        defaultUnit="mm"
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        selectedModel="ado1"
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );
    const input = getByTestId('low-power') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '5' } });
    expect(mockUpdateBeamboxPreferenceChange).toBeCalledTimes(1);
    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenLastCalledWith('low_power', 5);
  });
});
