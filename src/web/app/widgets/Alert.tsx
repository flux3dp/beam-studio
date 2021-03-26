import ButtonGroup from 'app/widgets/Button-Group';
import Modal from 'app/widgets/Modal';

const classNames = requireNode('classnames');
const electron = requireNode('electron');
const React = requireNode('react');

class Alert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            checkboxChecked: false
        }
        this.messageRef = React.createRef();
    }

    componentDidMount() {
        const message = this.messageRef.current as Element;
        if (message) {
            const aElements = message.querySelectorAll('a');
            for (let i = 0; i < aElements.length; i++) {
                const a = aElements[i];
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    electron.remote.shell.openExternal(a.getAttribute('href'));
                })
            }
        }
    }

    renderCaption = () => {
        const { caption } = this.props;
        if (!caption) return null;

        return (
            <h2 className='caption'>{caption}</h2>
        );
    }

    renderIcon = () => {
        const { iconUrl } = this.props;
        if (!iconUrl) return null;

        return (
            <img className='icon' src={iconUrl}/>
        )
    }

    renderMessage = () => {
        const { message } = this.props;
        return typeof message === 'string' ?
            <pre ref={this.messageRef} className='message' dangerouslySetInnerHTML={{__html: message}}></pre> :
            <pre className='message'>{message}</pre>
    }

    renderCheckbox = () => {
        const { checkboxText } = this.props;
        if (!checkboxText) return null;

        return (
            <div className='modal-checkbox'>
                <input type='checkbox' onClick={() => {this.setState({checkboxChecked: !this.state.checkboxChecked})}}></input>{checkboxText}
            </div>
        );
    }

    renderChildren = () => {
        const { children } = this.props;
        if (!children) return null;

        return (
            <div className='alert-children'>
                {children}
            </div>
        );
    }

    render = () => {
        const { checkboxText, checkboxCallbacks, onClose, animationClass } = this.props;
        let { buttons } = this.props;
        const {checkboxChecked} = this.state;
        buttons = buttons.map((b, i) => {
            const newButton = {...b};
            const buttonCallback = b.onClick;
            if (!checkboxChecked || !checkboxText || !checkboxCallbacks)  {
                newButton.onClick = () => {
                    if (onClose) onClose();
                    buttonCallback();
                }
            } else {
                // Need to reset checkbox state after callback
                if (typeof checkboxCallbacks === 'function') {
                    newButton.onClick = () => {
                        // If only one checkbox callback passed, run checkbox callback after
                        // runing button callback
                        if (onClose) onClose();
                        buttonCallback();
                        checkboxCallbacks();
                        this.setState({checkboxChecked: false});
                    }
                } else if (checkboxCallbacks.length > i){
                    newButton.onClick = () => {
                        // If more than one checkbox callbacks passed,
                        // replace original checkbox callbacks.
                        if (onClose) onClose();
                        checkboxCallbacks[i]();
                        this.setState({checkboxChecked: false});
                    }
                } else {
                    newButton.onClick = () => {
                        if (onClose) onClose();
                        buttonCallback();
                        this.setState({checkboxChecked: false});
                    };
                }
            }
            return newButton;
        });

        return (
            <Modal>
                <div className={classNames('modal-alert', animationClass)}>
                    {this.renderCaption()}
                    {this.renderIcon()}
                    {this.renderMessage()}
                    {this.renderChildren()}
                    {this.renderCheckbox()}
                    <ButtonGroup buttons={buttons}/>
                </div>
            </Modal>
        );
    }
}

export default Alert;
