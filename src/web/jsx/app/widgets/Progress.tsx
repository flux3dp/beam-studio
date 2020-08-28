define(['reactPropTypes', 'jsx!widgets/Modal', 'jsx!widgets/AlertDialog', 'app/constants/progress-constants'], function (PropTypes, Modal, AlertDialog, ProgressConstants) {
  'use strict';

  const React = require('react');

  var acceptableTypes = [ProgressConstants.WAITING, ProgressConstants.STEPPING, ProgressConstants.NONSTOP, ProgressConstants.NONSTOP_WITH_MESSAGE];

  class Progress extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        percentage: this.props.percentage
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        percentage: nextProps.percentage
      });
    }

    _getButton() {
      var buttons = [];

      switch (this.props.type) {
        case ProgressConstants.WAITING:
        case ProgressConstants.STEPPING:
          buttons.push({
            label: this.props.lang.alert.stop,
            dataAttrs: {
              'ga-event': 'stop'
            },
            onClick: this.props.onStop
          });
          break;

        case ProgressConstants.NONSTOP:
          // No button
          break;
      }

      if (false === this.props.hasStop) {
        // clear button
        buttons = [];
      }

      return buttons;
    }

    _renderMessage() {
      var message,
          progressIcon = this._renderIcon();

      switch (this.props.type) {
        case ProgressConstants.WAITING:
        case ProgressConstants.STEPPING:
          message = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, this.props.message), progressIcon);
          break;

        case ProgressConstants.NONSTOP:
        case ProgressConstants.NONSTOP_WITH_MESSAGE:
          message = progressIcon;
          break;
      }

      return message;
    }

    _renderIcon() {
      var icon,
          progressStyle = {
        width: (this.state.percentage || 0) + '%'
      };

      switch (this.props.type) {
        case ProgressConstants.WAITING:
        case ProgressConstants.NONSTOP:
        case ProgressConstants.NONSTOP_WITH_MESSAGE:
          icon = /*#__PURE__*/React.createElement("div", {
            className: "spinner-roller spinner-roller-reverse"
          });
          break;

        case ProgressConstants.STEPPING:
          icon = /*#__PURE__*/React.createElement("div", {
            className: "progress-bar",
            "data-percentage": this.props.percentage
          }, /*#__PURE__*/React.createElement("div", {
            className: "current-progress",
            style: progressStyle
          }));
          break;
      }

      return icon;
    }

    render() {
      if (false === this.props.isOpen) {
        return /*#__PURE__*/React.createElement("div", null);
      }

      var buttons = this._getButton(),
          progressIcon = this._renderIcon(),
          message = this._renderMessage(),
          content = /*#__PURE__*/React.createElement(AlertDialog, {
        lang: this.props.lang,
        caption: this.props.caption,
        message: message,
        buttons: buttons
      }),
          className = {
        'shadow-modal': true,
        'waiting': ProgressConstants.WAITING === this.props.type,
        'modal-progress': true,
        'modal-progress-nonstop': ProgressConstants.NONSTOP === this.props.type,
        'modal-progress-nonstop-with-message': ProgressConstants.NONSTOP_WITH_MESSAGE === this.props.type
      };

      return /*#__PURE__*/React.createElement(Modal, {
        className: className,
        content: content,
        disabledEscapeOnBackground: false
      });
    }

  }

  Progress.propTypes = {
    type: PropTypes.oneOf(acceptableTypes),
    isOpen: PropTypes.bool,
    lang: PropTypes.object,
    caption: PropTypes.string,
    message: PropTypes.string,
    percentage: PropTypes.number,
    hasStop: PropTypes.bool,
    onStop: PropTypes.func,
    onFinished: PropTypes.func
  };
  Progress.defaultProps = {
    lang: {},
    isOpen: true,
    caption: '',
    message: '',
    type: ProgressConstants.WAITING,
    percentage: 0,
    hasStop: true,
    onStop: function () {},
    onFinished: function () {}
  };
  return Progress;
});