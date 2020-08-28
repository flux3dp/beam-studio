function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'helpers/i18n'], function (Modal, i18n) {
  'use strict';

  const React = require('react');

  const classNames = require('classnames');

  const lang = i18n.lang.initialize;
  return function () {
    var _temp;

    return _temp = class ConnectEthernet extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "renderContent", () => {
          const guideHref = process.platform === 'darwin' ? lang.connect_ethernet.tutorial2_a_href_mac : lang.connect_ethernet.tutorial2_a_href_win;
          return /*#__PURE__*/React.createElement("div", {
            className: "connection-ethernet"
          }, /*#__PURE__*/React.createElement("div", {
            className: "image-container ether"
          }, /*#__PURE__*/React.createElement("div", {
            className: "circle c1"
          }), /*#__PURE__*/React.createElement("img", {
            className: "ethernet-icon",
            src: "img/init-panel/icon-dual-cable.svg",
            draggable: "false"
          }), /*#__PURE__*/React.createElement("div", {
            className: "circle c2"
          })), /*#__PURE__*/React.createElement("div", {
            className: "text-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "title"
          }, lang.connect_ethernet.title), /*#__PURE__*/React.createElement("div", {
            className: "contents tutorial"
          }, /*#__PURE__*/React.createElement("div", null, lang.connect_ethernet.tutorial1), /*#__PURE__*/React.createElement("div", null, lang.connect_ethernet.tutorial2_1, /*#__PURE__*/React.createElement("a", {
            target: "_blank",
            href: guideHref
          }, lang.connect_ethernet.tutorial2_a_text), lang.connect_ethernet.tutorial2_2), /*#__PURE__*/React.createElement("div", null, lang.connect_ethernet.tutorial3))));
        });

        _defineProperty(this, "renderButtons", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "btn-page-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "btn-page",
            onClick: () => {
              location.hash = '#initialize/connect/select-connection-type';
            }
          }, lang.back), /*#__PURE__*/React.createElement("div", {
            className: "btn-page primary",
            onClick: () => {
              location.hash = '#initialize/connect/connect-machine-ip?wired=1';
            }
          }, lang.next));
        });

        this.state = {
          showCollapse: false
        };
      }

      render() {
        const wrapperClassName = {
          'initialization': true
        };
        const innerContent = this.renderContent();
        const content = /*#__PURE__*/React.createElement("div", {
          className: "connect-machine"
        }, /*#__PURE__*/React.createElement("div", {
          className: "top-bar"
        }), this.renderButtons(), innerContent);
        return /*#__PURE__*/React.createElement(Modal, {
          className: wrapperClassName,
          content: content
        });
      }

    }, _temp;
  };
});