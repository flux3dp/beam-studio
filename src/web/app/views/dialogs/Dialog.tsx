import Modal from '../../widgets/Modal'
import { DialogContext } from '../../contexts/DialogContext'

    const React = requireNode('react');;
    let _contextCaller;

    class ContextHelper {
        static get _contextCaller() {
            return _contextCaller;
        }
    }
    
    export const DialogContextCaller = ContextHelper._contextCaller;


    export class Dialog extends React.Component {
        constructor(props) {
            super(props);
        }

        componentDidMount() {
            _contextCaller = this.context;
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