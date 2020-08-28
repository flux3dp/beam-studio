function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable react/no-multi-comp */
define(['jquery', 'helpers/i18n', 'helpers/api/config', 'jsx!widgets/Select', 'jsx!widgets/Unit-Input-v2', 'app/actions/alert-actions', 'helpers/local-storage', 'app/actions/beambox/constant', 'app/actions/beambox/beambox-preference', 'app/actions/beambox/font-funcs', 'app/actions/initialize-machine'], function ($, i18n, Config, SelectView, UnitInput, AlertActions, LocalStorage, BeamboxConstant, BeamboxPreference, FontFuncs, initializeMachine) {
  const React = require('react');

  const FontManager = require('font-manager');

  const Controls = props => {
    const style = {
      width: 'calc(100% / 10 * 3 - 10px)'
    };
    const innerHtml = {
      __html: props.label
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "row-fluid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "span3 no-left-margin",
      style: style
    }, /*#__PURE__*/React.createElement("label", {
      className: "font2",
      dangerouslySetInnerHTML: innerHtml
    })), /*#__PURE__*/React.createElement("div", {
      className: "span8 font3"
    }, props.children));
  };

  class SettingGeneral extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_checkIPFormat", e => {
        var me = e.currentTarget,
            lang = this.state.lang,
            originalIP = Config().read('poke-ip-addr'),
            ips = me.value.split(/[,;] ?/),
            ipv4Pattern = /^\d{1,3}[\.]\d{1,3}[\.]\d{1,3}[\.]\d{1,3}$/g,
            isCorrectFormat = true;
        ips.forEach(ip => {
          if ('' !== ip && typeof ips === 'string' && false === ipv4Pattern.test(ip)) {
            me.value = originalIP;
            AlertActions.showPopupError('wrong-ip-error', lang.settings.wrong_ip_format + '\n' + ip);
            isCorrectFormat = false;
            return;
          }
        });

        if (isCorrectFormat) {
          this.configChanges['poke-ip-addr'] = me.value;
        }
      });

      _defineProperty(this, "_changeActiveLang", e => {
        i18n.setActiveLang(e.currentTarget.value);
        this.setState({
          lang: i18n.get()
        });
        this.props.onLangChange(e);
      });

      _defineProperty(this, "_updateConfigChange", (id, val) => {
        this.configChanges[id] = val;
        this.forceUpdate();
      });

      _defineProperty(this, "_getConfigEditingValue", key => {
        if (key in this.configChanges) {
          return this.configChanges[key];
        }

        return Config().read(key);
      });

      _defineProperty(this, "_updateBeamboxPreferenceChange", (item_key, val) => {
        if (val === 'true') {
          val = true;
        } else if (val === 'false') {
          val = false;
        }

        this.beamboxPreferenceChanges[item_key] = val;
        this.forceUpdate();
      });

      _defineProperty(this, "_getBeamboxPreferenceEditingValue", key => {
        if (key in this.beamboxPreferenceChanges) {
          return this.beamboxPreferenceChanges[key];
        }

        return BeamboxPreference.read(key);
      });

      _defineProperty(this, "_removeDefaultMachine", () => {
        if (confirm(this.state.lang.settings.confirm_remove_default)) {
          this.isDefaultMachineRemoved = true;
          this.forceUpdate();
        }
      });

      _defineProperty(this, "_resetFS", () => {
        if (confirm(this.state.lang.settings.confirm_reset)) {
          LocalStorage.clearAllExceptIP();
          location.hash = '#';
          location.reload();
        }
      });

      _defineProperty(this, "_handleDone", () => {
        for (let key in this.configChanges) {
          Config().write(key, this.configChanges[key]);
        }

        for (let key in this.beamboxPreferenceChanges) {
          BeamboxPreference.write(key, this.beamboxPreferenceChanges[key]);
        }

        if (this.isDefaultMachineRemoved) {
          initializeMachine.defaultPrinter.clear();
        }

        location.hash = 'studio/beambox';
        location.reload();
      });

      _defineProperty(this, "_handleCancel", () => {
        i18n.setActiveLang(this.origLang);
        location.hash = 'studio/beambox';
        location.reload();
      });

      this.state = {
        lang: i18n.lang
      };
      this.origLang = i18n.getActiveLang();
      this.isDefaultMachineRemoved = false;
      this.beamboxPreferenceChanges = {};
      this.configChanges = {};
    }

    render() {
      let {
        supported_langs
      } = this.props,
          printer = this.isDefaultMachineRemoved ? {} : initializeMachine.defaultPrinter.get(),
          default_machine_button,
          tableStyle = {
        width: '70%'
      },
          pokeIP = Config().read('poke-ip-addr'),
          lang = this.state.lang,
          options = [];
      Object.keys(supported_langs).map(l => {
        options.push({
          value: l,
          label: supported_langs[l],
          selected: l === i18n.getActiveLang()
        });
      });
      const notificationOptions = [{
        value: 0,
        label: lang.settings.notification_off,
        selected: (this.configChanges['notification'] || Config().read('notification')) === '0'
      }, {
        value: 1,
        label: lang.settings.notification_on,
        selected: (this.configChanges['notification'] || Config().read('notification')) === '1'
      }];
      const updateNotificationOptions = [{
        value: 0,
        label: lang.settings.notification_off,
        selected: (this.configChanges['auto_check_update'] || Config().read('auto_check_update')) === '0'
      }, {
        value: 1,
        label: lang.settings.notification_on,
        selected: (this.configChanges['auto_check_update'] || Config().read('auto_check_update')) !== '0'
      }];
      const GuessingPokeOptions = [{
        value: 0,
        label: lang.settings.off,
        selected: (this.configChanges['guessing_poke'] || Config().read('guessing_poke')) === '0'
      }, {
        value: 1,
        label: lang.settings.on,
        selected: (this.configChanges['guessing_poke'] || Config().read('guessing_poke')) !== '0'
      }];
      const autoConnectOptions = [{
        value: 0,
        label: lang.settings.off,
        selected: (this.configChanges['auto_connect'] || Config().read('auto_connect')) === '0'
      }, {
        value: 1,
        label: lang.settings.on,
        selected: (this.configChanges['auto_connect'] || Config().read('auto_connect')) !== '0'
      }];
      const defaultUnitsOptions = [{
        value: 'mm',
        label: lang.menu.mm,
        selected: (this.configChanges['default-units'] || Config().read('default-units')) === 'mm'
      }, {
        value: 'inches',
        label: lang.menu.inches,
        selected: (this.configChanges['default-units'] || Config().read('default-units')) === 'inches'
      }];
      const defaultFont = Config().read('default-font') || {
        family: 'Arial',
        style: 'Regular'
      };
      const fontOptions = FontFuncs.availableFontFamilies.map(family => {
        return {
          value: family,
          label: family,
          selected: family === defaultFont.family
        };
      });

      const onSelectFont = family => {
        const fonts = FontManager.findFontsSync({
          family
        });
        const newDefaultFont = fonts.filter(font => font.style === 'Regular')[0] || fonts[0];
        const config = Config();
        config.write('default-font', {
          family: newDefaultFont.family,
          postscriptName: newDefaultFont.postscriptName,
          style: newDefaultFont.style
        });
        this.setState(this.state);
      };

      const fonts = FontManager.findFontsSync({
        family: defaultFont.family
      });
      const fontStyleOptions = fonts.map(font => {
        return {
          value: font.postscriptName,
          label: font.style,
          selected: font.style === defaultFont.style
        };
      });

      const onSelectFontStyle = postscriptName => {
        const newDefaultFont = FontManager.findFontSync({
          postscriptName
        });
        const config = Config();
        config.write('default-font', {
          family: newDefaultFont.family,
          postscriptName: newDefaultFont.postscriptName,
          style: newDefaultFont.style
        });
        this.setState(this.state);
      };

      const guideSelectionOptions = [{
        value: 'false',
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('show_guides') === false
      }, {
        value: 'true',
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('show_guides') !== false
      }];
      const imageDownsamplingOptions = [{
        value: 'false',
        label: lang.settings.high,
        selected: this._getBeamboxPreferenceEditingValue('image_downsampling') === false
      }, {
        value: 'true',
        label: lang.settings.low,
        selected: this._getBeamboxPreferenceEditingValue('image_downsampling') !== false
      }];
      const continuousDrawingOptions = [{
        value: 'false',
        label: lang.settings.off,
        selected: !this._getBeamboxPreferenceEditingValue('continuous_drawing')
      }, {
        value: 'true',
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('continuous_drawing')
      }];
      const fastGradientOptions = [{
        value: 'false',
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('fast_gradient') === false
      }, {
        value: 'true',
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('fast_gradient') !== false
      }];
      const vectorSpeedConstraintOptions = [{
        value: 'false',
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('vector_speed_contraint') === false
      }, {
        value: 'true',
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('vector_speed_contraint') !== false
      }];
      const precutSwitchOptions = [{
        value: 'false',
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('blade_precut') !== true
      }, {
        value: 'true',
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('blade_precut') === true
      }];
      const defaultBeamboxModelOptions = [{
        value: 'fbm1',
        label: 'Beamo',
        selected: this._getBeamboxPreferenceEditingValue('model') === 'fbm1'
      }, {
        value: 'fbb1b',
        label: 'Beambox',
        selected: this._getBeamboxPreferenceEditingValue('model') === 'fbb1b'
      }, {
        value: 'fbb1p',
        label: 'Beambox Pro',
        selected: this._getBeamboxPreferenceEditingValue('model') === 'fbb1p'
      }];
      const stripeOptions = [{
        value: true,
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('stripe_compensation') === true
      }, {
        value: false,
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('stripe_compensation') !== true
      }];
      const maskOptions = [{
        value: true,
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('enable_mask') === true
      }, {
        value: false,
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('enable_mask') !== true
      }];
      const textToPathOptions = [{
        value: true,
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('TextbyFluxsvg') !== false
      }, {
        value: false,
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('TextbyFluxsvg') === false
      }];
      const fontSubstituteOptions = [{
        value: true,
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('font-substitute') !== false
      }, {
        value: false,
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('font-substitute') === false
      }];
      const borderlessModeOptions = [{
        value: true,
        label: lang.settings.on,
        selected: this._getBeamboxPreferenceEditingValue('default-borderless') === true
      }, {
        value: false,
        label: lang.settings.off,
        selected: this._getBeamboxPreferenceEditingValue('default-borderless') !== true
      }];
      const autofocusModuleOptions = [{
        value: true,
        label: lang.settings.enabled,
        selected: this._getBeamboxPreferenceEditingValue('default-autofocus') === true
      }, {
        value: false,
        label: lang.settings.disabled,
        selected: this._getBeamboxPreferenceEditingValue('default-autofocus') !== true
      }];
      const diodeModuleOptions = [{
        value: true,
        label: lang.settings.enabled,
        selected: this._getBeamboxPreferenceEditingValue('default-diode') == true
      }, {
        value: false,
        label: lang.settings.disabled,
        selected: this._getBeamboxPreferenceEditingValue('default-diode') !== true
      }];

      if (printer.name !== undefined) {
        default_machine_button = /*#__PURE__*/React.createElement("a", {
          className: "font3",
          onClick: this._removeDefaultMachine
        }, lang.settings.remove_default_machine_button);
      } else {
        default_machine_button = /*#__PURE__*/React.createElement("span", null, lang.settings.default_machine_button);
      }

      return /*#__PURE__*/React.createElement("div", {
        className: "form general"
      }, /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.general), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.language
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: options,
        onChange: this._changeActiveLang
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.notifications
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: notificationOptions,
        onChange: e => this._updateConfigChange('notification', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.update), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.check_updates
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: updateNotificationOptions,
        onChange: e => this._updateConfigChange('auto_check_update', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.connection), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.ip
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        autoComplete: "false",
        defaultValue: pokeIP,
        onBlur: this._checkIPFormat
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.guess_poke
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: GuessingPokeOptions,
        onChange: e => this._updateConfigChange('guessing_poke', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.auto_connect
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: autoConnectOptions,
        onChange: e => this._updateConfigChange('auto_connect', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.editor), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_units
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: defaultUnitsOptions,
        onChange: e => this._updateConfigChange('default-units', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_font_family
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: fontOptions,
        onChange: e => onSelectFont(e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_font_style
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: fontStyleOptions,
        onChange: e => onSelectFontStyle(e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_beambox_model
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: defaultBeamboxModelOptions,
        onChange: e => this._updateBeamboxPreferenceChange('model', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.guides
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: guideSelectionOptions,
        onChange: e => this._updateBeamboxPreferenceChange('show_guides', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.guides_origin
      }, /*#__PURE__*/React.createElement("span", {
        className: "font2",
        style: {
          marginRight: '10px'
        }
      }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: BeamboxConstant.dimension.getWidth() / 10,
        defaultValue: this._getBeamboxPreferenceEditingValue('guide_x0'),
        getValue: val => this._updateBeamboxPreferenceChange('guide_x0', val),
        className: {
          half: true
        }
      }), /*#__PURE__*/React.createElement("span", {
        className: "font2",
        style: {
          marginRight: '10px'
        }
      }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: BeamboxConstant.dimension.getHeight() / 10,
        defaultValue: this._getBeamboxPreferenceEditingValue('guide_y0'),
        getValue: val => this._updateBeamboxPreferenceChange('guide_y0', val),
        className: {
          half: true
        }
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.image_downsampling
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: imageDownsamplingOptions,
        onChange: e => this._updateBeamboxPreferenceChange('image_downsampling', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.continuous_drawing
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: continuousDrawingOptions,
        onChange: e => this._updateBeamboxPreferenceChange('continuous_drawing', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.engraving), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.fast_gradient
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: fastGradientOptions,
        onChange: e => this._updateBeamboxPreferenceChange('fast_gradient', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.path), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.vector_speed_constraint
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: vectorSpeedConstraintOptions,
        onChange: e => this._updateBeamboxPreferenceChange('vector_speed_contraint', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.loop_compensation
      }, /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: 20,
        defaultValue: Number(this._getConfigEditingValue('loop_compensation') || '0') / 10,
        getValue: val => this._updateConfigChange('loop_compensation', Number(val) * 10),
        className: {
          half: true
        }
      })), i18n.getActiveLang() === 'zh-cn' ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.blade_radius
      }, /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: 30,
        step: 0.01,
        defaultValue: this._getBeamboxPreferenceEditingValue('blade_radius') || 0,
        getValue: val => this._updateBeamboxPreferenceChange('blade_radius', val),
        className: {
          half: true
        }
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.blade_precut_switch
      }, /*#__PURE__*/React.createElement(SelectView, {
        className: "font3",
        options: precutSwitchOptions,
        onChange: e => this._updateBeamboxPreferenceChange('blade_precut', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.blade_precut_position
      }, /*#__PURE__*/React.createElement("span", {
        className: "font2",
        style: {
          marginRight: '10px'
        }
      }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: BeamboxConstant.dimension.getWidth() / 10,
        defaultValue: this._getBeamboxPreferenceEditingValue('precut_x') || 0,
        getValue: val => this._updateBeamboxPreferenceChange('precut_x', val),
        className: {
          half: true
        }
      }), /*#__PURE__*/React.createElement("span", {
        className: "font2",
        style: {
          marginRight: '10px'
        }
      }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: BeamboxConstant.dimension.getHeight() / 10,
        defaultValue: this._getBeamboxPreferenceEditingValue('precut_y'),
        getValue: val => this._updateBeamboxPreferenceChange('precut_y', val) || 0,
        className: {
          half: true
        }
      }))) : null, /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.mask), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.mask
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: maskOptions,
        onChange: e => this._updateBeamboxPreferenceChange('enable_mask', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.text_to_path), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.text_path_calc_optimization
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: textToPathOptions,
        onChange: e => this._updateBeamboxPreferenceChange('TextbyFluxsvg', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.font_substitute
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: fontSubstituteOptions,
        onChange: e => this._updateBeamboxPreferenceChange('font-substitute', e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        className: "subtitle"
      }, lang.settings.groups.modules), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_borderless_mode
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: borderlessModeOptions,
        onChange: e => this._updateBeamboxPreferenceChange('default-borderless', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_enable_autofocus_module
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: autofocusModuleOptions,
        onChange: e => this._updateBeamboxPreferenceChange('default-autofocus', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.default_enable_diode_module
      }, /*#__PURE__*/React.createElement(SelectView, {
        id: "select-lang",
        className: "font3",
        options: diodeModuleOptions,
        onChange: e => this._updateBeamboxPreferenceChange('default-diode', e.target.value)
      })), /*#__PURE__*/React.createElement(Controls, {
        label: lang.settings.diode_offset
      }, /*#__PURE__*/React.createElement("span", {
        className: "font2",
        style: {
          marginRight: '10px'
        }
      }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: BeamboxConstant.dimension.getWidth() / 10,
        defaultValue: this._getBeamboxPreferenceEditingValue('diode_offset_x') || 0,
        getValue: val => this._updateBeamboxPreferenceChange('diode_offset_x', val),
        className: {
          half: true
        }
      }), /*#__PURE__*/React.createElement("span", {
        className: "font2",
        style: {
          marginRight: '10px'
        }
      }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
        unit: "mm",
        min: 0,
        max: BeamboxConstant.dimension.getHeight() / 10,
        defaultValue: this._getBeamboxPreferenceEditingValue('diode_offset_y'),
        getValue: val => this._updateBeamboxPreferenceChange('diode_offset_y', val) || 0,
        className: {
          half: true
        }
      })), /*#__PURE__*/React.createElement("a", {
        className: "font5",
        onClick: this._resetFS
      }, /*#__PURE__*/React.createElement("b", null, lang.settings.reset_now)), /*#__PURE__*/React.createElement("div", {
        className: "clearfix"
      }), /*#__PURE__*/React.createElement("a", {
        className: "btn btn-done",
        onClick: this._handleDone
      }, lang.settings.done), /*#__PURE__*/React.createElement("a", {
        className: "btn btn-cancel",
        onClick: this._handleCancel
      }, lang.settings.cancel));
    }

  }

  ;
  SettingGeneral.defaultProps = {
    lang: {},
    supported_langs: '',
    onLangChange: function () {}
  };
  return SettingGeneral;
});