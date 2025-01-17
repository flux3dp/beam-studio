import React from 'react';
import { render } from '@testing-library/react';

import { OptionValues } from 'app/constants/enums';

jest.mock('app/components/settings/Control', () => 'mock-control');

jest.mock('app/components/settings/SelectControl', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, label, url, onChange, options }: any) => (
    <div>
      mock-select-control id:{id}
      label:{label}
      url:{url}
      options:{JSON.stringify(options)}
      <input className="select-control" onChange={onChange} />
    </div>
  )
);

// eslint-disable-next-line import/first
import Camera from './Camera';

const mockUpdateBeamboxPreferenceChange = jest.fn();
const mockGetBeamboxPreferenceEditingValue = jest.fn();

test('should render correctly', () => {
  const { container } = render(
    <Camera
      enableCustomPreviewHeightOptions={[
        {
          value: OptionValues.TRUE,
          label: 'On',
          selected: false,
        },
        {
          value: OptionValues.FALSE,
          label: 'Off',
          selected: true,
        },
      ]}
      getBeamboxPreferenceEditingValue={mockGetBeamboxPreferenceEditingValue}
      keepPreviewResultOptions={[
        {
          value: OptionValues.TRUE,
          label: 'On',
          selected: false,
        },
        {
          value: OptionValues.FALSE,
          label: 'Off',
          selected: true,
        },
      ]}
      updateBeamboxPreferenceChange={mockUpdateBeamboxPreferenceChange}
    />
  );
  expect(container).toMatchSnapshot();
});
