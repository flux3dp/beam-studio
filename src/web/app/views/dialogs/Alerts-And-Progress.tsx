import ProgressConstants from '../../constants/progress-constants';
import Modal from '../../widgets/Modal';
import ButtonGroup from '../../widgets/Button-Group';
import { AlertProgressContext, AlertProgressContextProvider } from '../../contexts/Alert-Progress-Context';
import * as i18n from '../../../helpers/i18n';

const electron = requireNode('electron');
const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang;
let _contextCaller;
export interface IProgress {
    id?: string,
    type?: string,
    caption?: string,
    message? : string,
    onCancel? : Function,
    percentage? : number | string,
    timeout?: number,
}

class Progress extends React.Component {
    constructor(props) {
        super(props);
        const { progress } = this.props;
        const { timeout, timeoutCallback } = progress;
        if (timeout) {
            this.closeTimeout = setTimeout(() => {
                const { popById } = this.context;
                if (!progress.id) {
                    console.warn('Progress without ID', progress);
                } else {
                    popById(progress.id);
                }
                if (timeoutCallback) {
                    timeoutCallback();
                }
            }, timeout);
        };
    }

    componentWillUnmount() {
        clearTimeout(this.closeTimeout);
    }

    renderCaption = (caption: string) => {
        if (!caption) return null;

        return (
            <div className='caption'>{caption}</div>
        );
    }

    renderCancelButton = () => {
        const progress: IProgress = this.props.progress;
        const { onCancel, id } = progress;
        if (!onCancel) {
            return null;
        }
        const buttons = [{
            label: LANG.alert.cancel,
            className: classNames('btn-default'),
            onClick: () => {
                const { popById } = this.context;
                popById(id);
                onCancel();
            },
        }];
        return (
            <div className={'button-container'}>
                <ButtonGroup buttons={buttons}/>
            </div>
        );

    }

    renderMessage = (progress: IProgress) => {
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
                    {this.renderCaption(progress.caption)}
                    {this.renderMessage(progress)}
                    {this.renderCancelButton()}
                </div>
            </Modal>
        );
    }
}
Progress.contextType = AlertProgressContext;

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

    renderCaption = (caption: string) => {
        if (!caption) return null;

        return (
            <h2 className='caption'>{caption}</h2>
        );
    }

    renderIcon = (iconUrl: string) => {
        if (!iconUrl) return null;

        return (
            <img className='icon' src={iconUrl}/>
        )
    }

    renderMessage = (message) => {
        return typeof message === 'string' ?
            <pre ref={this.messageRef} className='message' dangerouslySetInnerHTML={{__html: message}}></pre> :
            <pre className='message'>{message}</pre>
    }

    renderCheckbox = (checkBoxText: string) => {
        if (!checkBoxText) return null;

        return (
            <div className='modal-checkbox'>
                <input type='checkbox' onClick={() => {this.setState({checkboxChecked: !this.state.checkboxChecked})}}></input>{checkBoxText}
            </div>
        );
    }

    renderChildren = (children: Element) => {
        if (!children) return null;

        return (
            <div className='alert-children'>
                {children}
            </div>
        );
    }

    render = () => {
        const { alert, popFromStack } = this.props;
        const {checkboxChecked} = this.state;
        let buttons = alert.buttons.map((b, i) => {
            const newButton = {...b};
            const buttonCallback = b.onClick;
            if (!checkboxChecked || !alert.checkboxText || !alert.checkboxCallbacks)  {
                newButton.onClick = () => {
                    popFromStack();
                    buttonCallback();
                }
            } else {
                // Need to reset checkbox state after callback
                if (typeof alert.checkboxCallbacks === 'function') {
                    newButton.onClick = () => {
                        // If only one checkbox callback passed, run checkbox callback after
                        // runing button callback
                        popFromStack();
                        buttonCallback();
                        alert.checkboxCallbacks();
                        this.setState({checkboxChecked: false});
                    }
                } else if (alert.checkboxCallbacks.length > i){
                    newButton.onClick = () => {
                        // If more than one checkbox callbacks passed,
                        // replace original checkbox callbacks.
                        popFromStack();
                        alert.checkboxCallbacks[i]();
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

        return (
            <Modal>
                <div className={classNames('modal-alert', 'animate__animated', 'animate__bounceIn')}>
                    {this.renderCaption(alert.caption)}
                    {this.renderIcon(alert.iconUrl)}
                    {this.renderMessage(alert.message)}
                    {this.renderChildren(alert.children)}
                    {this.renderCheckbox(alert.checkBoxText)}
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
    }
};

AlertsAndProgress.contextType = AlertProgressContext;

export class AlertsAndProgressContextHelper {
    static get context(): AlertProgressContextProvider {
        return _contextCaller;
    }
}
