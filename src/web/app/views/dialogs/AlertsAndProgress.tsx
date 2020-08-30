import ProgressConstants from '../../constants/progress-constants'
import Modal from '../../widgets/Modal'
import ButtonGroup from '../../widgets/Button-Group'
import { AlertProgressContext } from '../../contexts/AlertProgressContext'

const React = requireNode('react');;
const classNames = requireNode('classnames');
let _contextCaller;

    class ContextHelper {
        static get _contextCaller() {
            return _contextCaller;
        }
    }
    
    export const AlertsAndProgressContextCaller = ContextHelper._contextCaller;

class Progress extends React.Component {
    constructor(props) {
        super(props);
    }

    _renderCaption = (caption) => {
        return caption ? (
            <div className="caption">{caption}</div>
        ) : null;
    }

    _renderMessage = (progress) => {
        let content;
        if (progress.type === ProgressConstants.NONSTOP) {
            content = <div className={classNames('spinner-roller spinner-roller-reverse')}/>
        } else if (progress.type === ProgressConstants.STEPPING) {
            const progressStyle = {
                width: (progress.percentage || 0) + '%'
            };
            content = (
                <div className='stepping-container'>
                    <div className='progress-message'>{progress.message}</div>
                    <div className='progress-bar'>
                        <div className='current-progress' style={progressStyle}/>
                    </div>
                </div>
            );
        }
        return (
            <pre className='message'>
                {content}
            </pre>
        );
    }

    render() {
        const { progress, popFromStack } = this.props;
        return (
            <Modal>
                <div className={classNames('modal-alert', 'progress')}>
                    {this._renderCaption(progress.caption)}
                    {this._renderMessage(progress)}
                </div>
            </Modal>
        );
    }
}

class Alert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            checkboxChecked: false
        }
    }

    _renderCaption = (caption) => {
        return caption ? (
            <h2 className="caption">{caption}</h2>
        ) : null;
    }

    _renderMessage = (alert) => {
        return typeof alert.message === 'string' ?
                    <pre className="message" dangerouslySetInnerHTML={{__html: alert.message}}></pre> :
                    <pre className="message">{alert.message}</pre>
    }

    _renderCheckbox = (checkBoxText) => {
        let _handleCheckboxClick = () => {
            this.setState({checkboxChecked: !this.state.checkboxChecked});
        };

        return (
            <div className="modal-checkbox">
                <input type="checkbox" onClick={_handleCheckboxClick}></input>{checkBoxText}
            </div>
        );
    }

    render = () => {
        const { alert, popFromStack } = this.props;
        const {checkboxChecked} = this.state;
        let buttons = alert.buttons.map((b, i) => {
            const newButton = {...b};
            const buttonCallback = b.onClick;
            if (!checkboxChecked || !alert.checkBoxText || !alert.checkBoxCallbacks)  {
                newButton.onClick = () => {
                    popFromStack();
                    buttonCallback();
                }
            } else {
                // Need to reset checkbox state after callback
                if (typeof alert.checkBoxCallbacks === 'function') {
                    newButton.onClick = () => {
                        popFromStack();
                        alert.checkBoxCallbacks();
                        this.setState({checkboxChecked: false});
                    }
                } else if (alert.checkBoxCallbacks.length > i){
                    newButton.onClick = () => {
                        popFromStack();
                        alert.checkBoxCallbacks[i]();
                        this.setState({checkboxChecked: false});
                    }
                } else {
                    newButton.onClick = () => {
                        popFromStack();
                        buttonCallback();
                        this.setState({checkboxChecked: false});
                    };
                }
            }
            return newButton;
        });

        let checkBox = alert.checkBoxText ? this._renderCheckbox(alert.checkBoxText) : null;

        return (
            <Modal>
                <div className={classNames('modal-alert', 'animate__animated', 'animate__bounceIn')}>
                    {this._renderCaption(alert.caption)}
                    {this._renderMessage(alert)}
                    {checkBox}
                    <ButtonGroup buttons={buttons}/>
                </div>
            </Modal>
        );
    }
}

export class AlertsAndProgress extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            checkboxChecked: false
        }
    };

    componentDidMount() {
        _contextCaller = this.context;
    }

    render() {
        const { alertProgressStack, popFromStack } = this.context;
        const components = alertProgressStack.map((alertOrProgress, index) => {
            if (alertOrProgress.isProgrss) {
                return (
                    <Progress
                        key={index}
                        progress={alertOrProgress}
                        popFromStack={popFromStack}
                    />
                );
            } else {
                return (
                    <Alert
                        key={index}
                        alert={alertOrProgress}
                        popFromStack={popFromStack}
                    />
                );
            }
        })
        
        return (
            <div className='alerts-container'>
                {components}
            </div>
        );
        ;
    }
};

AlertsAndProgress.contextType = AlertProgressContext;