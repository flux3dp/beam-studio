import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    settings: {
      share_with_flux: 'Share Beam Studio Analytics',
      groups: {
        privacy: 'Privacy',
      },
    },
  },
}));

jest.mock('app/components/settings/SelectControl', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, label, onChange, options }: any) => (
    <div>
      mock-select-control id:{id}
      label:{label}
      options:{JSON.stringify(options)}
      <input className="select-control" onChange={onChange} />
    </div>
  )
);

// eslint-disable-next-line import/first
import Privacy from './Privacy';

test('should render correctly', () => {
  const updateConfigChange = jest.fn();
  const { container } = render(
    <Privacy
      enableSentryOptions={[
        {
          value: 'TRUE',
          label: 'On',
          selected: true,
        },
        {
          value: 'FALSE',
          label: 'Off',
          selected: false,
        },
      ]}
      updateConfigChange={updateConfigChange}
    />
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
