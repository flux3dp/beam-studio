import * as i18n from '../../helpers/i18n';
import Constants from '../constants/input-lightbox-constants';
import Modal from './Modal';
import AlertDialog from './AlertDialog';

const React = requireNode('react');
const classNames = requireNode('classnames');
const PropTypes = requireNode('prop-types');

var acceptableTypes = [
    Constants.TYPE_TEXT,
    Constants.TYPE_NUMBER,
    Constants.TYPE_PASSWORD,
    Constants.TYPE_FILE
];

class InputLightBox extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            allowSubmit: false
        };
    }

    // button actions
    onClose = (e, from: string) => {
        e.preventDefault();
        this.props.onClose(from);
    }

    onCancel = (e, reactid) => {
        e.preventDefault();
        this.onClose(e, 'cancel');
    }

    onSubmit = (e, reactid) => {
        e.preventDefault();

        var returnValue,
            result;

        if (Constants.TYPE_FILE === this.props.type) {
            returnValue = this.refs.inputField.files;
        }
        else {
            returnValue = this.refs.inputField.value;
        }

        result = this.props.onSubmit(returnValue, e);

        this.onClose(e, 'submit');
    }

    handleKeyDown = (e: KeyboardEvent) => {
        e.stopPropagation();
    }

    inputKeyUp = (e) => {
        var targetFiles = e.currentTarget.files || {};
        this.setState({
            allowSubmit: (
                0 < e.currentTarget.value.length ||
                0 < (targetFiles.length || 0)
            )
        });
    }

    _getButtons = (lang) => {
        var buttons = [];

        buttons.push({
            label: lang.alert.cancel,
            dataAttrs: {
                'ga-event': 'cancel'
            },
            onClick: this.onCancel
        });

        buttons.push({
            label: this.props.confirmText || lang.alert.confirm,
            className: classNames('primary', {
                'btn-default': true,
                'btn-disabled': false === this.state.allowSubmit,
            }),
            dataAttrs: {
                'ga-event': 'confirm'
            },
            onClick: this.onSubmit
        });

        return buttons;
    }

    _getMessage = () => {
        var typeMap = {},
            type = 'text',
            inputHeader = (
                '' !== this.props.inputHeader ?
                <span className="inputHeader">{this.props.inputHeader}</span> :
                ''
            );

        typeMap[Constants.TYPE_TEXT]     = 'text';
        typeMap[Constants.TYPE_NUMBER]   = 'number';
        typeMap[Constants.TYPE_PASSWORD] = 'password';
        typeMap[Constants.TYPE_FILE]     = 'file';

        if ('string' === typeof typeMap[this.props.type]) {
            type = typeMap[this.props.type];
        }

        return (
            <label className="control">
                {inputHeader}
                <input
                    type={type}
                    ref="inputField"
                    defaultValue={this.props.defaultValue}
                    autoFocus={true}
                    onKeyDown={(e: KeyboardEvent) => this.handleKeyDown(e)}
                    onKeyUp={this.inputKeyUp}
                    onChange={this.inputKeyUp}
                    maxLength={this.props.maxLength}
                />
            </label>
        );
    }

    render() {
        if(false === this.props.isOpen) {
            return (<div/>);
        }

        var lang = this.props.lang,
            buttons = this._getButtons(lang),
            message = this._getMessage(),
            content = (
                <form className="form" onSubmit={this.onSubmit}>
                    <AlertDialog
                        lang={lang}
                        caption={this.props.caption}
                        message={message}
                        buttons={buttons}
                    />
                </form>
            ),
            className = {
                'shadow-modal': true,
                'modal-input-lightbox': true
            };

        return (
            <Modal className={className} content={content} disabledEscapeOnBackground={false}/>
        );
    }
};

InputLightBox.propTypes = {
    isOpen       : PropTypes.bool,
    lang         : PropTypes.object,
    type         : PropTypes.oneOf(acceptableTypes),
    maxLength    : PropTypes.number,
    inputHeader  : PropTypes.string,
    defaultValue : PropTypes.string,
    confirmText  : PropTypes.string,
    onCustom     : PropTypes.func,
    onClose      : PropTypes.func
};

InputLightBox.defaultProps = {
    isOpen       : true,
    lang         : i18n.lang,
    type         : Constants.TYPE_TEXT,
    maxLength    : 255,
    inputHeader  : '',
    defaultValue : '',
    confirmText  : '',
    caption      : '',
    onClose      : function() {},
    onSubmit     : function() {}
};

export default InputLightBox;
