define([
    'jsx!widgets/Button-Group',
    'jsx!widgets/Modal',
    'app/constants/keycode-constants',
    'helpers/i18n'
], function (
    ButtonGroup,
    Modal,
    keyCodeConstants,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const LANG = i18n.lang.alert;

    class Prompt extends React.Component {
        constructor(props) {
            super(props);
        }

        componentDidMount() {
        }

        handleKeyDown = (e) => {
            const {onYes, onClose} = this.props;
            if (e.keyCode === keyCodeConstants.KEY_RETURN) {
                if (onYes) {
                    onYes(this.refs.textInput.value);
                }
                onClose();
            }
            e.stopPropagation();
        }

        renderButtons = () => {
            const {buttons, onYes, onCancel, onClose} = this.props;
            if (buttons) {
                return <ButtonGroup className='btn-right' buttons={buttons}/>;;
            }
            const defaultButtons = [
                {
                    label: LANG.ok2,
                    className: 'btn-default primary',
                    onClick: () => {
                        if (onYes) {
                            onYes(this.refs.textInput.value);
                        }
                        onClose();
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
                <Modal
                    onClose={this.props.closeOnBackgroundClick ? this.props.onClose : () => {}}
                >
                    <div className={classNames('prompt-dialog-container', 'animate__animated', 'animate__bounceIn')}>
                        <div className="caption">{this.props.caption}</div>
                        <input
                            autoFocus={true}
                            ref='textInput'
                            className="text-input"
                            type='text'
                            onKeyDown={(e) => this.handleKeyDown(e)}
                            defaultValue={this.props.defaultValue}
                        />
                        <div className="footer">
                            {this.renderButtons()}
                        </div>
                    </div>
                </Modal>
            );
        }
    };

    return Prompt;
});