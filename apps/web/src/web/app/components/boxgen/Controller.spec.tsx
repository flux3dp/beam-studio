import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { BoxgenContext } from 'app/contexts/BoxgenContext';
import { DEFAULT_CONTROLLER_MM } from 'app/constants/boxgen-constants';

import Controller from './Controller';

jest.mock('helpers/useI18n', () => () => ({
  boxgen: {
    workarea: 'Workarea',
    max_dimension_tooltip: 'Max width/height/depth setting is %s. ',
    volume: 'Volume',
    outer: 'Outer',
    inner: 'Inner',
    width: 'Width',
    height: 'Height',
    depth: 'Depth',
    cover: 'Cover',
    thickness: 'Thickness',
    add_option: 'Add Option',
    joints: 'Joint',
    finger: 'Finger',
    tSlot: 'T-Slot',
    edge: 'Edge',
    tCount: 'T Count',
    tDiameter: 'T Diameter',
    tLength: 'T Length',
  },
}));

jest.mock('app/contexts/BoxgenContext', () => ({
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
            setBoxData: mockSetData,
            workarea: { value: 'fbm1', label: 'beamo', canvasWidth: 300, canvasHeight: 210 },
            lengthUnit: { unit: 'mm', unitRatio: 1, decimal: 0 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any
        }
      >
        <Controller />
      </BoxgenContext.Provider>
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('input[value="inner"]'));
    expect(mockSetData).toBeCalledTimes(1);
    expect(mockSetData).toHaveBeenLastCalledWith({
      ...mockData,
      volume: 'inner',
      width: 86,
      height: 86,
      depth: 86,
    });

    fireEvent.change(container.querySelector('input#width'), { target: { value: 90 } });
    expect(mockSetData).toBeCalledTimes(2);
    expect(mockSetData).toHaveBeenLastCalledWith({
      ...mockData,
      volume: 'inner',
      width: 96,
      height: 86,
      depth: 86,
    });
  });
});
