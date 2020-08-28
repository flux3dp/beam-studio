function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'helpers/i18n'], function (Modal, i18n) {
  'use strict';

  const React = require('react');

  const classNames = require('classnames');

  const lang = i18n.lang.initialize;
  return function () {
    var _temp;

    return _temp = class ConnectWiFi extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "renderContent", () => {
          return /*#__PURE__*/React.createElement("div", {
            className: "connection-wifi"
          }, /*#__PURE__*/React.createElement("div", {
            className: "image-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "hint-circle"
          }), /*#__PURE__*/React.createElement("img", {
            className: "touch-panel-icon",
            src: "img/init-panel/touch-panel-en.png",
            draggable: "false"
          })), /*#__PURE__*/React.createElement("div", {
            className: "text-container"
          }, /*#__PURE__*/React.createElement("div", {
            className: "title"
          }, lang.connect_wifi.title), /*#__PURE__*/React.createElement("div", {
            className: "contents tutorial"
          }, /*#__PURE__*/React.createElement("div", null, lang.connect_wifi.tutorial1), /*#__PURE__*/React.createElement("div", null, lang.connect_wifi.tutorial2)), /*#__PURE__*/React.createElement("div", {
            className: classNames('contents', 'what-if', {
              collapsed: !this.state.showCollapse1
            })
          }, /*#__PURE__*/React.createElement("div", {
            className: "collapse-title",
            onClick: () => {
              this.setState({
                showCollapse1: !this.state.showCollapse1
              });
            }
          }, lang.connect_wifi.what_if_1, /*#__PURE__*/React.createElement("div", {
            className: "collapse-arrow"
          })), /*#__PURE__*/React.createElement("div", {
            className: "collapse-contents"
          }, lang.connect_wifi.what_if_1_content)), /*#__PURE__*/React.createElement("div", {
            className: classNames('contents', 'what-if', {
              collapsed: !this.state.showCollapse2
            })
          }, /*#__PURE__*/React.createElement("div", {
            className: "collapse-title",
            onClick: () => {
              this.setState({
                showCollapse2: !this.state.showCollapse2
              });
            }
          }, lang.connect_wifi.what_if_2, /*#__PURE__*/React.createElement("div", {
            className: "collapse-arrow"
          })), /*#__PURE__*/React.createElement("div", {
            className: "collapse-contents"
          }, lang.connect_wifi.what_if_2_content))));
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
              location.hash = '#initialize/connect/connect-machine-ip?wired=0';
            }
          }, lang.next));
        });

        this.state = {
          showCollapse1: false,
          showCollapse2: false
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