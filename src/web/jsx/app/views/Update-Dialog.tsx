function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'jsx!widgets/Button-Group', 'helpers/api/config', 'helpers/sprintf', 'helpers/i18n', 'helpers/device-master'], function (Modal, ButtonGroup, config, sprintf, i18n, DeviceMaster) {
  const React = require('react');

  class UpdateDialog extends React.Component {
    constructor(...args) {
      super(...args);

      _defineProperty(this, "_onSkip", () => {
        var key = this.props.type + '-update-ignore-list',
            ignoreList = config().read(key) || [];
        ignoreList.push(this.props.latestVersion); // save skip version and close

        config().write(key, ignoreList);

        this._onClose();
      });

      _defineProperty(this, "_onDownload", () => {
        console.log('onDownload this.props', this.props);
        this.props.onDownload();

        this._onClose();
      });

      _defineProperty(this, "_onClose", quit => {
        if ('toolhead' === this.props.type && true === quit) {
          DeviceMaster.quitTask();
        }

        this.props.onClose();
      });

      _defineProperty(this, "_onInstall", () => {
        this.props.onInstall();

        this._onClose();
      });

      _defineProperty(this, "_getButtons", lang => {
        var buttons,
            laterButton = {
          label: lang.update.later,
          dataAttrs: {
            'ga-event': 'update-' + this.props.type.toLowerCase() + '-later'
          },
          onClick: this._onClose.bind(this, true)
        },
            downloadButton = {
          label: lang.update.download,
          dataAttrs: {
            'ga-event': 'download-' + this.props.type.toLowerCase() + '-later'
          },
          onClick: () => {
            this._onDownload();
          }
        },
            installButton = {
          label: 'software' === this.props.type ? lang.update.install : lang.update.upload,
          dataAttrs: {
            'ga-event': 'install-new-' + this.props.type.toLowerCase()
          },
          onClick: () => {
            this._onInstall();
          }
        };
        buttons = this.props.type === 'software' ? [laterButton, installButton] : [laterButton, downloadButton, installButton];
        return buttons;
      });

      _defineProperty(this, "_getReleaseNote", () => {
        return {
          __html: this.props.releaseNote
        };
      });
    }

    render() {
      if (false === this.props.open) {
        return /*#__PURE__*/React.createElement("div", null);
      }

      var lang = i18n.get(),
          caption = lang.update[this.props.type].caption,
          deviceModel = this.props.device.model,
          message1 = sprintf(lang.update[this.props.type].message_pattern_1, this.props.device.name),
          message2 = sprintf(lang.update[this.props.type].message_pattern_2, deviceModel, this.props.latestVersion, this.props.currentVersion),
          buttons = this._getButtons(lang),
          skipButton = 'software' === this.props.type ? /*#__PURE__*/React.createElement("button", {
        className: "btn btn-link",
        "data-ga-event": 'skip-' + this.props.type.toLowerCase() + '-update',
        onClick: this._onSkip
      }, lang.update.skip) : '',
          content = /*#__PURE__*/React.createElement("div", {
        className: "update-wrapper"
      }, /*#__PURE__*/React.createElement("h2", {
        className: "caption"
      }, caption), /*#__PURE__*/React.createElement("article", {
        className: "update-brief"
      }, /*#__PURE__*/React.createElement("p", null, message1), /*#__PURE__*/React.createElement("p", null, message2)), /*#__PURE__*/React.createElement("h4", {
        className: "release-note-caption"
      }, lang.update.release_note), /*#__PURE__*/React.createElement("div", {
        className: "release-note-content",
        dangerouslySetInnerHTML: this._getReleaseNote()
      }), /*#__PURE__*/React.createElement("div", {
        className: "action-button"
      }, skipButton, /*#__PURE__*/React.createElement(ButtonGroup, {
        buttons: buttons
      }))),
          className = {
        'modal-update': true,
        'shadow-modal': true
      };

      return /*#__PURE__*/React.createElement(Modal, {
        ref: "modal",
        className: className,
        content: content
      });
    }

  }

  ;
  UpdateDialog.defaultProps = {
    open: false,
    type: 'software',
    // software|firmware|toolhead
    device: {},
    currentVersion: '',
    latestVersion: '',
    releaseNote: '',
    updateFile: undefined,
    onDownload: function () {},
    onClose: function () {},
    onInstall: function () {}
  };
  return UpdateDialog;
});