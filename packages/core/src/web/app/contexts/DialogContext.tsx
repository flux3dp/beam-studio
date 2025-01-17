import * as React from 'react';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import isWeb from 'helpers/is-web';

export const DialogContext = React.createContext({
  dialogComponents: [],
});

export const eventEmitter = eventEmitterFactory.createEventEmitter();

export class DialogContextProvider extends React.Component<any> {
  private dialogComponents: {
    id: string,
    component: JSX.Element
  }[];

  constructor(props) {
    super(props);
    this.dialogComponents = [];
  }

  componentDidMount() {
    eventEmitter.on('ADD_DIALOG_COMPONENT', this.addDialogComponent.bind(this));
    eventEmitter.on('CLEAR_ALL_DIALOG_COMPONENTS', this.clearAllDialogComponents.bind(this));
    eventEmitter.on('CHECK_ID_EXIST', this.isIdExist.bind(this));
    eventEmitter.on('POP_DIALOG_BY_ID', this.popDialogById.bind(this));
    if (isWeb()) {
      window.addEventListener('DISMISS_FLUX_LOGIN', () => {
        this.popDialogById.call(this, 'flux-id-login');
      });
    }
  }

  componentWillUnmount() {
    eventEmitter.removeAllListeners();
  }

  addDialogComponent = (id: string, dialogComponent: JSX.Element): void => {
    this.dialogComponents.push({ id, component: dialogComponent });
    this.forceUpdate();
  };

  isIdExist = (id: string, response: {
    isIdExist: boolean,
  }): void => {
    response.isIdExist = this.dialogComponents.some((dialog) => dialog.id === id);
  };

  popDialogById = (id: string): void => {
    this.dialogComponents = this.dialogComponents.filter((dialog) => dialog.id !== id);
    this.forceUpdate();
  };

  clearAllDialogComponents = (): void => {
    this.dialogComponents = [];
    this.forceUpdate();
  };

  render() {
    const { children } = this.props;
    return (
      <DialogContext.Provider
        value={{
          dialogComponents: this.dialogComponents,
        }}
      >
        {children}
      </DialogContext.Provider>
    );
  }
}
