define([
    'jsx!widgets/Modal',
    'jsx!/contexts/DialogContext'
], function (
    Modal,
    { DialogContext }
) {
    const React = require('react');
    let ret = {};


    class Dialog extends React.Component {
        constructor(props) {
            super(props);
        }

        componentDidMount() {
            ret.DialogContextCaller = this.context;
        }

        render() {
            const { index } = this.props;
            const { dialogComponents } = this.context;
            if (index >= dialogComponents.length) {
                return null;
            }
            const { component } = dialogComponents[index];
            return (
                <div className="dialog-container">
                    {component}
                    <Dialog index={index+1}/>
                </div>
            );
        }
    };
    Dialog.contextType = DialogContext;
    ret.Dialog = Dialog;
    return ret;
});