import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    settings: {
      check_updates: 'Auto Check',
      groups: {
        update: 'Software Updates',
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
import Update from './Update';

describe('should render correctly', () => {
  test('desktop version', () => {
    const updateConfigChange = jest.fn();
    const { container } = render(
      <Update
        isWeb={false}
        updateNotificationOptions={[
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
    expect(updateConfigChange).toHaveBeenNthCalledWith(1, 'auto_check_update', 'FALSE');
  });

  test('web version', () => {
    const updateConfigChange = jest.fn();
    const { container } = render(
      <Update
        isWeb
        updateNotificationOptions={[
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
  });
});
