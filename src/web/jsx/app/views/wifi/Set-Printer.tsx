function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'reactClassset', 'helpers/i18n'], function ($, PropTypes, ReactCx, i18n) {
  'use strict';

  var _class, _temp;

  const React = require('react');

  const ReactDOM = require('react-dom');

  return _temp = _class = class SetPrinter extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleSetPrinter", () => {
        var name = ReactDOM.findDOMNode(this.refs.name).value,
            password = ReactDOM.findDOMNode(this.refs.password).value;
        this.setState({
          validPrinterName: name !== '',
          validPrinterPassword: password !== ''
        });

        if (name !== '') {
          this.props.onSetPrinter(name, password);
        }
      });

      this.state = {
        validPrinterName: true,
        validPrinterPassword: true
      };
    }

    render() {
      var lang = this.props.lang,
          printerNameClass;
      printerNameClass = ReactCx.cx({
        'required': true,
        'error': !this.state.validPrinterName
      });
      return /*#__PURE__*/React.createElement("div", {
        className: "wifi center"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, lang.wifi.set_printer.caption), /*#__PURE__*/React.createElement("div", {
        className: "wifi-form row-fluid clearfix"
      }, /*#__PURE__*/React.createElement("div", {
        className: "col span5 flux-printer"
      }, /*#__PURE__*/React.createElement("img", {
        src: "img/img-flux-printer.png"
      })), /*#__PURE__*/React.createElement("div", {
        className: "col span7 text-left"
      }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("label", {
        for: "printer-name"
      }, lang.wifi.set_printer.printer_name), /*#__PURE__*/React.createElement("input", {
        ref: "name",
        id: "printer-name",
        type: "text",
        className: printerNameClass,
        placeholder: lang.wifi.set_printer.printer_name_placeholder
      })), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("label", {
        for: "printer-password"
      }, lang.wifi.set_printer.password), /*#__PURE__*/React.createElement("input", {
        ref: "password",
        type: "password",
        placeholder: lang.wifi.set_printer.password_placeholder
      })), /*#__PURE__*/React.createElement("p", {
        className: "notice"
      }, lang.wifi.set_printer.notice))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
        id: "btn-set-printer",
        className: "btn btn-large",
        onClick: this._handleSetPrinter
      }, lang.wifi.set_printer.next))));
    }

  }, _defineProperty(_class, "propTypes", {
    onSetPrinter: PropTypes.func
  }), _temp;
});