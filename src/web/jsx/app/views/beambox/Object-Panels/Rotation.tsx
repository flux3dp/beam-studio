function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n'], function ($, PropTypes, FnWrapper, UnitInput, i18n) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class Rotation extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_update_angle_handler", angle => {
        FnWrapper.update_angle(angle);
        this.setState({
          angle: angle
        });
      });

      this.state = {
        angle: this.props.angle
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        angle: nextProps.angle
      });
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
        className: "accordion-switcher"
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG.rotation, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.state.angle, "\xB0")), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement(UnitInput, {
        min: -180,
        max: 180,
        defaultUnitType: "angle",
        defaultUnit: "\xB0",
        defaultValue: this.state.angle,
        getValue: this._update_angle_handler
      })))));
    }

  }

  ;
  Rotation.propTypes = {
    angle: PropTypes.number.isRequired
  };
  return Rotation;
});