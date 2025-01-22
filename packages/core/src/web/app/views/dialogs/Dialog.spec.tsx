import React from 'react';

import { render } from '@testing-library/react';

import { DialogContext } from '@core/app/contexts/DialogContext';

import Dialog from './Dialog';

test('should render correctly', () => {
  const { container } = render(
    <DialogContext.Provider
      value={{
        dialogComponents: [{ component: <div>Hello World</div> }, { component: <span>Hello Flux</span> }],
      }}
    >
      <Dialog className="flux" />
    </DialogContext.Provider>,
  );

  expect(container).toMatchSnapshot();
});
