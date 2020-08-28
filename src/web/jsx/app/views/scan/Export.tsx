function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Radio-Group'], function (RadioGroupView) {
  'use strict';

  const React = require('react');

  class Export extends React.Component {
    constructor(...args) {
      super(...args);

      _defineProperty(this, "_onExport", e => {
        this.props.onExport(e);
      });
    }

    render() {
      var lang = this.props.lang;
      return /*#__PURE__*/React.createElement("div", {
        className: "scan-model-save-as absolute-center"
      }, /*#__PURE__*/React.createElement("h4", {
        className: "caption"
      }, lang.scan.save_as), /*#__PURE__*/React.createElement(RadioGroupView, {
        className: "file-formats clearfix",
        name: "file-format",
        options: lang.scan.save_mode
      }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
        "data-ga-event": "scan-export-to-file",
        className: "btn btn-default",
        onClick: this._onExport
      }, lang.scan.do_save)));
    }

  }

  ;
  Export.defaultProps = {
    lang: {},
    onExport: function () {}
  };
  return Export;
});