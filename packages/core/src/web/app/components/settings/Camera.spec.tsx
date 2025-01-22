import React from 'react';

import { render } from '@testing-library/react';

import { OptionValues } from '@core/app/constants/enums';

jest.mock('@core/app/components/settings/Control', () => 'mock-control');

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

import Camera from './Camera';

const mockUpdateBeamboxPreferenceChange = jest.fn();
const mockGetBeamboxPreferenceEditingValue = jest.fn();

test('should render correctly', () => {
  const { container } = render(
    <Camera
      enableCustomPreviewHeightOptions={[
        {
          label: 'On',
          selected: false,
          value: OptionValues.TRUE,
        },
        {
          label: 'Off',
          selected: true,
          value: OptionValues.FALSE,
        },
      ]}
      getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
      keepPreviewResultOptions={[
        {
          label: 'On',
          selected: false,
          value: OptionValues.TRUE,
        },
        {
          label: 'Off',
          selected: true,
          value: OptionValues.FALSE,
        },
      ]}
      updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
    />,
  );

  expect(container).toMatchSnapshot();
});
