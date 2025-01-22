import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { DEFAULT_CONTROLLER_MM } from '@core/app/constants/boxgen-constants';
import { BoxgenContext } from '@core/app/contexts/BoxgenContext';

import Controller from './Controller';

jest.mock('@core/helpers/useI18n', () => () => ({
  boxgen: {
    add_option: 'Add Option',
    cover: 'Cover',
    depth: 'Depth',
    edge: 'Edge',
    finger: 'Finger',
    height: 'Height',
    inner: 'Inner',
    joints: 'Joint',
    max_dimension_tooltip: 'Max width/height/depth setting is %s. ',
    outer: 'Outer',
    tCount: 'T Count',
    tDiameter: 'T Diameter',
    thickness: 'Thickness',
    tLength: 'T Length',
    tSlot: 'T-Slot',
    volume: 'Volume',
    width: 'Width',
    workarea: 'Workarea',
  },
}));

jest.mock('@core/app/contexts/BoxgenContext', () => ({
  BoxgenContext: React.createContext(null),
}));

const mockData = DEFAULT_CONTROLLER_MM;
const mockSetData = jest.fn();

describe('test Controller', () => {
  test('should behave correctly', () => {
    const { container } = render(
      <BoxgenContext.Provider
        value={
          {
            boxData: mockData,
            lengthUnit: { decimal: 0, unit: 'mm', unitRatio: 1 },
            setBoxData: mockSetData,
            workarea: { canvasHeight: 210, canvasWidth: 300, label: 'beamo', value: 'fbm1' },
          } as any
        }
      >
        <Controller />
      </BoxgenContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('input[value="inner"]'));
    expect(mockSetData).toBeCalledTimes(1);
    expect(mockSetData).toHaveBeenLastCalledWith({
      ...mockData,
      depth: 86,
      height: 86,
      volume: 'inner',
      width: 86,
    });

    fireEvent.change(container.querySelector('input#width'), { target: { value: 90 } });
    expect(mockSetData).toBeCalledTimes(2);
    expect(mockSetData).toHaveBeenLastCalledWith({
      ...mockData,
      depth: 86,
      height: 86,
      volume: 'inner',
      width: 96,
    });
  });
});
