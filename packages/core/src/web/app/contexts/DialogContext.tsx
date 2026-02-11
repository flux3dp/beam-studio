import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

interface IDialogComponent {
  component: React.JSX.Element;
  id: string;
}

export const DialogContext = React.createContext({
  dialogComponents: [] as IDialogComponent[],
});

export const eventEmitter = eventEmitterFactory.createEventEmitter();

interface DialogContextProviderProps {
  children: React.ReactNode;
}

export const DialogContextProvider = ({ children }: DialogContextProviderProps): React.JSX.Element => {
  const [dialogComponents, setDialogComponents] = useState<IDialogComponent[]>([]);

  const dialogComponentsRef = useRef(dialogComponents);

  dialogComponentsRef.current = dialogComponents;

  const addDialogComponent = useCallback((id: string, dialogComponent: React.JSX.Element) => {
    setDialogComponents((prev) => [...prev, { component: dialogComponent, id }]);
  }, []);

  const isIdExist = useCallback((id: string, response: { isIdExist: boolean }) => {
    response.isIdExist = dialogComponentsRef.current.some((dialog) => dialog.id === id);
  }, []);

  const popDialogById = useCallback((id: string) => {
    setDialogComponents((prev) => prev.filter((dialog) => dialog.id !== id));
  }, []);

  const clearAllDialogComponents = useCallback(() => {
    setDialogComponents([]);
  }, []);

  useEffect(() => {
    eventEmitter.on('ADD_DIALOG_COMPONENT', addDialogComponent);
    eventEmitter.on('CLEAR_ALL_DIALOG_COMPONENTS', clearAllDialogComponents);
    eventEmitter.on('CHECK_ID_EXIST', isIdExist);
    eventEmitter.on('POP_DIALOG_BY_ID', popDialogById);

    return () => {
      eventEmitter.off('ADD_DIALOG_COMPONENT', addDialogComponent);
      eventEmitter.off('CLEAR_ALL_DIALOG_COMPONENTS', clearAllDialogComponents);
      eventEmitter.off('CHECK_ID_EXIST', isIdExist);
      eventEmitter.off('POP_DIALOG_BY_ID', popDialogById);
    };
  }, [addDialogComponent, clearAllDialogComponents, isIdExist, popDialogById]);

  const value = useMemo(() => ({ dialogComponents }), [dialogComponents]);

  return <DialogContext value={value}>{children}</DialogContext>;
};
