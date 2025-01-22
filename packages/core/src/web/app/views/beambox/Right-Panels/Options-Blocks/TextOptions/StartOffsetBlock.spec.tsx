import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('@core/helpers/i18n', () => ({
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

jest.mock('@core/app/widgets/Unit-Input-v2', () => ({ className, decimal, defaultValue, getValue, max, min }: any) => (
  <div>
    mock-unit-input min:{min}
    max:{max}
    decimal:{decimal}
    defaultValue:{defaultValue}
    className:{JSON.stringify(className)}
    <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
  </div>
));

jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Number: ({ decimal, id, label, max, min, updateValue, value }: any) => (
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
    const { container } = render(<StartOffsetBlock onValueChange={onValueChange} value={0} />);

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
    const { container } = render(<StartOffsetBlock onValueChange={onValueChange} value={0} />);

    expect(container).toMatchSnapshot();
  });
});
