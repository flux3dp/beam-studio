import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MessageInstance } from 'antd/es/message/interface';

import { MessageLevel } from '@core/app/actions/message-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import i18n from '@core/helpers/i18n';
import type { IAlert } from '@core/interfaces/IAlert';
import type { IButton } from '@core/interfaces/IButton';
import type { IMessage } from '@core/interfaces/IMessage';
import { type IProgressDialog, ProgressTypes } from '@core/interfaces/IProgress';

const LANG = i18n.lang.alert;

interface IAlertProgressContext {
  alertProgressStack: Array<IAlert | IProgressDialog>;
  popById: (id: string) => void;
  popFromStack: () => void;
}

export const AlertProgressContext = createContext<IAlertProgressContext>({
  alertProgressStack: [],
  popById: () => {},
  popFromStack: () => {},
});

const eventEmitter = eventEmitterFactory.createEventEmitter('alert-progress');

const generateRandomKey = () => Math.floor(10000000 * Math.random());

const buttonsGenerator = (args: IAlert): IButton[] => {
  let { buttons } = args;

  if (buttons) {
    return buttons;
  }

  const { buttonType, id } = args;
  let { buttonLabels, callbacks, onCancel, onConfirm, onNo, onRetry, onYes, primaryButtonIndex } = args;

  switch (buttonType) {
    case AlertConstants.YES_NO:
      onYes = onYes || (() => {});
      onNo = onNo || (() => {});
      buttonLabels = [LANG.yes, LANG.no];
      callbacks = [onYes, onNo];
      primaryButtonIndex = primaryButtonIndex || 0;
      break;
    case AlertConstants.CONFIRM_CANCEL:
      onConfirm = onConfirm || (() => {});
      onCancel = onCancel || (() => {});
      buttonLabels = [LANG.confirm, LANG.cancel];
      primaryButtonIndex = primaryButtonIndex || 0;
      callbacks = [onConfirm, onCancel];
      break;
    case AlertConstants.RETRY_CANCEL:
      onRetry = onRetry || (() => {});
      onCancel = onCancel || (() => {});
      buttonLabels = [LANG.retry, LANG.cancel];
      primaryButtonIndex = primaryButtonIndex || 0;
      callbacks = [onRetry, onCancel];
      break;
    case AlertConstants.CUSTOM_CANCEL:
      onCancel = onCancel || (() => {});
      primaryButtonIndex = primaryButtonIndex || 0;
      buttonLabels = [...(buttonLabels ?? []), LANG.cancel];
      callbacks = [callbacks as () => void, onCancel];
      break;
    default:
      if (!buttonLabels) {
        buttonLabels = [LANG.ok];
        callbacks = callbacks || (() => {});
      }

      break;
  }
  buttons = buttonLabels.map((label, i) => {
    const b = {
      className:
        buttonLabels.length === 1 || i === primaryButtonIndex || primaryButtonIndex === undefined
          ? 'btn-default primary'
          : 'btn-default',
      label,
      onClick: () => {},
    };

    if (callbacks && typeof callbacks === 'function') {
      b.onClick = () => {
        (callbacks as (id: string | undefined) => void)(id);
      };
    } else if (callbacks && callbacks.length > i) {
      b.onClick = () => {
        callbacks[i](id);
      };
    }

    return b;
  });

  return buttons;
};

interface AlertProgressContextProviderProps {
  children: React.ReactNode;
  messageApi: MessageInstance;
}

