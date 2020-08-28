define(['reactPropTypes', 'jsx!widgets/Select', 'helpers/i18n'], function (PropTypes, SelectView, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  class OffsetDirPanel extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        dir: this.props.dir
      };
    }

    _updateOffsetDir(val) {
      this.props.onValueChange(val);
      this.setState({
        dir: val
      });
    }

    _getOffsetDir() {
      const typeNameMap = {
        0: LANG._offset.inward,
        1: LANG._offset.outward
      };
      return typeNameMap[this.state.dir];
    }

    render() {
      const options = [{
        value: 1,
        label: LANG._offset.outward,
        selected: this.state.dir === 1
      }, {
        value: 0,
        label: LANG._offset.inward,
        selected: this.state.dir === 0
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
      }, LANG._offset.direction, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this._getOffsetDir())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control offset-dir"
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-offset-dir",
        options: options,
        onChange: e => {
          this._updateOffsetDir(parseInt(e.target.value));
        }
      })))));
    }

  }

  return OffsetDirPanel;
});