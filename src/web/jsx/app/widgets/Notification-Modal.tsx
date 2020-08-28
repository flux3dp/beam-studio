function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'helpers/shortcuts', 'app/constants/alert-constants', 'jsx!widgets/Modal', 'jsx!widgets/AlertDialog'], function ($, PropTypes, shortcuts, AlertConstants, Modal, AlertDialog) {
  'use strict';

  const React = require('react');

  var lang,
      acceptableTypes = [AlertConstants.INFO, AlertConstants.WARNING, AlertConstants.WARNING_WITH_CHECKBOX, AlertConstants.ERROR, AlertConstants.YES_NO, AlertConstants.RETRY_CANCEL, AlertConstants.RETRY_ABORT_CANCEL, AlertConstants.CUSTOM_CANCEL];

  class NotificationModal extends React.Component {
    constructor(...args) {
      super(...args);

      _defineProperty(this, "_onClose", (e, reactid, from) => {
        this.props.onClose.apply(null, [e, reactid, from]);
      });

      _defineProperty(this, "_onYes", (e, reactid) => {
        this.props.onYes(e);

        this._onClose.apply(null, [e, reactid, 'yes']);
      });

      _defineProperty(this, "_onNo", (e, reactid) => {
        this.props.onNo(e);

        this._onClose.apply(null, [e, reactid, 'no']);
      });

      _defineProperty(this, "_onRetry", (e, reactid) => {
        this.props.onRetry(e);

        this._onClose.apply(null, [e, reactid, 'retry']);
      });

      _defineProperty(this, "_onAbort", (e, reactid) => {
        this.props.onAbort(e);

        this._onClose.apply(null, [e, reactid, 'abort']);
      });

      _defineProperty(this, "_onCustom", (e, reactid) => {
        this.props.onCustom(e);

        this._onClose.apply(null, [e, reactid, 'custom']);
      });

      _defineProperty(this, "_onCustomGroup", idx => {
        this.props.onClose();
        this.props.onCustomGroup[idx]();
      });

      _defineProperty(this, "_getTypeTitle", () => {
        var types = {};
        types[AlertConstants.INFO] = lang.info;
        types[AlertConstants.WARNING] = lang.warning;
        types[AlertConstants.WARNING_WITH_CHECKBOX] = lang.warning;
        types[AlertConstants.ERROR] = lang.error;
        types[AlertConstants.RETRY_CANCEL] = lang.error;
        types[AlertConstants.RETRY_ABORT_CANCEL] = lang.error;
        types[AlertConstants.CUSTOM_CANCEL] = lang.error;
        return this.props.caption || types[this.props.type] || '';
      });

      _defineProperty(this, "_getCloseButtonCaption", () => {
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
      });

      _defineProperty(this, "_getButtons", () => {
        var buttons = [];

        var onclose_bind_with_on_no = function () {
          if (this._onNo) {
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
            this.props.customTextGroup.forEach(function (customText, idx) {
              buttons.push({
                className: 'primary btn-default',
                label: customText,
                dataAttrs: {
                  'ga-enent': customText
                },
                onClick: () => {
                  self._onCustomGroup(idx);
                }
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
      });

      _defineProperty(this, "_getCheckbox", () => {
        if (this.props.type === AlertConstants.WARNING_WITH_CHECKBOX) {
          return this.props.customText;
        }

        return null;
      });
    }

    UNSAFE_componentWillMount() {
      lang = this.props.lang.alert;
    }

    componentDidMount() {
      var self = this;
      shortcuts.on(['esc'], function (e) {
        self.props.onClose(e);
      });
    }

    componentWillUnmount() {
      shortcuts.off(['esc']);
    } // button actions


    render() {
      if (!this.props.open) {
        return /*#__PURE__*/React.createElement("div", null);
      }

      var typeTitle = this._getTypeTitle(),
          buttons = this._getButtons(),
          checkbox = this._getCheckbox(),
          content = /*#__PURE__*/React.createElement(AlertDialog, {
        lang: lang,
        caption: typeTitle,
        message: this.props.message,
        checkbox: checkbox,
        checkedCallback: this.props.checkedCallback,
        buttons: buttons,
        imgClass: this.props.imgClass,
        images: this.props.images,
        displayImages: this.props.displayImages,
        onCustom: this._onCustom,
        onClose: this.props.onClose
      }),
          className = {
        'shadow-modal': true
      };

      return /*#__PURE__*/React.createElement(Modal, {
        className: className,
        content: content,
        disabledEscapeOnBackground: this.props.escapable
      });
    }

  }

  ;
  NotificationModal.propTypes = {
    open: PropTypes.bool,
    lang: PropTypes.object,
    type: PropTypes.oneOf(acceptableTypes),
    customText: PropTypes.string,
    customTextGroup: PropTypes.array,
    escapable: PropTypes.bool,
    caption: PropTypes.string,
    message: PropTypes.string,
    onRetry: PropTypes.func,
    onAbort: PropTypes.func,
    onYes: PropTypes.func,
    onNo: PropTypes.func,
    onCustom: PropTypes.func,
    onClose: PropTypes.func,
    displayImages: PropTypes.bool,
    images: PropTypes.array
  };
  NotificationModal.defaultProps = {
    type: AlertConstants.INFO,
    escapable: false,
    open: true,
    caption: '',
    message: '',
    onRetry: function () {},
    onAbort: function () {},
    onYes: function () {},
    onNo: function () {},
    onCustom: function () {},
    onClose: function () {},
    onCustomGroup: [],
    displayImages: false,
    images: []
  };
  return NotificationModal;
});