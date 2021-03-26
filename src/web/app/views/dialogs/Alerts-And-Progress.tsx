import ProgressConstants from 'app/constants/progress-constants';
import Alert from 'app/widgets/Alert';
import ButtonGroup from 'app/widgets/Button-Group';
import Modal from 'app/widgets/Modal';
import { AlertProgressContext, AlertProgressContextProvider } from 'app/contexts/Alert-Progress-Context';
import * as i18n from 'helpers/i18n';

const classNames = requireNode('classnames');
const React = requireNode('react');
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
        const { progress } = this.props;
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
                        onClose={popFromStack}
                    />
                );
            } else {
                return (
                    <Alert
                        key={index}
                        {...alertOrProgress}
                        animationClass={classNames('animate__animated', 'animate__bounceIn')}
                        onClose={popFromStack}
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
