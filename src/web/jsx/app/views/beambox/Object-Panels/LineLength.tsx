define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'helpers/i18n'], function ($, PropTypes, FnWrapper, i18n) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class LineLengthPanel extends React.Component {
    constructor(props) {
      super(props);
    }

    getValueCaption() {
      let x1 = this.props.x1,
          y1 = this.props.y1,
          x2 = this.props.x2,
          y2 = this.props.y2,
          units = localStorage.getItem('default-units') || 'mm';

      if (units === 'inches') {
        x1 /= 25.4;
        x2 /= 25.4;
        y1 /= 25.4;
        y2 /= 25.4;
        units = '"';
      }

      return `${Math.hypot(x1 - x2, y1 - y2).toFixed(2)} ${units}`;
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "object-panel"
      }, /*#__PURE__*/React.createElement("label", {
        className: "controls accordion",
        onClick: () => {
          FnWrapper.resetObjectPanel();
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        className: "accordion-switcher",
        defaultChecked: true
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG.length, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption()))));
    }

  }

  LineLengthPanel.propTypes = {
    x1: PropTypes.number.isRequired,
    y1: PropTypes.number.isRequired,
    x2: PropTypes.number.isRequired,
    y2: PropTypes.number.isRequired
  };
  return LineLengthPanel;
});