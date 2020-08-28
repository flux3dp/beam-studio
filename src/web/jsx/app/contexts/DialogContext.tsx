function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define([], function () {
  const React = require('react');

  const {
    createContext
  } = React;
  const DialogContext = createContext();

  class DialogContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "addDialogComponent", (id, dialogComponent) => {
        this.state.dialogComponents.push({
          id,
          component: dialogComponent
        });
        this.setState(this.state);
      });

      _defineProperty(this, "isIdExist", id => {
        return this.state.dialogComponents.some(dialog => dialog.id === id);
      });

      _defineProperty(this, "popDialogById", id => {
        this.state.dialogComponents = this.state.dialogComponents.filter(dialog => {
          return dialog.id !== id;
        });
        this.setState(this.state);
      });

      this.state = {
        dialogComponents: []
      };
    }

    render() {
      const {
        dialogComponents
      } = this.state;
      const {
        addDialogComponent,
        isIdExist,
        popDialogById
      } = this;
      return /*#__PURE__*/React.createElement(DialogContext.Provider, {
        value: {
          dialogComponents,
          addDialogComponent,
          isIdExist,
          popDialogById
        }
      }, this.props.children);
    }

  }

  ;
  return {
    DialogContextProvider,
    DialogContext
  };
});