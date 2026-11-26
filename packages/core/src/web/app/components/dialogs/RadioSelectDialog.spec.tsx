import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';

import RadioSelectDialog from './RadioSelectDialog';

test('preserves selection and cancel behavior for callers without supplementary content', () => {
  const onOk = jest.fn();
  const onCancel = jest.fn();
  const { getByRole, queryByRole } = render(
    <RadioSelectDialog
      defaultValue="laser"
      onCancel={onCancel}
      onOk={onOk}
      options={[
        { label: 'Laser', value: 'laser' },
        { label: 'Printing', value: 'printing' },
      ]}
      title="Module"
    />,
  );

  expect(queryByRole('link')).not.toBeInTheDocument();
  expect(getByRole('radio', { name: 'Laser' })).toBeChecked();
  fireEvent.click(getByRole('radio', { name: 'Printing' }));
  fireEvent.click(getByRole('button', { name: i18n.lang.alert.cancel }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onOk).not.toHaveBeenCalled();
});