export const AlertProgressContextProvider = ({
  children,
  messageApi,
}: AlertProgressContextProviderProps): React.JSX.Element => {
  const [alertProgressStack, setAlertProgressStack] = useState<Array<IAlert | IProgressDialog>>([]);

  const stackRef = useRef(alertProgressStack);

  stackRef.current = alertProgressStack;

  const pendingCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (pendingCallbackRef.current) {
      pendingCallbackRef.current();
      pendingCallbackRef.current = null;
    }
  });

  const pushToStack = useCallback((item: IAlert | IProgressDialog, callback = () => {}) => {
    if (item.id) {
      console.log('alert/progress pushed', item.id);
    }

    pendingCallbackRef.current = callback;
    setAlertProgressStack((prev) => [...prev, { ...item, key: generateRandomKey() }]);
  }, []);

  const popFromStack = useCallback(() => {
    setAlertProgressStack((prev) => {
      const newStack = [...prev];

      newStack.pop();

      return newStack;
    });
  }, []);

  const popById = useCallback((id: string) => {
    setAlertProgressStack((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const checkIdExist = useCallback((id: string, response: { idExist: boolean }) => {
    const res = stackRef.current.filter((item) => item.id === id && !('isProgress' in item));

    response.idExist = res.length > 0;
  }, []);

  const checkProgressExist = useCallback((id: string, response: { result: boolean }) => {
    const res = stackRef.current.filter((item) => item.id === id && item.isProgress);

    response.result = res.length > 0;
  }, []);

  const openProgress = useCallback(
    (args: IProgressDialog, callback = () => {}) => {
      const { caption, id, message, type } = args;

      pushToStack({ ...args, caption: caption || '', id, isProgress: true, message: message || '', type }, callback);
    },
    [pushToStack],
  );

  const closeMessage = useCallback(
    (id: string) => {
      messageApi.destroy(id);
    },
    [messageApi],
  );

  const openMessage = useCallback(
    (args: IMessage) => {
      const { level } = args;

      switch (level) {
        case MessageLevel.SUCCESS:
          messageApi.success(args);
          break;
        case MessageLevel.LOADING:
          messageApi.loading(args);
          break;
        case MessageLevel.WARNING:
          messageApi.warning(args);
          break;
        case MessageLevel.ERROR:
          messageApi.error(args);
          break;
        case MessageLevel.INFO:
          messageApi.info(args);
          break;
        default:
          break;
      }
    },
    [messageApi],
  );

  const popLastProgress = useCallback(() => {
    setAlertProgressStack((prev) => {
      let i;

      for (i = prev.length - 1; i >= 0; i -= 1) {
        if ('isProgress' in prev[i]) {
          break;
        }
      }

      if (i >= 0) {
        const newStack = [...prev];

        newStack.splice(i, 1);

        return newStack;
      }

      return prev;
    });
  }, []);

  const updateProgress = useCallback((id: string, args: IProgressDialog) => {
    setAlertProgressStack((prev) => {
      const newStack = [...prev];
      const targetObjects = newStack.filter(({ id: itemId, isProgress }) => isProgress && itemId === id);

      if (targetObjects.length === 0) {
        return prev;
      }

      const targetObject = targetObjects[targetObjects.length - 1];

      if (targetObject.type === ProgressTypes.NONSTOP && !args.caption && args.message) {
        args.caption = args.message;
      }

      Object.assign(targetObject, args);

      return newStack;
    });
  }, []);

  const popUp = useCallback(
    (args: IAlert, callback = () => {}) => {
      const { message, type } = args;
      let { caption } = args;

      switch (type) {
        case AlertConstants.SHOW_POPUP_INFO:
          caption = caption || LANG.info;
          break;
        case AlertConstants.SHOW_POPUP_WARNING:
          caption = LANG.warning;
          break;
        case AlertConstants.SHOW_POPUP_ERROR:
          caption = caption || LANG.error;
          break;
        case AlertConstants.SHOW_POPUP_INSTRUCTION:
          caption = caption || LANG.instruction;
          break;
        default:
          break;
      }

      const buttons = buttonsGenerator(args);

      pushToStack({ ...args, buttons, caption, message }, callback);
    },
    [pushToStack],
  );

  useEffect(() => {
    eventEmitter.on('OPEN_PROGRESS', openProgress);
    eventEmitter.on('OPEN_MESSAGE', openMessage);
    eventEmitter.on('CLOSE_MESSAGE', closeMessage);
    eventEmitter.on('POP_LAST_PROGRESS', popLastProgress);
    eventEmitter.on('UPDATE_PROGRESS', updateProgress);
    eventEmitter.on('POP_BY_ID', popById);
    eventEmitter.on('POP_UP', popUp);
    eventEmitter.on('CHECK_ID_EXIST', checkIdExist);
    eventEmitter.on('CHECK_PROGRESS_EXIST', checkProgressExist);

    return () => {
      eventEmitter.off('OPEN_PROGRESS', openProgress);
      eventEmitter.off('OPEN_MESSAGE', openMessage);
      eventEmitter.off('CLOSE_MESSAGE', closeMessage);
      eventEmitter.off('POP_LAST_PROGRESS', popLastProgress);
      eventEmitter.off('UPDATE_PROGRESS', updateProgress);
      eventEmitter.off('POP_BY_ID', popById);
      eventEmitter.off('POP_UP', popUp);
      eventEmitter.off('CHECK_ID_EXIST', checkIdExist);
      eventEmitter.off('CHECK_PROGRESS_EXIST', checkProgressExist);
    };
  }, [
    openProgress,
    openMessage,
    closeMessage,
    popLastProgress,
    updateProgress,
    popById,
    popUp,
    checkIdExist,
    checkProgressExist,
  ]);

  const value = useMemo(
    () => ({ alertProgressStack, popById, popFromStack }),
    [alertProgressStack, popById, popFromStack],
  );

  return <AlertProgressContext.Provider value={value}>{children}</AlertProgressContext.Provider>;
};
