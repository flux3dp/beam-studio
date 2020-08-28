define(['jquery', 'jsx!widgets/Radio-Group'], function ($, RadioGroupView) {
  'use strict';

  const React = require('react');

  return function (args) {
    args = args || {};
    var options = [];
    return class Expert extends React.Component {
      constructor(props) {
        super(props);
        this.state = args.state;
      }

      render() {
        var lang = this.state.lang;
        return /*#__PURE__*/React.createElement("div", {
          className: "panel expert-panel"
        }, /*#__PURE__*/React.createElement("div", {
          className: "params horizontal-form"
        }, /*#__PURE__*/React.createElement("h2", null, /*#__PURE__*/React.createElement("span", {
          className: "fa fa-clock-o"
        }), "1 hr 30min"), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-bars"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.expert.layer_height.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("input", {
          type: "number",
          defaultValue: lang.print.params.expert.layer_height.value
        }), lang.print.params.expert.layer_height.unit))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-print"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.expert.print_speed.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("input", {
          type: "number",
          defaultValue: lang.print.params.expert.print_speed.value
        }), lang.print.params.expert.print_speed.unit))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-fire"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.expert.temperature.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("input", {
          type: "number",
          defaultValue: lang.print.params.expert.temperature.value
        }), lang.print.params.expert.temperature.unit))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-check"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.expert.support.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RadioGroupView, {
          name: "support",
          options: lang.print.params.expert.support.options
        })))), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid clearfix"
        }, /*#__PURE__*/React.createElement("div", {
          className: "col span3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "param-icon fa fa-check"
        })), /*#__PURE__*/React.createElement("div", {
          className: "param col span9"
        }, /*#__PURE__*/React.createElement("h4", null, lang.print.params.expert.platform.text), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement(RadioGroupView, {
          name: "platform",
          options: lang.print.params.expert.platform.options
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