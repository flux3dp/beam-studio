import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';

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
jest.mock('./components/SettingSelect');
jest.mock('./components/SettingFormItem');

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
    const selectControl = container.querySelector('#print-advanced-mode') as HTMLInputElement;

    fireEvent.change(selectControl, { target: { value: true } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('print-advanced-mode', true);
  });

  test('edit default laser module', () => {
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
    const selectControl = container.querySelector('#default-laser-module') as HTMLInputElement;

    fireEvent.change(selectControl, { target: { value: LayerModule.LASER_20W_DIODE } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('default-laser-module', '2');
  });

  test('edit low laser power', () => {
    const { getByTestId } = render(<AdorModule options={[]} />);
    const input = getByTestId('low-power') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '5' } });
    expect(mockSetPreference).toHaveBeenCalledTimes(1);
    expect(mockSetPreference).toHaveBeenLastCalledWith('low_power', 5);
  });
});
