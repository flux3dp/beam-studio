function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!widgets/Unit-Input-v2', 'jsx!contexts/DialogCaller', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'app/actions/beambox/constant', 'app/constants/keycode-constants', 'helpers/symbol-maker', 'helpers/i18n'], function (UnitInput, DialogCaller, Alert, AlertConstants, Constant, KeycodeConstants, SymbolMaker, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.right_panel.object_panel;
  const panelMap = {
    'g': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    'path': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    'polygon': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    'rect': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    'ellipse': ['cx', 'cy', 'rot', 'rx', 'ry', 'lock'],
    'line': ['x1', 'y1', 'rot', 'x2', 'y2'],
    'image': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    'text': ['x', 'y', 'rot', 'w', 'h', 'lock'],
    'use': ['x', 'y', 'rot', 'w', 'h', 'lock']
  };
  const fixedSizeMapping = {
    'width': 'height',
    'height': 'width',
    'rx': 'ry',
    'ry': 'rx'
  };

  class DimensionPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "handleInputFocus", type => {
        const {
          elem
        } = this.props;
        this.focusedInputType = type;

        switch (type) {
          case 'x':
            svgCanvas.undoMgr.beginUndoableChange('x', [elem]);
            break;
        }
      });

      _defineProperty(this, "handleInputBlur", type => {
        let cmd = svgCanvas.undoMgr.finishUndoableChange();
        console.log(cmd);

        if (cmd && !cmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(cmd);
        }

        this.focusedInputType = null;
      });

      _defineProperty(this, "handlePositionChange", (type, val) => {
        const {
          elem,
          updateDimensionValues
        } = this.props;
        val *= Constant.dpmm;

        if (!['use', 'text'].includes(elem.tagName)) {
          svgCanvas.changeSelectedAttribute(type, val, [elem]);
        } else {
          svgCanvas.setSvgElemPosition(type, val);
        }

        const newDimensionValue = {};
        newDimensionValue[type] = val;
        updateDimensionValues(newDimensionValue);
        this.setState(this.state);
      });

      _defineProperty(this, "handleRotationChange", val => {
        const {
          elem,
          updateDimensionValues
        } = this.props;
        svgCanvas.setRotationAngle(val, false, elem);
        updateDimensionValues({
          rotation: val
        });
        this.setState(this.state);
      });

      _defineProperty(this, "changeSize", (type, val) => {
        const {
          elem
        } = this.props;
        let cmd = null;

        switch (elem.tagName) {
          case 'ellipse':
          case 'rect':
          case 'image':
            svgCanvas.undoMgr.beginUndoableChange(type, [elem]);
            svgCanvas.changeSelectedAttributeNoUndo(type, val, [elem]);
            cmd = svgCanvas.undoMgr.finishUndoableChange();
            break;

          case 'g':
          case 'polygon':
          case 'path':
          case 'text':
          case 'use':
            cmd = svgCanvas.setSvgElemSize(type, val);
            break;
        }

        if (elem.tagName === 'text') {
          if (elem.getAttribute('stroke-width') === '2') {
            elem.setAttribute('stroke-width', 2.01);
          } else {
            elem.setAttribute('stroke-width', 2);
          }
        }

        return cmd;
      });

      _defineProperty(this, "handleSizeChange", (type, val) => {
        const batchCmd = new svgedit.history.BatchCommand('Object Panel Size Change');
        const {
          updateDimensionValues,
          getDimensionValues
        } = this.props;
        const dimensionValues = getDimensionValues();
        const isRatioFixed = dimensionValues.isRatioFixed || false;
        const newDimensionValue = {};
        val *= Constant.dpmm;

        if (isRatioFixed) {
          const ratio = val / parseFloat(dimensionValues[type]);
          const otherType = fixedSizeMapping[type];
          const newOtherTypeVal = ratio * parseFloat(dimensionValues[otherType]);
          let cmd = this.changeSize(type, val);

          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }

          cmd = this.changeSize(otherType, newOtherTypeVal);

          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }

          newDimensionValue[type] = val;
          newDimensionValue[otherType] = newOtherTypeVal;
        } else {
          let cmd = this.changeSize(type, val);

          if (cmd && !cmd.isEmpty()) {
            batchCmd.addSubCommand(cmd);
          }

          newDimensionValue[type] = val;
        }

        if (batchCmd && !batchCmd.isEmpty()) {
          svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        }

        updateDimensionValues(newDimensionValue);
        this.setState(this.state);
      });

      _defineProperty(this, "handleSizeKeyUp", e => {
        const {
          elem
        } = this.props;

        if (elem.tagName === 'use' && (e.keyCode === KeycodeConstants.KEY_UP || e.keyCode === KeycodeConstants.KEY_DOWN)) {
          SymbolMaker.reRenderImageSymbol(elem);
        }
      });

      _defineProperty(this, "handleSizeBlur", async () => {
        const {
          elem
        } = this.props;

        if (elem.tagName === 'use') {
          SymbolMaker.reRenderImageSymbol(elem);
        } else if (elem.tagName === 'g') {
          const allUses = Array.from(elem.querySelectorAll('use'));
          SymbolMaker.reRenderImageSymbolArray(allUses);
        }
      });

      _defineProperty(this, "handleFixRatio", () => {
        const {
          elem,
          updateDimensionValues
        } = this.props;
        const isRatioFixed = elem.getAttribute('data-ratiofixed') === 'true' || false;
        elem.setAttribute('data-ratiofixed', !isRatioFixed);
        updateDimensionValues({
          isRatioFixed: !isRatioFixed
        });
        this.setState(this.state);
      });

      _defineProperty(this, "getDisplayValue", val => {
        if (!val) {
          return 0;
        }

        return val / Constant.dpmm;
      });

      _defineProperty(this, "renderDimensionPanel", type => {
        const {
          getDimensionValues
        } = this.props;
        const dimensionValues = getDimensionValues();
        const isRatioFixed = dimensionValues.isRatioFixed || false;
        const unit = localStorage.getItem('default-units') || 'mm';
        const isInch = unit === 'inches';

        switch (type) {
          case 'x':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'X'), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.x),
              getValue: val => this.handlePositionChange('x', val)
            }));

          case 'y':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'Y'), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.y),
              getValue: val => this.handlePositionChange('y', val)
            }));

          case 'x1':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'X', /*#__PURE__*/React.createElement("sub", null, '1')), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.x1),
              getValue: val => this.handlePositionChange('x1', val)
            }));

          case 'y1':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'Y', /*#__PURE__*/React.createElement("sub", null, '1')), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.y1),
              getValue: val => this.handlePositionChange('y1', val)
            }));

          case 'x2':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'X', /*#__PURE__*/React.createElement("sub", null, '2')), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.x2),
              getValue: val => this.handlePositionChange('x2', val)
            }));

          case 'y2':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'Y', /*#__PURE__*/React.createElement("sub", null, '2')), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.y2),
              getValue: val => this.handlePositionChange('y2', val)
            }));

          case 'cx':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'X', /*#__PURE__*/React.createElement("sub", null, 'C')), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.cx),
              getValue: val => this.handlePositionChange('cx', val)
            }));

          case 'cy':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'Y', /*#__PURE__*/React.createElement("sub", null, 'C')), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.cy),
              getValue: val => this.handlePositionChange('cy', val)
            }));

          case 'rot':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label img"
            }, /*#__PURE__*/React.createElement("img", {
              src: "img/right-panel/icon-rotate.svg"
            })), /*#__PURE__*/React.createElement(UnitInput, {
              unit: "deg",
              className: {
                'dimension-input': true
              },
              defaultValue: dimensionValues.rotation,
              getValue: val => this.handleRotationChange(val)
            }));

          case 'w':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'W'), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              onBlur: () => this.handleSizeBlur(),
              onKeyUp: e => this.handleSizeKeyUp(e),
              defaultValue: this.getDisplayValue(dimensionValues.width),
              getValue: val => this.handleSizeChange('width', val)
            }));

          case 'h':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'H'), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              onBlur: () => this.handleSizeBlur(),
              onKeyUp: e => this.handleSizeKeyUp(e),
              defaultValue: this.getDisplayValue(dimensionValues.height),
              getValue: val => this.handleSizeChange('height', val)
            }));

          case 'rx':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'W'), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.rx * 2),
              getValue: val => this.handleSizeChange('rx', val / 2)
            }));

          case 'ry':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-container",
              key: type
            }, /*#__PURE__*/React.createElement("div", {
              className: "label"
            }, 'H'), /*#__PURE__*/React.createElement(UnitInput, {
              unit: isInch ? 'in' : 'mm',
              className: {
                'dimension-input': true
              },
              defaultValue: this.getDisplayValue(dimensionValues.ry * 2),
              getValue: val => this.handleSizeChange('ry', val / 2)
            }));

          case 'lock':
            return /*#__PURE__*/React.createElement("div", {
              className: "dimension-lock",
              key: type,
              onClick: () => this.handleFixRatio()
            }, /*#__PURE__*/React.createElement("img", {
              src: isRatioFixed ? "img/right-panel/icon-lock.svg" : "img/right-panel/icon-padlock.svg"
            }));

          default:
            break;
        }

        return null;
      });

      _defineProperty(this, "renderDimensionPanels", panels => {
        const ret = [];

        for (let i = 0; i < panels.length; i++) {
          ret.push(this.renderDimensionPanel(panels[i]));
        }

        return ret;
      });

      _defineProperty(this, "renderFlipButtons", () => {
        return /*#__PURE__*/React.createElement("div", {
          className: "flip-btn-container"
        }, /*#__PURE__*/React.createElement("div", {
          className: "tool-btn",
          onClick: () => {
            svgCanvas.flipSelectedElements(-1, 1);
          },
          title: LANG.hflip
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/right-panel/icon-hflip.svg"
        })), /*#__PURE__*/React.createElement("div", {
          className: "tool-btn",
          onClick: () => {
            svgCanvas.flipSelectedElements(1, -1);
          },
          title: LANG.vflip
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/right-panel/icon-vflip.svg"
        })));
      });

      this.state = {};
    }

    componentWillUnmount() {
      this.handleSizeBlur();
    }

    render() {
      const {
        elem
      } = this.props;
      let panels = ['x', 'y', 'rot', 'w', 'h'];

      if (elem) {
        panels = panelMap[elem.tagName] || ['x', 'y', 'rot', 'w', 'h'];
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "dimension-panel"
      }, this.renderDimensionPanels(panels), this.renderFlipButtons());
    }

  }

  return DimensionPanel;
});