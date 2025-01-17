/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      right_panel: {
        object_panel: {
          option_panel: {
            start_offset: 'Text Offset',
          },
        },
      },
    },
  },
}));

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ min, max, defaultValue, getValue, decimal, className }: any) =>
      (
        <div>
          mock-unit-input min:{min}
          max:{max}
          decimal:{decimal}
          defaultValue:{defaultValue}
          className:{JSON.stringify(className)}
          <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
        </div>
      )
);

jest.mock('app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Number: ({ id, label, min, max, value, updateValue, decimal }: any) => (
    <div>
      mock-number-item id:{id}
      label:{label}
      min:{min}
      max:{max}
      decimal:{decimal}
      value:{value}
      <input className="unit-input" onChange={(e) => updateValue(+e.target.value)} />
    </div>
  ),
}));

import StartOffsetBlock from './StartOffsetBlock';

describe('test StartOffsetBlock', () => {
  test('should render correctly', () => {
    const onValueChange = jest.fn();
    const { container } = render(<StartOffsetBlock value={0} onValueChange={onValueChange} />);
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('div.option-block'));
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 100 } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, 100);
    expect(container).toMatchSnapshot();
  });

  test('should render correctly in mobile', () => {
    useIsMobile.mockReturnValue(true);
    const onValueChange = jest.fn();
    const { container } = render(<StartOffsetBlock value={0} onValueChange={onValueChange} />);
    expect(container).toMatchSnapshot();
  });
});
