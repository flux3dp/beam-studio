import * as React from 'react';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

interface Props {
  children: React.ReactNode;
}

interface IDialogComponent {
  component: React.JSX.Element;
  id: string;
}

export const DialogContext = React.createContext({
  dialogComponents: [] as IDialogComponent[],
});

export const eventEmitter = eventEmitterFactory.createEventEmitter();

export class DialogContextProvider extends React.Component<Props> {
  private dialogComponents: IDialogComponent[];

  constructor(props: Props) {
    super(props);
    this.dialogComponents = [];
  }

  componentDidMount() {
    eventEmitter.on('ADD_DIALOG_COMPONENT', this.addDialogComponent.bind(this));
    eventEmitter.on('CLEAR_ALL_DIALOG_COMPONENTS', this.clearAllDialogComponents.bind(this));
    eventEmitter.on('CHECK_ID_EXIST', this.isIdExist.bind(this));
    eventEmitter.on('POP_DIALOG_BY_ID', this.popDialogById.bind(this));
  }

  componentWillUnmount() {
    eventEmitter.removeAllListeners();
  }

  addDialogComponent = (id: string, dialogComponent: React.JSX.Element): void => {
    this.dialogComponents.push({ component: dialogComponent, id });
    this.forceUpdate();
  };

  isIdExist = (
    id: string,
    response: {
      isIdExist: boolean;
    },
  ): void => {
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
