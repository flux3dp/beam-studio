import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/useI18n', () => () => ({
  settings: {
    groups: {
      mask: 'Workarea Clipping',
    },
    help_center_urls: {
      mask: 'https://support.flux3dp.com/hc/en-us/articles/360004408876',
    },
    mask: 'Workarea Clipping',
    off: 'Off',
    on: 'On',
  },
}));

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options, url }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    url:{url}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

import Mask from './Mask';

test('should render correctly', () => {
  const getBeamboxPreferenceEditingValue = jest.fn();
  const updateBeamboxPreferenceChange = jest.fn();

  getBeamboxPreferenceEditingValue.mockReturnValue(true);

  const { container } = render(
    <Mask
      getBeamboxPreferenceEditingValue={getBeamboxPreferenceEditingValue}
      updateBeamboxPreferenceChange={updateBeamboxPreferenceChange}
    />,
  );

  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('.select-control'), { target: { value: 'FALSE' } });
  expect(updateBeamboxPreferenceChange).toHaveBeenCalledTimes(1);
  expect(updateBeamboxPreferenceChange).toHaveBeenNthCalledWith(1, 'enable_mask', 'FALSE');
});
