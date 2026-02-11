import React, { act } from 'react';

import { render } from '@testing-library/react';

import { MessageLevel } from '@core/app/actions/message-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { AlertProgressContext, AlertProgressContextProvider } from './AlertProgressContext';
import { ProgressTypes } from '@core/interfaces/IProgress';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    alert: {
      cancel: 'Cancel',
      confirm: 'Confirm',
      error: 'UH-OH',
      info: 'INFO',
      no: 'No',
      ok: 'OK',
      retry: 'Retry',
      warning: 'WARNING',
      yes: 'Yes',
    },
  },
}));

const mockMessageApi = {
  destroy: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  success: jest.fn(),
  warning: jest.fn(),
};

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');
const Children = () => {
  const { alertProgressStack } = React.use(AlertProgressContext);

  return (
    <>
      {alertProgressStack.map((d) => {
        const { key: _, ...dataWithoutKey } = d;

        return JSON.stringify(dataWithoutKey);
      })}
    </>
  );
};

test('should render correctly', async () => {
  const { container, unmount } = render(
    <AlertProgressContextProvider messageApi={mockMessageApi as any}>
      <Children />
    </AlertProgressContextProvider>,
  );

  expect(container).toMatchSnapshot();
  expect(eventEmitter.eventNames().length).toBe(9);
  act(() => {
    eventEmitter.emit('OPEN_PROGRESS', {
      caption: 'preparing',
      id: 'check-status',
      isProgress: true,
      type: ProgressTypes.NONSTOP,
    });
  });
  act(() => {
    eventEmitter.emit('OPEN_PROGRESS', {
      id: 'get_log',
      isProgress: true,
      message: 'downloading',
      percentage: 0,
      type: ProgressTypes.STEPPING,
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
      buttonType: AlertConstants.YES_NO,
      message: 'File already exists, do you want to replace it?',
      onYes: jest.fn(),
      type: AlertConstants.SHOW_POPUP_INFO,
    });
  });
  act(() => {
    // type: 'SHOW_POPUP_WARNING' + default button type + NO button labels
    eventEmitter.emit('POP_UP', {
      callbacks: jest.fn(),
      checkbox: {
        callbacks: jest.fn(),
        text: "Don't Show this next time.",
      },
      message:
        'Some texts were changed to other Fonts when parsing texts to paths and some character may not converted normally.',
      type: AlertConstants.SHOW_POPUP_WARNING,
    });
  });
  act(() => {
    // type: 'SHOW_POPUP_ERROR' + button type: 'RETRY_CANCEL'
    eventEmitter.emit('POP_UP', {
      buttonType: AlertConstants.RETRY_CANCEL,
      id: 'monitor-reconnect',
      message: 'The connection with the machine has broken. Do you want to reconnect?',
      onRetry: jest.fn(),
      type: AlertConstants.SHOW_POPUP_ERROR,
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
      buttonLabels: ['UPDATE'],
      buttonType: AlertConstants.CUSTOM_CANCEL,
      callbacks: jest.fn(),
      caption: 'Machine firmware Update',
      id: 'latest-firmware',
      message: 'You have the latest Machine firmware',
      onCancel: jest.fn(),
    });
  });
  act(() => {
    // has buttons
    eventEmitter.emit('POP_UP', {
      buttons: [
        {
          className: 'btn-default primary',
          label: 'Set Connection',
          onClick: jest.fn(),
        },
        {
          className: 'btn-default primary',
          label: 'Retry',
          onClick: jest.fn(),
        },
      ],
      message: 'Unable to find machine ',
    });
  });
  act(() => {
    // type: 'SHOW_POPUP_INFO' + default button type + has button labels
    eventEmitter.emit('POP_UP', {
      buttonLabels: ['Test Network', 'OK'],
      callbacks: [jest.fn(), jest.fn()],
      caption: 'abcde',
      id: 'machine-info',
      message: 'abcde: 111.222.333.444',
      primaryButtonIndex: 1,
      type: AlertConstants.SHOW_POPUP_INFO,
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
  expect(mockMessageApi.info).toHaveBeenCalledTimes(1);

  unmount();
  expect(eventEmitter.eventNames().length).toBe(0);
});
