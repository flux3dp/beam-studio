function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

define(['reactCreateReactClass'], function () {
  'use strict';

  const React = require('react');

  class ButtonGroup extends React.Component {
    render() {
      var className,
          props = this.props,
          buttons = props.buttons.map(function (opt, i) {
        className = 'btn';
        opt.type = opt.type || 'button';
        var content = '',
            attrs = {};

        for (var key in opt.dataAttrs) {
          if (false === attrs.hasOwnProperty(key)) {
            attrs['data-' + key] = opt.dataAttrs[key];
          }
        }

        if ('string' === typeof opt.className && '' !== opt.className) {
          className += ' ' + opt.className;
        } else {
          className += ' btn-default';
        }

        if (opt.right) {
          className += ' pull-right';
        }

        if (typeof opt.label === 'string') {
          attrs['data-test-key'] = opt.label.toLowerCase();
        }

        if ('link' === opt.type) {
          content = /*#__PURE__*/React.createElement("a", _extends({
            className: className,
            key: i,
            href: opt.href
          }, attrs, {
            onClick: opt.onClick
          }), opt.label);
        } else if ('icon' === opt.type) {
          content = /*#__PURE__*/React.createElement("button", _extends({
            key: i,
            title: opt.title,
            className: className,
            type: "button",
            onClick: opt.onClick
          }, attrs), opt.label);
        } else {
          content = /*#__PURE__*/React.createElement("button", _extends({
            key: i,
            title: opt.title,
            className: className,
            type: opt.type || 'button',
            onClick: opt.onClick,
            dangerouslySetInnerHTML: {
              __html: opt.label
            }
          }, attrs));
        }

        return content;
      }, this);
      className = 'button-group';

      if ('string' === typeof this.props.className && '' !== this.props.className) {
        className += ' ' + this.props.className;
      } else {
        className += ' btn-h-group';
      }

      return 0 < this.props.buttons.length ? /*#__PURE__*/React.createElement("div", {
        className: className
      }, buttons) : /*#__PURE__*/React.createElement("span", null);
    }

  }

  ;
  ButtonGroup.defaultProps = {
    buttons: [],
    className: ''
  };
  return ButtonGroup;
});