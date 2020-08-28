define([
], function (
) {
    const React = require('react');
    const { createContext } = React;
    const DialogContext = createContext();

    class DialogContextProvider extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                dialogComponents: []
            }
        }

        addDialogComponent = (id, dialogComponent) => {
            this.state.dialogComponents.push({id, component: dialogComponent});
            this.setState(this.state);
        }

        isIdExist = (id) => {
            return this.state.dialogComponents.some((dialog) => dialog.id === id);
        }

        popDialogById = (id) => {
            this.state.dialogComponents = this.state.dialogComponents.filter((dialog) => {return dialog.id !== id});
            this.setState(this.state);
        }

        render() {
            const { dialogComponents } = this.state;
            const {
                addDialogComponent,
                isIdExist,
                popDialogById
            } = this;
            return (
                <DialogContext.Provider value={{
                    dialogComponents,
                    addDialogComponent,
                    isIdExist,
                    popDialogById
                }}>
                    {this.props.children}
                </DialogContext.Provider>
            );
        }
    };

    return {DialogContextProvider, DialogContext};
});