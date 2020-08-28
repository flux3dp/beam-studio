function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jsx!views/beambox/Right-Panels/Options-Blocks/Infill-Block', 'jsx!widgets/Unit-Input-v2', 'jsx!contexts/DialogCaller', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'app/actions/beambox/font-funcs', 'app/actions/beambox/constant', 'helpers/i18n'], function (InFillBlock, UnitInput, DialogCaller, Alert, AlertConstants, FontFuncs, Constant, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const ReactSelect = require('react-select');

  const Select = ReactSelect.default;
  const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;

  class TextOptions extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "getStateFromElem", elem => {
        const {
          updateDimensionValues
        } = this.props;
        const postscriptName = svgCanvas.getFontPostscriptName(elem);
        let font;

        if (postscriptName) {
          font = FontFuncs.getFontOfPostscriptName(postscriptName);

          if (!elem.getAttribute('font-style')) {
            elem.setAttribute('font-style', font.italic ? 'italic' : 'normal');
          }

          if (!elem.getAttribute('font-weight')) {
            elem.setAttribute('font-weight', font.weight ? font.weight : 'normal');
          }
        } else {
          const family = svgCanvas.getFontFamily(elem);
          const weight = svgCanvas.getFontWeight(elem);
          const italic = svgCanvas.getItalic(elem);
          font = FontFuncs.requestFontByFamilyAndStyle({
            family,
            weight,
            italic
          });
        }

        console.log(font);

        const sanitizedDefaultFontFamily = (() => {
          // use these font if postscriptName cannot find in user PC
          const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', FontFuncs.availableFontFamilies[0]];
          const sanitizedFontFamily = [font.family, ...fontFamilyFallback].find(f => FontFuncs.availableFontFamilies.includes(f));
          return sanitizedFontFamily;
        })();

        if (sanitizedDefaultFontFamily !== font.family) {
          console.log(`unsupported font ${font.family}, fallback to ${sanitizedDefaultFontFamily}`);
          svgCanvas.setFontFamily(sanitizedDefaultFontFamily, true);
          const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedDefaultFontFamily)[0];
          svgCanvas.setFontPostscriptName(newFont.postscriptName, true);
        }

        updateDimensionValues({
          fontStyle: font.style
        });
        return {
          fontFamily: sanitizedDefaultFontFamily,
          fontStyle: font.style,
          fontSize: Number(elem.getAttribute('font-size')),
          letterSpacing: svgCanvas.getLetterSpacing(elem),
          lineSpacing: parseFloat(elem.getAttribute('data-line-spacing') || '1'),
          isVerti: elem.getAttribute('data-verti') === 'true'
        };
      });

      _defineProperty(this, "handleFontFamilyChange", newFamily => {
        if (typeof newFamily === 'object') {
          newFamily = newFamily.value;
        }

        const {
          updateDimensionValues,
          updateObjectPanel
        } = this.props;
        const newFont = FontFuncs.requestFontsOfTheFontFamily(newFamily)[0];
        const batchCmd = new svgedit.history.BatchCommand('Change Font family');
        let cmd = svgCanvas.setFontPostscriptName(newFont.postscriptName, true);
        batchCmd.addSubCommand(cmd);
        cmd = svgCanvas.setItalic(newFont.italic, true);
        batchCmd.addSubCommand(cmd);
        cmd = svgCanvas.setFontWeight(newFont.weight, true);
        batchCmd.addSubCommand(cmd);
        cmd = svgCanvas.setFontFamily(newFamily, true);
        batchCmd.addSubCommand(cmd);
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        const newStyle = newFont.style;
        updateDimensionValues({
          fontStyle: newStyle
        });
        this.setState({
          fontFamily: newFamily,
          fontStyle: newStyle
        });
        updateObjectPanel();
      });

      _defineProperty(this, "renderFontFamilyBlock", () => {
        const {
          fontFamily
        } = this.state;

        if (process.platform === 'darwin') {
          const options = FontFuncs.availableFontFamilies.map(option => {
            return {
              value: option,
              label: FontFuncs.fontNameMap.get(option)
            };
          });
          const styles = {
            option: (styles, {
              data,
              isDisabled,
              isFocused,
              isSelected
            }) => {
              return { ...styles,
                fontFamily: data.value
              };
            },
            input: styles => {
              return { ...styles,
                margin: 0,
                padding: 0,
                height: '19px'
              };
            }
          };
          const isOnlyOneOption = options.length === 1;
          return /*#__PURE__*/React.createElement("div", {
            className: "option-block"
          }, /*#__PURE__*/React.createElement("div", {
            className: "label"
          }, LANG.font_family), /*#__PURE__*/React.createElement("div", {
            className: "select-container"
          }, /*#__PURE__*/React.createElement(Select, {
            className: classNames('font-react-select-container', {
              'no-triangle': isOnlyOneOption
            }),
            classNamePrefix: 'react-select',
            defaultValue: {
              value: fontFamily,
              label: FontFuncs.fontNameMap.get(fontFamily)
            },
            onChange: value => this.handleFontFamilyChange(value),
            onKeyDown: e => {
              e.stopPropagation();
            },
            disabled: isOnlyOneOption,
            options: options,
            styles: styles
          })));
        } else {
          const options = FontFuncs.availableFontFamilies.map(option => /*#__PURE__*/React.createElement("option", {
            value: option,
            key: option,
            style: {
              fontFamily: option
            }
          }, FontFuncs.fontNameMap.get(option)));
          const isOnlyOneOption = options.length === 1;
          return /*#__PURE__*/React.createElement("div", {
            className: "option-block"
          }, /*#__PURE__*/React.createElement("div", {
            className: "label"
          }, LANG.font_family), /*#__PURE__*/React.createElement("div", {
            className: "select-container"
          }, /*#__PURE__*/React.createElement("select", {
            value: fontFamily,
            onChange: e => this.handleFontFamilyChange(e.target.value),
            className: classNames({
              'no-triangle': isOnlyOneOption
            }),
            disabled: isOnlyOneOption
          }, options)));
        }
      });

      _defineProperty(this, "handleFontStyleChange", val => {
        const {
          updateDimensionValues,
          updateObjectPanel
        } = this.props;
        const {
          fontFamily
        } = this.state;
        const font = FontFuncs.requestFontByFamilyAndStyle({
          family: fontFamily,
          style: val
        });
        const batchCmd = new svgedit.history.BatchCommand('Change Font Style');
        let cmd = svgCanvas.setFontPostscriptName(font.postscriptName, true);
        batchCmd.addSubCommand(cmd);
        cmd = svgCanvas.setItalic(font.italic, true);
        batchCmd.addSubCommand(cmd);
        cmd = svgCanvas.setFontWeight(font.weight, true);
        batchCmd.addSubCommand(cmd);
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);
        updateDimensionValues({
          fontStyle: val
        });
        this.setState({
          fontStyle: val
        });
        updateObjectPanel();
      });

      _defineProperty(this, "renderFontStyleBlock", () => {
        const {
          fontFamily,
          fontStyle
        } = this.state;
        const fontStyles = FontFuncs.requestFontsOfTheFontFamily(fontFamily).map(f => f.style);
        const options = fontStyles.map(option => /*#__PURE__*/React.createElement("option", {
          key: option,
          value: option
        }, option));
        const isOnlyOneOption = options.length === 1;
        return /*#__PURE__*/React.createElement("div", {
          className: "option-block"
        }, /*#__PURE__*/React.createElement("div", {
          className: "label"
        }, LANG.font_style), /*#__PURE__*/React.createElement("div", {
          className: "select-container"
        }, /*#__PURE__*/React.createElement("select", {
          value: fontStyle,
          onChange: e => this.handleFontStyleChange(e.target.value),
          className: classNames({
            'no-triangle': isOnlyOneOption
          }),
          disabled: isOnlyOneOption
        }, options)));
      });

      _defineProperty(this, "handleFontSizeChange", val => {
        const {
          updateObjectPanel
        } = this.props;
        svgCanvas.setFontSize(val);
        this.setState({
          fontSize: val
        });
      });

      _defineProperty(this, "renderFontSizeBlock", () => {
        const {
          fontSize
        } = this.state;
        return /*#__PURE__*/React.createElement("div", {
          className: "option-block"
        }, /*#__PURE__*/React.createElement("div", {
          className: "label"
        }, LANG.font_size), /*#__PURE__*/React.createElement(UnitInput, {
          min: 1,
          unit: "px",
          decimal: 0,
          className: {
            'option-input': true
          },
          defaultValue: fontSize,
          getValue: val => this.handleFontSizeChange(val)
        }));
      });

      _defineProperty(this, "handleLetterSpacingChange", val => {
        svgCanvas.setLetterSpacing(val);
        this.setState({
          letterSpacing: val
        });
      });

      _defineProperty(this, "renderLetterSpacingBlock", () => {
        const {
          letterSpacing
        } = this.state;
        return /*#__PURE__*/React.createElement("div", {
          className: "option-block"
        }, /*#__PURE__*/React.createElement("div", {
          className: "label"
        }, LANG.letter_spacing), /*#__PURE__*/React.createElement(UnitInput, {
          unit: "em",
          step: 0.05,
          className: {
            'option-input': true
          },
          defaultValue: letterSpacing,
          getValue: val => this.handleLetterSpacingChange(val)
        }));
      });

      _defineProperty(this, "handleLineSpacingChange", val => {
        svgCanvas.setTextLineSpacing(val);
        this.setState({
          lineSpacing: val
        });
      });

      _defineProperty(this, "renderLineSpacingBlock", () => {
        const {
          lineSpacing
        } = this.state;
        return /*#__PURE__*/React.createElement("div", {
          className: "option-block"
        }, /*#__PURE__*/React.createElement("div", {
          className: "label"
        }, LANG.line_spacing), /*#__PURE__*/React.createElement(UnitInput, {
          unit: "",
          min: 0.8,
          step: 0.1,
          decimal: 1,
          className: {
            'option-input': true
          },
          defaultValue: lineSpacing,
          getValue: val => this.handleLineSpacingChange(val)
        }));
      });

      _defineProperty(this, "handleVerticalTextClick", () => {
        const {
          isVerti
        } = this.state;
        svgCanvas.setTextIsVertical(!isVerti);
        this.setState({
          isVerti: !isVerti
        });
      });

      _defineProperty(this, "renderVerticalTextSwitch", () => {
        const {
          isVerti
        } = this.state;
        return /*#__PURE__*/React.createElement("div", {
          className: "option-block"
        }, /*#__PURE__*/React.createElement("div", {
          className: "label"
        }, LANG.vertical_text), /*#__PURE__*/React.createElement("div", {
          className: "onoffswitch",
          onClick: () => this.handleVerticalTextClick()
        }, /*#__PURE__*/React.createElement("input", {
          type: "checkbox",
          className: "onoffswitch-checkbox",
          checked: isVerti,
          readOnly: true
        }), /*#__PURE__*/React.createElement("label", {
          className: "onoffswitch-label"
        }, /*#__PURE__*/React.createElement("span", {
          className: "onoffswitch-inner"
        }), /*#__PURE__*/React.createElement("span", {
          className: "onoffswitch-switch"
        }))));
      });

      const {
        elem: _elem
      } = props;
      this.state = this.getStateFromElem(_elem);
    }

    componentDidUpdate(prevProps) {
      const lastElem = prevProps.elem;
      const lastId = lastElem.getAttribute('id');
      const {
        elem
      } = this.props;

      if (elem.getAttribute('id') !== lastId) {
        this.setState(this.getStateFromElem(elem));
      }
    }

    render() {
      const {
        elem
      } = this.props;
      return /*#__PURE__*/React.createElement("div", {
        className: "text-options"
      }, this.renderFontFamilyBlock(), this.renderFontStyleBlock(), this.renderFontSizeBlock(), this.renderLetterSpacingBlock(), this.renderLineSpacingBlock(), this.renderVerticalTextSwitch(), /*#__PURE__*/React.createElement(InFillBlock, {
        elem: elem
      }));
    }

  }

  return TextOptions;
});