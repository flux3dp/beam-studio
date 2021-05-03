const React = requireNode('react');
const PropTypes = requireNode('prop-types');
const { createContext } = React;
export const DialogContext = createContext();

export class DialogContextProvider extends React.Component {
  constructor() {
    super();
    this.dialogComponents = [];
  }

  addDialogComponent = (id: string, dialogComponent: Element): void => {
    this.dialogComponents.push({ id, component: dialogComponent });
    this.forceUpdate();
  };

  isIdExist = (id: string): boolean => this.dialogComponents.some((dialog) => dialog.id === id);

  popDialogById = (id: string): void => {
    this.dialogComponents = this.dialogComponents.filter((dialog) => dialog.id !== id);
    this.forceUpdate();
  };

  clearAllDialogComponents = (): void => {
    this.dialogComponents = [];
    this.forceUpdate();
  };

  render(): Element {
    const { children } = this.props;
    const {
      dialogComponents,
      addDialogComponent,
      clearAllDialogComponents,
      isIdExist,
      popDialogById,
    } = this;

    return (
      <DialogContext.Provider
        value={{
          dialogComponents,
          addDialogComponent,
          clearAllDialogComponents,
          isIdExist,
          popDialogById,
        }}
      >
        {children}
      </DialogContext.Provider>
    );
  }
}

DialogContextProvider.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),
};

DialogContextProvider.defaultProps = {
  children: [],
};
