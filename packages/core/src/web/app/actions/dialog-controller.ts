import { eventEmitter } from 'app/contexts/DialogContext';
// Trigger some dialog here to avoid dialog caller circular import

export const addDialogComponent = (id: string, component: JSX.Element): void => {
  eventEmitter.emit('ADD_DIALOG_COMPONENT', id, component);
};

export const clearAllDialogComponents = (): void => {
  eventEmitter.emit('CLEAR_ALL_DIALOG_COMPONENTS');
};

export const isIdExist = (id: string): boolean => {
  const response = {
    isIdExist: false,
  };
  eventEmitter.emit('CHECK_ID_EXIST', id, response);
  return response.isIdExist;
};

export const popDialogById = (id: string): void => {
  eventEmitter.emit('POP_DIALOG_BY_ID', id);
};

export const showFluxPlusWarning = (monotype?: boolean): void => {
  eventEmitter.emit('SHOW_FLUX_PLUS_WARNING', monotype);
};

export default {};
