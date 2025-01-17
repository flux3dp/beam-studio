/* eslint-disable max-len */
import React from 'react';
import { act } from 'react-dom/test-utils';
import { render } from '@testing-library/react';

import AlertConstants from 'app/constants/alert-constants';
import eventEmitterFactory from 'helpers/eventEmitterFactory';
import ProgressConstants from 'app/constants/progress-constants';
import { MessageLevel } from 'app/actions/message-caller';

import { AlertProgressContextProvider, AlertProgressContext } from './AlertProgressContext';

jest.mock('helpers/i18n', () => ({
  lang: {
    alert: {
      info: 'INFO',
      warning: 'WARNING',
      error: 'UH-OH',
      retry: 'Retry',
      confirm: 'Confirm',
      cancel: 'Cancel',
      ok: 'OK',
      yes: 'Yes',
      no: 'No',
    },
  },
}));

const mockMessageApi = {
  destroy: jest.fn(),
  success: jest.fn(),
  loading: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');
const Children = () => {
  const { alertProgressStack } = React.useContext(AlertProgressContext);
  return (
    <>
      {alertProgressStack.map((d) => {
        const { key, ...dataWithoutKey } = d;
        return JSON.stringify(dataWithoutKey);
      })}
    </>
  );
};

test('should render correctly', async () => {
  const { container, unmount } = render(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <AlertProgressContextProvider messageApi={mockMessageApi as any}>
      <Children />
    </AlertProgressContextProvider>
  );
  expect(container).toMatchSnapshot();
  expect(eventEmitter.eventNames().length).toBe(9);
  act(() => {
    eventEmitter.emit('OPEN_PROGRESS', {
      id: 'check-status',
      type: ProgressConstants.NONSTOP,
      caption: 'preparing',
      isProgress: true,
    });
  });
  act(() => {
    eventEmitter.emit('OPEN_PROGRESS', {
      id: 'get_log',
      type: ProgressConstants.STEPPING,
      message: 'downloading',
      isProgress: true,
      percentage: 0,
    });
  });
  expect(container).toMatchSnapshot();
  act(() => {
    eventEmitter.emit('UPDATE_PROGRESS', 'get_log1', {
      percentage: 100,
    });
  });
  expect(container).toMatchSnapshot();
  act(() => {
    eventEmitter.emit('UPDATE_PROGRESS', 'get_log', {
      percentage: 100,
    });
  });
  expect(container).toMatchSnapshot();
  act(() => {
    eventEmitter.emit('UPDATE_PROGRESS', 'check-status', {
      message: 'prepared',
    });
  });
  expect(container).toMatchSnapshot();
  act(() => {
    // type: 'SHOW_POPUP_INFO' + button type: 'YES_NO'
    eventEmitter.emit('POP_UP', {
      type: AlertConstants.SHOW_POPUP_INFO,
      message: 'File already exists, do you want to replace it?',
      buttonType: AlertConstants.YES_NO,
      onYes: jest.fn(),
    });
  });
  act(() => {
    // type: 'SHOW_POPUP_WARNING' + default button type + NO button labels
    eventEmitter.emit('POP_UP', {
      type: AlertConstants.SHOW_POPUP_WARNING,
      message:
        'Some texts were changed to other Fonts when parsing texts to paths and some character may not converted normally.',
      callbacks: jest.fn(),
      checkbox: {
        text: "Don't Show this next time.",
        callbacks: jest.fn(),
      },
    });
  });
  act(() => {
    // type: 'SHOW_POPUP_ERROR' + button type: 'RETRY_CANCEL'
    eventEmitter.emit('POP_UP', {
      id: 'monitor-reconnect',
      type: AlertConstants.SHOW_POPUP_ERROR,
      buttonType: AlertConstants.RETRY_CANCEL,
      message: 'The connection with the machine has broken. Do you want to reconnect?',
      onRetry: jest.fn(),
    });
  });
  act(() => {
    // default type + button type: 'CONFIRM_CANCEL'
    eventEmitter.emit('POP_UP', {
      buttonType: AlertConstants.CONFIRM_CANCEL,
      message:
        'This will load arrangement of presets and replacing customized parameters set in the file, are you sure to proceed?',
      onConfirm: jest.fn(),
    });
  });
  act(() => {
    // default type + button type: 'CUSTOM_CANCEL'
    eventEmitter.emit('POP_UP', {
      id: 'latest-firmware',
      message: 'You have the latest Machine firmware',
      caption: 'Machine firmware Update',
      buttonType: AlertConstants.CUSTOM_CANCEL,
      buttonLabels: ['UPDATE'],
      callbacks: jest.fn(),
      onCancel: jest.fn(),
    });
  });
  act(() => {
    // has buttons
    eventEmitter.emit('POP_UP', {
      message: 'Unable to find machine ',
      buttons: [
        {
          label: 'Set Connection',
          className: 'btn-default primary',
          onClick: jest.fn(),
        },
        {
          label: 'Retry',
          className: 'btn-default primary',
          onClick: jest.fn(),
        },
      ],
    });
  });
  act(() => {
    // type: 'SHOW_POPUP_INFO' + default button type + has button labels
    eventEmitter.emit('POP_UP', {
      id: 'machine-info',
      type: AlertConstants.SHOW_POPUP_INFO,
      caption: 'abcde',
      message: 'abcde: 111.222.333.444',
      buttonLabels: ['Test Network', 'OK'],
      callbacks: [jest.fn(), jest.fn()],
      primaryButtonIndex: 1,
    });
  });

  expect(container).toMatchSnapshot();
  act(() => {
    eventEmitter.emit('POP_BY_ID', 'machine-info');
  });
  expect(container).toMatchSnapshot();

  const response = {
    idExist: false,
  };
  act(() => {
    eventEmitter.emit('CHECK_ID_EXIST', 'latest-firmware', response);
  });
  expect(response.idExist).toBeTruthy();
  act(() => {
    eventEmitter.emit('CHECK_ID_EXIST', 'check-status', response);
  });
  expect(response.idExist).toBeFalsy();
  act(() => {
    eventEmitter.emit('POP_LAST_PROGRESS');
  });
  expect(container).toMatchSnapshot();
  act(() => {
    eventEmitter.emit('OPEN_MESSAGE', { level: MessageLevel.INFO });
  });
  expect(mockMessageApi.info).toBeCalledTimes(1);

  unmount();
  expect(eventEmitter.eventNames().length).toBe(0);
});
