import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    settings: {
      check_updates: 'Auto Check',
      groups: {
        update: 'Software Updates',
      },
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

import Update from './Update';

describe('should render correctly', () => {
  test('desktop version', () => {
    const updateConfigChange = jest.fn();
    const { container } = render(
      <Update
        isWeb={false}
        updateConfigChange={updateConfigChange}
        updateNotificationOptions={[
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
      />,
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
        updateConfigChange={updateConfigChange}
        updateNotificationOptions={[
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
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
