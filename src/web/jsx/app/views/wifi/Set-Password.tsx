function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'helpers/i18n'], function ($, PropTypes, i18n, localStorage) {
  'use strict';

  var _class, _temp;

  const React = require('react');

  return _temp = _class = class SetPassword extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleJoin", () => {
        this.setState({
          connecting: true
        });
        this.props.onJoin();
      });

      _defineProperty(this, "_handleBack", () => {
        this.props.onBack();
      });

      _defineProperty(this, "_renderActions", lang => {
        return this.state.connecting ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
          className: "loading",
          src: "img/ring.svg"
        })), /*#__PURE__*/React.createElement("div", null, lang.wifi.set_password.connecting)) : /*#__PURE__*/React.createElement("div", {
          className: "btn-h-group"
        }, /*#__PURE__*/React.createElement("a", {
          id: "btn-cancel",
          className: "btn",
          onClick: this._handleBack
        }, lang.wifi.set_password.back), /*#__PURE__*/React.createElement("a", {
          id: "btn-join",
          className: "btn",
          onClick: this._handleJoin
        }, lang.wifi.set_password.join));
      });

      this.state = {
        connecting: false
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      console.log(nextProps);
    }

    render() {
      var lang = this.props.lang,
          actions = this._renderActions(lang);

      return /*#__PURE__*/React.createElement("div", {
        className: "wifi text-center"
      }, /*#__PURE__*/React.createElement("img", {
        className: "wifi-symbol",
        src: "img/img-wifi-lock.png"
      }), /*#__PURE__*/React.createElement("div", {
        className: "wifi-form"
      }, /*#__PURE__*/React.createElement("h2", null, lang.wifi.set_password.line1, this.props.wifiName, lang.wifi.set_password.line2), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
        ref: "password",
        type: "password",
        id: "text-password",
        placeholder: lang.wifi.set_password.password_placeholder,
        defaultValue: ""
      })), actions));
    }

  }, _defineProperty(_class, "propTypes", {
    onJoin: PropTypes.func,
    onBack: PropTypes.func,
    wifiName: PropTypes.string
  }), _temp;
});