import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { OptionValues } from '@core/app/constants/enums';

import BB2Settings from './BB2Settings';

jest.mock('./SelectControl', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

const mockUpdateBeamboxPreferenceChange = jest.fn();
const mockGetBeamboxPreferenceEditingValue = jest.fn();

jest.mock('@core/helpers/checkFeature', () => ({
  checkFbb2: () => true,
}));

describe('test BB2Settings', () => {
  it('should render correctly', () => {
    const { container } = render(
      <BB2Settings
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('set value', () => {
    const { container } = render(
      <BB2Settings
        getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
        updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
      />,
    );

    const selectControl = container.querySelector('.select-control') as HTMLInputElement;

    fireEvent.change(selectControl, { target: { value: OptionValues.TRUE } });

    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenCalledTimes(1);
    expect(mockUpdateBeamboxPreferenceChange).toHaveBeenCalledWith('curve_engraving_speed_limit', OptionValues.TRUE);
  });
});
