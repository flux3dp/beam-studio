import Modal from '../../widgets/Modal';
import { DialogContext, DialogContextProvider } from '../../contexts/Dialog-Context';

const React = requireNode('react');
let _contextCaller;

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

export class DialogContextHelper {
    static get context(): DialogContextProvider {
        return _contextCaller;
    }
}
