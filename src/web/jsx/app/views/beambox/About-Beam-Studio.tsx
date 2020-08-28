function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Modal', 'app/stores/beambox-store', 'helpers/i18n'], function (Modal, BeamboxStore, i18n) {
  const React = require('react');

  const LANG = i18n.lang.topmenu;

  class AboutBeamStudio extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_close", () => {
        this.props.onClose();
      });

      this.state = {};
    }

    render() {
      return /*#__PURE__*/React.createElement(Modal, {
        onClose: () => {
          this._close();
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "about-beam-studio"
      }, /*#__PURE__*/React.createElement("img", {
        src: "icon.png"
      }), /*#__PURE__*/React.createElement("div", {
        className: "app-name"
      }, 'Beam Studio'), /*#__PURE__*/React.createElement("div", {
        className: "version"
      }, `${LANG.version} ${window.FLUX.version}`), /*#__PURE__*/React.createElement("div", {
        className: "copyright"
      }, 'Copyright ⓒ 2019 FLUX Inc.'), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        onClick: () => this._close()
      }, LANG.ok)));
    }

  }

  ;
  return AboutBeamStudio;
});