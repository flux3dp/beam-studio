import React, { act, useContext } from 'react';

import { render } from '@testing-library/react';

import { DialogContext, DialogContextProvider, eventEmitter } from './DialogContext';

const Children = () => {
  const { dialogComponents } = useContext(DialogContext);

  return (
    <>
      {dialogComponents.map(({ component, id }) => (
        <div id={id} key={id}>
          {component}
        </div>
      ))}
    </>
  );
};

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('desktop version', () => {
    const { container, unmount } = render(
      <DialogContextProvider>
        <Children />
      </DialogContextProvider>,
    );

    expect(container).toMatchSnapshot();
    expect(eventEmitter.eventNames().length).toBe(4);

    act(() => {
      eventEmitter.emit('ADD_DIALOG_COMPONENT', '12345', <div>Hello World</div>);
      eventEmitter.emit('ADD_DIALOG_COMPONENT', '67890', <span>Hello Flux</span>);
      eventEmitter.emit('ADD_DIALOG_COMPONENT', 'flux-id-login', <span>Flux Login</span>);
    });
    expect(container).toMatchSnapshot();

    const response = {
      isIdExist: false,
    };

    eventEmitter.emit('CHECK_ID_EXIST', '12345', response);
    expect(response.isIdExist).toBeTruthy();
    eventEmitter.emit('CHECK_ID_EXIST', '123456', response);
    expect(response.isIdExist).toBeFalsy();
    act(() => eventEmitter.emit('POP_DIALOG_BY_ID', '67890'));
    expect(container).toMatchSnapshot();
    act(() => eventEmitter.emit('CLEAR_ALL_DIALOG_COMPONENTS'));
    expect(container).toMatchSnapshot();

    unmount();
    expect(eventEmitter.eventNames().length).toBe(0);
  });
});
