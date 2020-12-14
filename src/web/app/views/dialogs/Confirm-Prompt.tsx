import ButtonGroup from '../../widgets/Button-Group';
import Modal from '../../widgets/Modal';
import keyCodeConstants from '../../constants/keycode-constants';
import * as i18n from '../../../helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.alert;

class ConfirmPrompt extends React.Component {
    constructor(props) {
        super(props);
    }

    onValidate = () => {
        const { confirmValue } = this.props;
        if (!confirmValue) {
            this.onConfirmed();
        } else {
            if (confirmValue === this.refs.textInput.value) {
                this.onConfirmed();
            } else {
                this.onConfirmFailed();
            }
        }
    }

    onConfirmed = () => {
        const { onConfirmed, onClose } = this.props;
        onConfirmed();
        onClose();
    }

    onConfirmFailed = () => {
        this.refs.textInput.value = '';
        this.refs.container.classList.remove('animate__animated', 'animate__bounceIn');
        this.refs.container.offsetWidth; // some magic: https://css-tricks.com/restart-css-animation/
        this.refs.container.classList.add('animate__animated', 'animate__bounceIn');
    }

    handleKeyDown = (e) => {
        if (e.keyCode === keyCodeConstants.KEY_RETURN) {
            this.onValidate();
        }
        e.stopPropagation();
    }

    renderButtons = () => {
        const {buttons, onCancel, onClose} = this.props;
        if (buttons) {
            return <ButtonGroup className='btn-right' buttons={buttons}/>;
        }
        const defaultButtons = [
            {
                label: LANG.ok,
                className: 'btn-default primary',
                onClick: () => {
                    this.onValidate();
                }
            },
            {
                label: LANG.cancel,
                className: 'btn-default',
                onClick: () => {
                    if (onCancel) {
                        onCancel(this.refs.textInput.value);
                    }
                    onClose();
                }
            }
        ];
        return <ButtonGroup className='btn-right' buttons={defaultButtons}/>;
    };

    render() {
        return (
            <Modal>
                <div className={classNames('confirm-prompt-dialog-container', 'animate__animated', 'animate__bounceIn')} ref='container'>
                    <div className="caption">{this.props.caption}</div>
                    <pre className="message">{this.props.message}</pre>
                    <input
                        autoFocus={true}
                        ref='textInput'
                        className="text-input"
                        type='text'
                        onKeyDown={(e) => this.handleKeyDown(e)}
                        placeholder={this.props.confirmValue}
                    />
                    <div className="footer">
                        {this.renderButtons()}
                    </div>
                </div>
            </Modal>
        );
    }
};

export default ConfirmPrompt;
