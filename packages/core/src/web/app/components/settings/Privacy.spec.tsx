import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    settings: {
      groups: {
        privacy: 'Privacy',
      },
      share_with_flux: 'Share Beam Studio Analytics',
    },
  },
}));

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

import Privacy from './Privacy';

test('should render correctly', () => {
  const updateConfigChange = jest.fn();
  const { container } = render(
    <Privacy
      enableSentryOptions={[
        {
          label: 'On',
          selected: true,
          value: 'TRUE',
        },
        {
          label: 'Off',
          selected: false,
          value: 'FALSE',
        },
      ]}
      updateConfigChange={updateConfigChange}
    />,
  );

  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('.select-control'), {
    target: {
      value: 'FALSE',
    },
  });
  expect(updateConfigChange).toHaveBeenCalledTimes(1);
  expect(updateConfigChange).toHaveBeenNthCalledWith(1, 'enable-sentry', 'FALSE');
});
