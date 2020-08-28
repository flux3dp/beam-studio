function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'jsx!widgets/Unit-Input-v2', 'helpers/i18n', 'helpers/symbol-maker', 'app/actions/beambox/constant', 'app/constants/keycode-constants'], function ($, PropTypes, FnWrapper, UnitInput, i18n, SymbolMaker, Constant, KeycodeConstants) {
  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class SizePanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_updateWidth", val => {
        let cmd = null;

        switch (this.props.type) {
          case 'rect':
            FnWrapper.update_rect_width(val);
            break;

          case 'image':
            FnWrapper.update_image_width(val);
            break;

          case 'polygon':
          case 'path':
          case 'g':
          case 'use':
            cmd = svgCanvas.setSvgElemSize('width', val * Constant.dpmm);
            break;
        }

        this.setState({
          width: val
        });
        return cmd;
      });

      _defineProperty(this, "_updateHeight", val => {
        let cmd = null;

        switch (this.props.type) {
          case 'rect':
            FnWrapper.update_rect_height(val);
            break;

          case 'image':
            FnWrapper.update_image_height(val);
            break;

          case 'polygon':
          case 'path':
          case 'g':
          case 'use':
            cmd = svgCanvas.setSvgElemSize('height', val * Constant.dpmm);
            break;
        }

        this.setState({
          height: val
        });
        return cmd;
      });

      _defineProperty(this, "handleUpdateWidth", val => {
        const {
          width,
          height,
          isRatioPreserve
        } = this.state;
        let batchCmd = new svgedit.history.BatchCommand('Size Panel Width');
        let cmd;

        if (isRatioPreserve) {
          const constraintHeight = Number((val * height / width).toFixed(2));
          cmd = this._updateHeight(constraintHeight);

          if (cmd) {
            batchCmd.addSubCommand(cmd);
          }
        }

        cmd = this._updateWidth(val);

        if (cmd) {
          batchCmd.addSubCommand(cmd);
        }

        if (!batchCmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }
      });

      _defineProperty(this, "handleUpdateHeight", val => {
        const {
          width,
          height,
          isRatioPreserve
        } = this.state;
        let batchCmd = new svgedit.history.BatchCommand('Size Panel Height');
        let cmd;

        if (isRatioPreserve) {
          const constraintWidth = Number((val * width / height).toFixed(2));
          cmd = this._updateWidth(constraintWidth);

          if (cmd) {
            batchCmd.addSubCommand(cmd);
          }
        }

        cmd = this._updateHeight(val);

        if (cmd) {
          batchCmd.addSubCommand(cmd);
        }

        if (!batchCmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }
      });

      _defineProperty(this, "handleRatio", e => {
        this.setState({
          isRatioPreserve: e.target.checked
        });
      });

      _defineProperty(this, "getValueCaption", () => {
        const width = this.state.width,
              height = this.state.height,
              units = localStorage.getItem('default-units') || 'mm';

        if (units === 'inches') {
          return `${Number(width / 25.4).toFixed(3)}\" x ${Number(height / 25.4).toFixed(3)}\"`;
        } else {
          return `${width} x ${height} mm`;
        }
      });

      _defineProperty(this, "handleKeyUp", e => {
        if (this.props.type === 'use' && (e.keyCode === KeycodeConstants.KEY_UP || e.keyCode === KeycodeConstants.KEY_DOWN)) {
          SymbolMaker.reRenderImageSymbol(svgCanvas.getSelectedElems()[0]);
        }
      });

      _defineProperty(this, "handleBlur", async () => {
        if (this.props.type === 'use') {
          SymbolMaker.reRenderImageSymbolArray([svgCanvas.getSelectedElems()[0]]);
        } else if (this.props.type === 'g') {
          const allUses = Array.from(svgCanvas.getSelectedElems()[0].querySelectorAll('use'));
          SymbolMaker.reRenderImageSymbolArray(allUses);
        }
      });

      this.state = {
        width: props.width,
        height: props.height,
        isRatioPreserve: props.type !== 'rect'
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        width: nextProps.width,
        height: nextProps.height
      });
    }

    render() {
      const {
        width,
        height,
        isRatioPreserve
      } = this.state;
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
      }, LANG.size, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, this.getValueCaption())), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body with-lock"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.width), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        unit: "mm",
        onBlur: this.handleBlur,
        onKeyUp: this.handleKeyUp,
        defaultValue: width,
        getValue: val => this.handleUpdateWidth(val)
      })), /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.height), /*#__PURE__*/React.createElement(UnitInput, {
        min: 0,
        unit: "mm",
        onBlur: this.handleBlur,
        onKeyUp: this.handleKeyUp,
        defaultValue: height,
        getValue: val => this.handleUpdateHeight(val)
      }))), /*#__PURE__*/React.createElement("div", {
        className: "lock"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: isRatioPreserve,
        id: "togglePreserveRatio",
        onChange: e => this.handleRatio(e),
        hidden: true
      }), /*#__PURE__*/React.createElement("label", {
        htmlFor: "togglePreserveRatio",
        title: LANG.lock_desc
      }, /*#__PURE__*/React.createElement("div", null, "\u2510"), /*#__PURE__*/React.createElement("i", {
        className: isRatioPreserve ? 'fa fa-lock locked' : 'fa fa-unlock-alt unlocked'
      }), /*#__PURE__*/React.createElement("div", null, "\u2518"))))));
    }

  }

  ;
  return SizePanel;
});