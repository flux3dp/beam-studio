define(['jsx!widgets/Modal', 'jsx!widgets/Dropdown-Control', 'jsx!widgets/Switch-Control', 'jsx!widgets/Radio-Control', 'app/actions/beambox', 'app/actions/beambox/beambox-preference', 'app/actions/beambox/constant', 'app/actions/beambox/preview-mode-background-drawer', 'helpers/i18n'], function (Modal, DropDownControl, SwitchControl, RadioControl, BeamboxActions, BeamboxPreference, Constant, PreviewModeBackgroundDrawer, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.document_panel; // value is one of low, medium, high
  // onChange() will get one of low, medium, high

  const EngraveDpiSlider = ({
    value,
    onChange,
    onClick
  }) => {
    const dpiMap = ['low', 'medium', 'high', 'ultra'];
    const dpiValueMap = {
      low: 100,
      medium: 250,
      high: 500,
      ultra: 1000
    };
    const sliderValue = dpiMap.indexOf(value);

    const onSliderValueChange = e => {
      const newSliderValue = e.target.value;
      const dpi = dpiMap[newSliderValue];
      onChange(dpi);
    };

    return /*#__PURE__*/React.createElement("div", {
      className: "controls",
      onClick: onClick
    }, /*#__PURE__*/React.createElement("div", {
      className: "control"
    }, /*#__PURE__*/React.createElement("span", {
      className: "label pull-left"
    }, LANG.engrave_dpi), /*#__PURE__*/React.createElement("input", {
      className: "slider",
      type: "range",
      min: 0,
      max: 3,
      value: sliderValue,
      onChange: onSliderValueChange
    }), /*#__PURE__*/React.createElement("input", {
      className: "value",
      type: "text",
      value: LANG[value] + ` (${dpiValueMap[value]} DPI)`,
      disabled: true
    })));
  };

  const workareaOptions = [{
    label: 'beamo',
    value: 'fbm1'
  }, {
    label: 'Beambox',
    value: 'fbb1b'
  }, {
    label: 'Beambox Pro',
    value: 'fbb1p'
  }];
  return class DocumentPanel extends React.PureComponent {
    constructor() {
      super();
      this.state = {
        engraveDpi: BeamboxPreference.read('engrave_dpi'),
        workarea: BeamboxPreference.read('workarea') || 'fbb1b',
        rotaryMode: BeamboxPreference.read('rotary_mode'),
        borderlessMode: BeamboxPreference.read('borderless') === true,
        enableDiode: BeamboxPreference.read('enable-diode') === true,
        enableAutofocus: BeamboxPreference.read('enable-autofocus') === true
      };
    }

    _handleEngraveDpiChange(value) {
      this.setState({
        engraveDpi: value
      });
    }

    _handleWorkareaChange(value) {
      this.setState({
        workarea: value
      });
    }

    _handleRotaryModeChange(value) {
      this.setState({
        rotaryMode: value
      });
      svgCanvas.setRotaryMode(value);
      svgCanvas.runExtensions('updateRotaryAxis');
    }

    _handleBorderlessModeChange(value) {
      this.setState({
        borderlessMode: value
      });
    }

    _handleDiodeModuleChange(value) {
      this.setState({
        enableDiode: value
      });
    }

    _handleAutofocusModuleChange(value) {
      this.setState({
        enableAutofocus: value
      });
    }

    save() {
      BeamboxPreference.write('engrave_dpi', this.state.engraveDpi);
      BeamboxPreference.write('rotary_mode', this.state.rotaryMode);
      BeamboxPreference.write('borderless', this.state.borderlessMode);
      BeamboxPreference.write('enable-diode', this.state.enableDiode);
      BeamboxPreference.write('enable-autofocus', this.state.enableAutofocus);

      if (this.state.workarea != BeamboxPreference.read('workarea')) {
        BeamboxPreference.write('workarea', this.state.workarea);
        svgCanvas.setResolution(Constant.dimension.getWidth(), Constant.dimension.getHeight());
        svgEditor.resetView();
        PreviewModeBackgroundDrawer.updateCanvasSize();
      }

      BeamboxActions.updateLaserPanel();
    }

    render() {
      const doesSupportHybrid = Constant.addonsSupportList.hybridLaser.includes(this.state.workarea);
      const doesSupportAutofocus = Constant.addonsSupportList.autoFocus.includes(this.state.workarea);
      return /*#__PURE__*/React.createElement(Modal, {
        onClose: () => this.props.unmount()
      }, /*#__PURE__*/React.createElement("div", {
        className: "document-panel"
      }, /*#__PURE__*/React.createElement("section", {
        className: "main-content"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, LANG.document_settings), /*#__PURE__*/React.createElement(EngraveDpiSlider, {
        value: this.state.engraveDpi,
        onChange: val => this._handleEngraveDpiChange(val)
      }), /*#__PURE__*/React.createElement(DropDownControl, {
        id: "workarea_dropdown",
        label: LANG.workarea,
        options: workareaOptions,
        default: this.state.workarea,
        onChange: (id, val) => this._handleWorkareaChange(val)
      }), /*#__PURE__*/React.createElement("div", {
        className: "sub-title"
      }, LANG.add_on), /*#__PURE__*/React.createElement(SwitchControl, {
        id: "rotary_mode",
        name: "rotary_mode",
        onText: LANG.enable,
        offText: LANG.disable,
        label: LANG.rotary_mode,
        default: this.state.rotaryMode,
        onChange: (id, val) => this._handleRotaryModeChange(val)
      }), /*#__PURE__*/React.createElement(SwitchControl, {
        id: "borderless_mode",
        name: "borderless_mode",
        onText: LANG.enable,
        offText: LANG.disable,
        label: LANG.borderless_mode,
        default: this.state.borderlessMode,
        onChange: (id, val) => this._handleBorderlessModeChange(val)
      }), /*#__PURE__*/React.createElement(SwitchControl, {
        id: "autofocus-module",
        name: "autofocus-module",
        onText: LANG.enable,
        offText: LANG.disable,
        label: LANG.enable_autofocus,
        default: doesSupportAutofocus && this.state.enableAutofocus,
        isDisabled: !doesSupportAutofocus,
        onChange: (id, val) => this._handleAutofocusModuleChange(val)
      }), /*#__PURE__*/React.createElement(SwitchControl, {
        id: "diode_module",
        name: "diode_module",
        onText: LANG.enable,
        offText: LANG.disable,
        label: LANG.enable_diode,
        default: doesSupportHybrid && this.state.enableDiode,
        isDisabled: !doesSupportHybrid,
        onChange: (id, val) => this._handleDiodeModuleChange(val)
      })), /*#__PURE__*/React.createElement("section", {
        className: "footer"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default pull-right",
        onClick: () => this.props.unmount()
      }, LANG.cancel), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default primary pull-right",
        onClick: () => {
          this.save();
          this.props.unmount();
        }
      }, LANG.save))));
    }

  };
});