define(['jsx!widgets/Modal', 'jsx!widgets/Unit-Input-v2', 'jsx!widgets/Validation-Text-Input', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'app/stores/beambox-store', 'helpers/local-storage', 'helpers/i18n'], function (Modal, UnitInput, ValidationTextInput, Alert, AlertConstants, BeamboxStore, LocalStorage, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.layer_color_config_panel;
  let defaultSettings = [{
    color: '#FF0000',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#FFFF00',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#00FF00',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#00FFFF',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#0000FF',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#FF00FF',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#800000',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#808000',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#008000',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#008080',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#000080',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#800080',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#CCCCCC',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#808080',
    power: 15,
    speed: 50,
    repeat: 1
  }, {
    color: '#000000',
    power: 15,
    speed: 50,
    repeat: 1
  }];

  class LayerColorConfigPanel extends React.Component {
    constructor(props) {
      super(props);
      let layerColorConfig = LocalStorage.get('layer-color-config');

      if (layerColorConfig) {
        this.layerColorConfig = layerColorConfig.array;
        this.layerColorConfigDict = layerColorConfig.dict;
      } else {
        this.layerColorConfig = [...defaultSettings];
        let i = 0;
        this.layerColorConfigDict = this.layerColorConfig.reduce((acc, cur) => ({ ...acc,
          [cur.color]: i++
        }), {});
      }

      this.state = {
        isDisplayingModal: false
      };
    }

    _close() {
      this.props.onClose();
    }

    _renderMainContent() {
      let configItems = [];

      for (let i = 0; i < this.layerColorConfig.length; i++) {
        configItems.push(this._renderLayerColorConfigItem(this.layerColorConfig[i], i));
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "main-content"
      }, configItems, this._renderAddConfigButton());
    }

    _renderLayerColorConfigItem(item, index) {
      return /*#__PURE__*/React.createElement("div", {
        className: "config-item",
        key: index
      }, /*#__PURE__*/React.createElement("div", {
        className: "color-block",
        style: {
          backgroundColor: item.color
        }
      }), /*#__PURE__*/React.createElement("div", {
        className: "color-hex"
      }, /*#__PURE__*/React.createElement(ValidationTextInput, {
        defaultValue: item.color,
        validation: val => this.validateColorInput(val, index),
        getValue: val => {
          this._handleColorInputValue(val, index);
        }
      })), /*#__PURE__*/React.createElement("div", {
        className: "text"
      }, LANG.power), /*#__PURE__*/React.createElement(UnitInput, {
        className: {
          power: true
        },
        min: 1,
        max: 100,
        unit: "%",
        defaultValue: item.power,
        getValue: val => {
          this._handleInputValue(val, 'power', index);
        },
        decimal: 1
      }), /*#__PURE__*/React.createElement("div", {
        className: "text"
      }, LANG.speed), /*#__PURE__*/React.createElement(UnitInput, {
        className: {
          speed: true
        },
        min: 3,
        max: 300,
        unit: "mm/s",
        defaultValue: item.speed,
        getValue: val => {
          this._handleInputValue(val, 'speed', index);
        },
        decimal: 1
      }), /*#__PURE__*/React.createElement("div", {
        className: "text"
      }, LANG.repeat), /*#__PURE__*/React.createElement(UnitInput, {
        className: {
          repeat: true
        },
        min: 1,
        max: 10,
        unit: "",
        defaultValue: item.repeat,
        getValue: val => {
          this._handleInputValue(val, 'repeat', index);
        },
        decimal: 0
      }), /*#__PURE__*/React.createElement("div", {
        className: "text remove",
        onClick: e => {
          this._handleRemoveConfig(index);
        }
      }, /*#__PURE__*/React.createElement("i", {
        className: "fa fa-trash-o"
      })));
    }

    _renderAddConfigButton() {
      return /*#__PURE__*/React.createElement("div", {
        className: "config-item"
      }, /*#__PURE__*/React.createElement("div", {
        className: "add-config",
        onClick: this._displayAddConfigPanel.bind(this)
      }, /*#__PURE__*/React.createElement("span", {
        className: "plus"
      }, '+'), /*#__PURE__*/React.createElement("span", null, LANG.add_config)));
    }

    validateColorInput(val, index) {
      val = val.replace(/ +/, '');
      let res;
      let matchHex6 = val.match(/(?<!.)#[0-9A-F]{6}\b/i);

      if (matchHex6) {
        res = matchHex6[0].toUpperCase();
      }

      if (!res) {
        let matchHex3 = val.match(/(?<!.)#[0-9A-F]{3}\b/i);

        if (matchHex3) {
          res = matchHex3[0].replace(/#([0-9A-F])([0-9A-F])([0-9A-F])/i, '#$1$1$2$2$3$3').toUpperCase();
        }
      }

      if (!res) {
        let matchRGB = val.match(/(?<!.)(rgb)?\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3}\)(?!.)/i);

        if (matchRGB) {
          matchRGB = matchRGB[0].match(/[0-9]{1,3},[0-9]{1,3},[0-9]{1,3}/)[0].split(',');
          let hex = (parseInt(matchRGB[0]) * 65536 + parseInt(matchRGB[1]) * 256 + parseInt(matchRGB[2])).toString(16);

          if (hex === 'NaN') {
            hex = '0';
          }

          while (hex.length < 6) {
            hex = '0' + hex;
          }

          res = `#${hex}`.toUpperCase();
        }
      }

      if (res && this.layerColorConfigDict[res] === undefined) {
        return res;
      } else if (res && this.layerColorConfigDict[res] !== index) {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_ERROR,
          message: LANG.in_use
        });
      }

      return false;
    }

    _handleColorInputValue(val, index) {
      if (this.layerColorConfigDict[val] === undefined) {
        this.layerColorConfigDict[val] = index;
        delete this.layerColorConfigDict[this.layerColorConfig[index].color];
        this.layerColorConfig[index].color = val;
        this.setState(this.state);
      } else if (this.layerColorConfigDict[val] !== index) {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_ERROR,
          message: LANG.in_use
        });
        this.setState(this.state);
      }
    }

    _handleInputValue(val, key, index) {
      this.layerColorConfig[index][key] = val;
    }

    _handleRemoveConfig(index) {
      Alert.popUp({
        buttonType: AlertConstants.YES_NO,
        message: LANG.sure_to_delete,
        onYes: () => {
          delete this.layerColorConfigDict[this.layerColorConfig[index].color];
          this.layerColorConfig.splice(index, 1);

          for (let i = index; i < this.layerColorConfig.length; i++) {
            this.layerColorConfigDict[this.layerColorConfig[i].color] -= 1;
          }

          this.setState(this.state);
        }
      });
    }

    _displayAddConfigPanel() {
      this.newPower = 15;
      this.newSpeed = 50;
      this.newRepeat = 1;
      this.setState({
        newColor: '',
        isDisplayingModal: true
      });
    }

    _renderFooter() {
      return /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, this._renderButton('pull-left', () => this._onResetDefault(), LANG.default), this._renderButton('pull-right', () => this._onCancel(), LANG.cancel), this._renderButton('pull-right primary', () => this._onSave(), LANG.save));
    }

    _onResetDefault() {
      Alert.popUp({
        buttonType: AlertConstants.YES_NO,
        message: LANG.sure_to_reset,
        onYes: () => {
          this.layerColorConfig = [...defaultSettings];
          let i = 0;
          this.layerColorConfigDict = this.layerColorConfig.reduce((acc, cur) => ({ ...acc,
            [cur.color]: i++
          }), {});
          this.setState(this.state);
        }
      });
    }

    _onSave() {
      LocalStorage.set('layer-color-config', {
        array: this.layerColorConfig,
        dict: this.layerColorConfigDict
      });

      this._close();
    }

    _onCancel() {
      this._close();
    }

    _renderButton(className, onClick, label, disabled) {
      className = `btn btn-default ${className}`;

      if (disabled) {
        className += ' disabled';
      }

      return /*#__PURE__*/React.createElement("button", {
        className: className,
        onClick: onClick,
        disabled: disabled
      }, label);
    }

    _renderAddConfigModal() {
      if (this.state.isDisplayingModal) {
        return /*#__PURE__*/React.createElement(Modal, {
          onClose: () => {}
        }, /*#__PURE__*/React.createElement("div", {
          className: "add-config-panel"
        }, /*#__PURE__*/React.createElement("div", {
          className: "title"
        }, LANG.add_config), /*#__PURE__*/React.createElement("div", {
          className: "input-column"
        }, /*#__PURE__*/React.createElement("div", {
          className: "color-block",
          style: {
            backgroundColor: this.state.newColor
          }
        }), /*#__PURE__*/React.createElement("div", {
          className: "name color"
        }, `${LANG.color} :`), /*#__PURE__*/React.createElement(ValidationTextInput, {
          defaultValue: this.state.newColor,
          validation: val => this.validateColorInput(val, -1),
          getValue: val => {
            this.setState({
              newColor: val
            });
          }
        })), /*#__PURE__*/React.createElement("div", {
          className: "input-column"
        }, /*#__PURE__*/React.createElement("div", {
          className: "name"
        }, `${LANG.power} :`), /*#__PURE__*/React.createElement(UnitInput, {
          className: {
            power: true
          },
          min: 1,
          max: 100,
          unit: "%",
          defaultValue: this.newPower,
          getValue: val => {
            this.newPower = val;
          },
          decimal: 1
        })), /*#__PURE__*/React.createElement("div", {
          className: "input-column"
        }, /*#__PURE__*/React.createElement("div", {
          className: "name"
        }, `${LANG.speed} :`), /*#__PURE__*/React.createElement(UnitInput, {
          className: {
            speed: true
          },
          min: 3,
          max: 300,
          unit: "mm/s",
          defaultValue: this.newSpeed,
          getValue: val => {
            this.newSpeed = val;
          },
          decimal: 1
        })), /*#__PURE__*/React.createElement("div", {
          className: "input-column"
        }, /*#__PURE__*/React.createElement("div", {
          className: "name"
        }, `${LANG.repeat} :`), /*#__PURE__*/React.createElement(UnitInput, {
          className: {
            repeat: true
          },
          min: 1,
          max: 10,
          unit: "",
          defaultValue: this.newRepeat,
          getValue: val => {
            this.newRepeat = val;
          },
          decimal: 0
        })), /*#__PURE__*/React.createElement("div", {
          className: "footer"
        }, this._renderButton('pull-right', () => {
          this._handleAddConfig();
        }, LANG.add), this._renderButton('pull-right', () => {
          this.setState({
            isDisplayingModal: false
          });
        }, LANG.cancel))));
      } else {
        return null;
      }
    }

    _handleAddConfig() {
      if (!this.state.newColor) {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_ERROR,
          message: LANG.no_input
        });
      } else if (this.layerColorConfigDict[this.state.newColor] !== undefined) {
        Alert.popUp({
          type: AlertConstants.SHOW_POPUP_ERROR,
          message: LANG.in_use
        });
      } else {
        this.layerColorConfig.push({
          color: this.state.newColor,
          power: this.newPower,
          speed: this.newSpeed,
          repeat: this.newRepeat
        });
        this.layerColorConfigDict[this.state.newColor] = this.layerColorConfig.length - 1;
        this.setState({
          isDisplayingModal: false
        });
      }
    }

    render() {
      return /*#__PURE__*/React.createElement(Modal, {
        onClose: () => {}
      }, /*#__PURE__*/React.createElement("div", {
        className: "layer-color-config-panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, LANG.layer_color_config), this._renderMainContent(), this._renderFooter(), this._renderAddConfigModal()));
    }

  }

  ;
  return LayerColorConfigPanel;
});