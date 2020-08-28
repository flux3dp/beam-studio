define(['reactPropTypes', 'jsx!widgets/Select', 'helpers/i18n'], function (PropTypes, SelectView, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class OffsetCornerPanel extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        cornerType: this.props.cornerType
      };
    }

    _updateOffsetCorner(val) {
      this.props.onValueChange(val);
      this.setState({
        cornerType: val
      });
    }

    _getOffsetCorner() {
      const typeNameMap = {
        'sharp': LANG._offset.sharp,
        'round': LANG._offset.round
      };
      return typeNameMap[this.state.cornerType];
    }

    render() {
      const options = [{
        value: 'sharp',
        label: LANG._offset.sharp,
        selected: this.state.cornerType === 'sharp'
      }, {
        value: 'round',
        label: LANG._offset.round,
        selected: this.state.cornerType === 'round'
      }];
      return /*#__PURE__*/React.createElement("div", {
        className: "tool-panel"
      }, /*#__PURE__*/React.createElement("label", {
        className: "controls accordion"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        className: "accordion-switcher",
        defaultChecked: true
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG._offset.corner_type, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this._getOffsetCorner())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control offset-corner"
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-offset-corner",
        options: options,
        onChange: e => {
          this._updateOffsetCorner(e.target.value);
        }
      })))));
    }

  }

  return OffsetCornerPanel;
});