define(['jquery', 'jsx!widgets/Select', 'jsx!widgets/Radio-Group'], function ($, SelectView, RadioGroupView) {
  'use strict';

  const React = require('react');

  return function (args) {
    args = args || {};
    var options = [];
    return class Beginner extends React.Component {
      constructor(props) {
        super(props);
        this.state = args.state;
      }

      render() {
        var lang = this.state.lang;
        console.log('beginner');
        return /*#__PURE__*/React.createElement("div", {
          className: "panel beginner-panel"
        }, /*#__PURE__*/React.createElement("div", {
          className: "params horizontal-form"
        }, /*#__PURE__*/React.createElement("h2", null, /*#__PURE__*/React.createElement("span", {
          className: "fa fa-clock-o"
        }), "1 hr 30min"), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-print"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.beginner.print_speed.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(SelectView, {
          className: "span12",
          options: lang.print.params.beginner.print_speed.options
        })))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-bullseye"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.beginner.meterial.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(SelectView, {
          className: "span12",
          options: lang.print.params.beginner.meterial.options
        })))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-check"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.beginner.support.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RadioGroupView, {
          name: "support",
          options: lang.print.params.beginner.support.options
        })))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-check"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.beginner.platform.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RadioGroupView, {
          name: "platform",
          options: lang.print.params.beginner.platform.options
        })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
          "data-ga-event": "show-print-advanced",
          className: "btn btn-default span12"
        }, lang.print.advanced))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
          "data-ga-event": "print-started",
          className: "btn btn-default span12"
        }, lang.print.start_print)));
      }

    };
  };
});