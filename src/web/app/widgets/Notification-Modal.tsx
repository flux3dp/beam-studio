import $ from 'jquery';
import shortcuts from '../../helpers/shortcuts';
import AlertConstants from '../constants/alert-constants';
import Modal from './Modal';
import AlertDialog from './AlertDialog';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');

var lang,
    acceptableTypes = [
        AlertConstants.INFO,
        AlertConstants.WARNING,
        AlertConstants.WARNING_WITH_CHECKBOX,
        AlertConstants.ERROR,
        AlertConstants.YES_NO,
        AlertConstants.RETRY_CANCEL,
        AlertConstants.RETRY_ABORT_CANCEL,
        AlertConstants.CUSTOM_CANCEL
    ];

class NotificationModal extends React.Component {

    UNSAFE_componentWillMount() {
        lang = this.props.lang.alert;
    }

    componentDidMount() {
        var self = this;
        shortcuts.on(['esc'], function(e) {
            self.props.onClose(e);
        });
    }

    componentWillUnmount() {
        shortcuts.off(['esc']);
    }

    // button actions
    _onClose = (e, reactid, from) => {
        this.props.onClose.apply(null, [e, reactid, from]);
    }

    _onYes = (e, reactid) => {
        this.props.onYes(e);
        this._onClose.apply(null, [e, reactid, 'yes']);
    }

    _onNo = (e, reactid) => {
        this.props.onNo(e);
        this._onClose.apply(null, [e, reactid, 'no']);
    }

    _onRetry = (e, reactid) => {
        this.props.onRetry(e);
        this._onClose.apply(null, [e, reactid, 'retry']);
    }

    _onAbort = (e, reactid) => {
        this.props.onAbort(e);
        this._onClose.apply(null, [e, reactid, 'abort']);
    }

    _onCustom = (e, reactid) => {
        this.props.onCustom(e);
        this._onClose.apply(null, [e, reactid, 'custom']);
    }
    _onCustomGroup = (idx) => {
        this.props.onClose();
        this.props.onCustomGroup[idx]();
    }

    _getTypeTitle = () => {
        var types = {};
        types[AlertConstants.INFO]                  = lang.info;
        types[AlertConstants.WARNING]               = lang.warning;
        types[AlertConstants.WARNING_WITH_CHECKBOX] = lang.warning;
        types[AlertConstants.ERROR]                 = lang.error;
        types[AlertConstants.RETRY_CANCEL]          = lang.error;
        types[AlertConstants.RETRY_ABORT_CANCEL]    = lang.error;
        types[AlertConstants.CUSTOM_CANCEL]         = lang.error;

        return this.props.caption || types[this.props.type] || '';
    }

    _getCloseButtonCaption = () => {
        var caption = lang.cancel;

        switch (this.props.type) {
        case AlertConstants.YES_NO:
            caption = lang.no;
            break;
        case AlertConstants.INFO:
        case AlertConstants.WARNING:
        case AlertConstants.WARNING_WITH_CHECKBOX:
        case AlertConstants.ERROR:
            caption = lang.ok;
            break;
        case AlertConstants.CUSTOM_CANCEL:
            caption = lang.close;
            break;
        case AlertConstants.FINISH:
            caption = lang.finish;
            break;
        }

        return caption;
    }

    _getButtons = () => {
        var buttons = [];
        var onclose_bind_with_on_no = function() {
            if(this._onNo){
                this._onNo();
            }
            this.props.onClose();
        };
        if (this.props.type !== AlertConstants.CUSTOM_GROUP) {
            buttons.push({
                className: 'primary btn-default',
                label: this._getCloseButtonCaption(),
                onClick: onclose_bind_with_on_no.bind(this)
            });
        }

        switch (this.props.type) {
        case AlertConstants.YES_NO:
            buttons.push({
                className: 'primary btn-default',
                label: lang.yes,
                dataAttrs: {
                    'ga-event': 'yes'
                },
                onClick: this._onYes
            });
            break;
        case AlertConstants.RETRY_CANCEL:
            buttons.push({
                className: 'primary btn-default',
                label: lang.retry,
                dataAttrs: {
                    'ga-event': 'cancel'
                },
                onClick: this._onRetry
            });
            break;
        case AlertConstants.RETRY_ABORT_CANCEL:
            buttons.push({
                label: lang.abort,
                dataAttrs: {
                    'ga-event': 'abort'
                },
                onClick: this._onAbort
            });
            buttons.push({
                className: 'primary btn-default',
                label: lang.retry,
                dataAttrs: {
                    'ga-event': 'retry'
                },
                onClick: this._onRetry
            });
            break;
        case AlertConstants.CUSTOM:
            buttons = [{
                label: this.props.customText,
                dataAttrs: {
                    'ga-event': 'cancel'
                },
                onClick: this._onCustom
            }];
            break;

        case AlertConstants.CUSTOM_GROUP:
            var self = this;
            this.props.customTextGroup.forEach(function(customText, idx) {
                buttons.push({
                    className: 'primary btn-default',
                    label: customText,
                    dataAttrs: {
                    'ga-enent': customText
                    },
                    onClick: () => { self._onCustomGroup(idx) }
                });
            });
            break;

        case AlertConstants.CUSTOM_CANCEL:
            buttons.push({
                label: this.props.customText,
                dataAttrs: {
                    'ga-event': 'cancel'
                },
                onClick: this._onCustom
            });
            break;
        }

        return buttons;
    }

    _getCheckbox = () => {
        if (this.props.type === AlertConstants.WARNING_WITH_CHECKBOX) {
            return this.props.customText;
        }
        return null;
    }

    render() {
        if(!this.props.open) {
            return (<div/>);
        }
        var typeTitle = this._getTypeTitle(),
            buttons = this._getButtons(),
            checkbox = this._getCheckbox(),
            content = (
                <AlertDialog
                    lang={lang}
                    caption={typeTitle}
                    message={this.props.message}
                    checkbox={checkbox}
                    checkedCallback={this.props.checkedCallback}
                    buttons={buttons}
                    imgClass={this.props.imgClass}
                    images={this.props.images}
                    displayImages={this.props.displayImages}
                    onCustom={this._onCustom}
                    onClose={this.props.onClose}
                />
            ),
            className = {
                'shadow-modal': true
            };

        return (
            <Modal className={className} content={content} disabledEscapeOnBackground={this.props.escapable}/>
        );
    }

};

NotificationModal.propTypes = {
    open        : PropTypes.bool,
    lang        : PropTypes.object,
    type        : PropTypes.oneOf(acceptableTypes),
    customText  : PropTypes.string,
    customTextGroup : PropTypes.array,
    escapable   : PropTypes.bool,
    caption     : PropTypes.string,
    message     : PropTypes.string,
    onRetry     : PropTypes.func,
    onAbort     : PropTypes.func,
    onYes       : PropTypes.func,
    onNo        : PropTypes.func,
    onCustom    : PropTypes.func,
    onClose     : PropTypes.func,
    displayImages   : PropTypes.bool,
    images   : PropTypes.array
};

NotificationModal.defaultProps = {
    type      : AlertConstants.INFO,
    escapable : false,
    open      : true,
    caption   : '',
    message   : '',
    onRetry   : function() {},
    onAbort   : function() {},
    onYes     : function() {},
    onNo      : function() {},
    onCustom  : function() {},
    onClose   : function() {},
    onCustomGroup: [],
    displayImages: false,
    images: []
};

export default NotificationModal;
