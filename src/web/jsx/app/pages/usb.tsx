function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery'], function ($) {
  'use strict';

  const React = require('react');

  return function (args) {
    var _temp;

    args = args || {};
    return _temp = class Usb extends React.Component {
      constructor(...args) {
        super(...args);

        _defineProperty(this, "_handleSlideToggle", e => {
          var _target = e.target.attributes["data-target"].value;
          $('#' + _target).slideToggle();
        });
      }

      render() {
        var lang = args.state.lang;
        return /*#__PURE__*/React.createElement("div", {
          className: "usb"
        }, /*#__PURE__*/React.createElement("div", {
          className: "usb-sidebar"
        }, /*#__PURE__*/React.createElement("div", {
          className: "usb-sidebar-header"
        }, "My Drive"), /*#__PURE__*/React.createElement("div", {
          className: "usb-sidebar-body"
        }, /*#__PURE__*/React.createElement("div", {
          className: "folder"
        }, /*#__PURE__*/React.createElement("div", {
          className: "folder-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-folder.png",
          height: "30px"
        })), /*#__PURE__*/React.createElement("div", {
          className: "folder-name"
        }, "Folder Name"), /*#__PURE__*/React.createElement("div", {
          className: "expand-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-arrow-d.png",
          height: "35px"
        }))), /*#__PURE__*/React.createElement("div", {
          className: "folder"
        }, /*#__PURE__*/React.createElement("div", {
          className: "folder-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-folder.png",
          height: "30px"
        })), /*#__PURE__*/React.createElement("div", {
          className: "folder-name"
        }, "Folder Name"), /*#__PURE__*/React.createElement("div", {
          className: "expand-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-arrow-d.png",
          height: "35px",
          "data-target": "exp",
          onClick: this._handleSlideToggle
        }))), /*#__PURE__*/React.createElement("div", {
          className: "hide",
          id: "exp"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file level2"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "http://placehold.it/35x35"
        })), /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file1.gcode")), /*#__PURE__*/React.createElement("div", {
          className: "file level2"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "http://placehold.it/35x35"
        })), /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file2.gcode")), /*#__PURE__*/React.createElement("div", {
          className: "file level2"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "http://placehold.it/35x35"
        })), /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file3.gcode"))), /*#__PURE__*/React.createElement("div", {
          className: "file"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "http://placehold.it/35x35"
        })), /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file1.gcode")), /*#__PURE__*/React.createElement("div", {
          className: "file"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "http://placehold.it/35x35"
        })), /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file2.gcode")), /*#__PURE__*/React.createElement("div", {
          className: "file"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-icon"
        }, /*#__PURE__*/React.createElement("img", {
          src: "http://placehold.it/35x35"
        })), /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file3.gcode"))), /*#__PURE__*/React.createElement("div", {
          className: "usb-sidebar-footer"
        }, /*#__PURE__*/React.createElement("a", {
          className: "btn btn-print green full-width align-bottom no-border-radius"
        }, "Print"))), /*#__PURE__*/React.createElement("div", {
          className: "file-content"
        }, /*#__PURE__*/React.createElement("div", {
          className: "main-content"
        }), /*#__PURE__*/React.createElement("div", {
          className: "file-detail align-bottom"
        }, /*#__PURE__*/React.createElement("div", {
          className: "file-name"
        }, "file1.gcode"), /*#__PURE__*/React.createElement("div", {
          className: "detail-info"
        }, /*#__PURE__*/React.createElement("div", {
          className: "row-fluid"
        }, /*#__PURE__*/React.createElement("div", {
          className: "span2 info-header"
        }, "Size"), /*#__PURE__*/React.createElement("div", {
          className: "span8 info-content"
        }, "100 MB")), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid"
        }, /*#__PURE__*/React.createElement("div", {
          className: "span2 info-header"
        }, "Created"), /*#__PURE__*/React.createElement("div", {
          className: "span8 info-content"
        }, "xxxx/xx/xx, xx:xx AM")), /*#__PURE__*/React.createElement("div", {
          className: "row-fluid"
        }, /*#__PURE__*/React.createElement("div", {
          className: "span2 info-header"
        }, "Modified"), /*#__PURE__*/React.createElement("div", {
          className: "span8 info-content"
        }, "xxxx/xx/xx, xx:xx AM"))))));
      }

    }, _temp;
  };
});