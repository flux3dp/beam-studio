function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactClassset', 'jsx!widgets/List', 'jsx!widgets/Modal', 'jsx!views/laser/Advanced-Panel', 'jsx!widgets/Text-Toggle', 'jsx!widgets/Unit-Input', 'jsx!widgets/Button-Group', 'jsx!widgets/AlertDialog', 'app/actions/alert-actions', 'jsx!widgets/Dialog-Menu', 'helpers/api/config', 'helpers/i18n', 'helpers/round', 'plugins/classnames/index'], function ($, ReactCx, List, Modal, AdvancedPanel, TextToggle, UnitInput, ButtonGroup, AlertDialog, AlertActions, DialogMenu, config, i18n, round, ClassNames) {
  'use strict';

  const React = require('react');

  const ReactDOM = require('react-dom');

  var lang = i18n.lang;

  class SetupPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "isShading", () => {
        if ('undefined' === typeof this.refs.shading) {
          return true;
        } else {
          return this.refs.shading.isChecked();
        }
      });

      _defineProperty(this, "_togglePanel", (name, open) => {
        var self = this,
            panelMap = {
          advanced: [{
            openAdvancedPanel: open
          }],
          alert: [{
            showAlert: open
          }],
          customPresets: [{
            openCustomPresets: open
          }, {
            hasSelectedPreset: false
          }]
        };
        return function () {
          var panelSettings = panelMap[name],
              state = {};
          panelSettings.forEach(function (setting) {
            for (var key in setting) {
              state[key] = setting[key];
            }
          });
          self.setState(state);
        };
      });

      _defineProperty(this, "_openAdvancedPanel", e => {
        this._togglePanel('advanced', true)();
      });

      _defineProperty(this, "_onAdvanceDone", material => {
        this._saveLastestSet({
          material: material
        });

        this._togglePanel('advanced', false)();
      });

      _defineProperty(this, "_onSaveCustomPreset", material => {
        var customPresets = config().read('laser-custom-presets') || [],
            sameNamePresets = customPresets.some(function (preset) {
          return preset.label === material.label;
        });

        if (false === sameNamePresets) {
          customPresets.push(material);
          config().write('laser-custom-presets', customPresets);
          return true;
        } else {
          this.setState({
            showAlert: true,
            alertContent: {
              caption: lang.alert.caption,
              message: lang.alert.duplicated_preset_name
            }
          });
        }

        return !sameNamePresets;
      });

      _defineProperty(this, "_saveLastestSet", opts => {
        opts = opts || {};
        opts.material = opts.material || this.state.defaults.material;
        opts.objectHeight = 'number' === typeof opts.objectHeight ? opts.objectHeight : this.state.defaults.objectHeight;
        opts.heightOffset = 'number' === typeof opts.heightOffset ? opts.heightOffset : this.state.defaults.heightOffset;
        opts.isShading = 'boolean' === typeof opts.isShading ? opts.isShading : this.state.defaults.isShading;
        config().write('laser-defaults', opts);
        this.setState({
          defaults: opts
        });
      });

      _defineProperty(this, "_onPickupMaterial", e => {
        e.preventDefault();
        var self = this,
            chooseMaterial;

        if ('LI' === e.target.tagName) {
          if ('other' === e.target.dataset.value) {
            self._togglePanel('customPresets', true)();
          } else {
            chooseMaterial = this.state.materials.filter(function (el) {
              return el.value === e.target.dataset.value;
            })[0];

            self._saveLastestSet({
              material: chooseMaterial
            });
          }

          self.openSubPopup(e);
        }
      });

      _defineProperty(this, "_onShadingChanged", e => {
        this.props.onShadingChanged(e);

        this._saveLastestSet({
          isShading: this.isShading()
        });
      });

      _defineProperty(this, "openSubPopup", e => {
        this.refs.dialogMenu.toggleSubPopup(e);
      });

      _defineProperty(this, "_refreshObjectHeight", (e, value) => {
        this._saveLastestSet({
          objectHeight: value
        });

        this.openSubPopup(e);
      });

      _defineProperty(this, "_refreshHeightOffset", (e, value) => {
        this._saveLastestSet({
          heightOffset: value
        });

        this.openSubPopup(e);
      });

      _defineProperty(this, "_renderCustomPresets", () => {
        var self = this,
            customPresets = config().read('laser-custom-presets') || [],
            buttons = [{
          label: lang.laser.advanced.cancel,
          dataAttrs: {
            'ga-event': 'cancel-custom-laser-preset'
          },
          onClick: function (e) {
            self._togglePanel('customPresets', false)();
          }
        }, {
          label: lang.laser.advanced.apply,
          className: ClassNames({
            'btn-default': true,
            'btn-disabled': false === self.state.hasSelectedPreset
          }),
          dataAttrs: {
            'ga-event': 'apply-custom-laser-preset'
          },
          onClick: function (e) {
            var elCustomPresets = ReactDOM.findDOMNode(self.refs.customPresets);

            self._saveLastestSet({
              material: JSON.parse(elCustomPresets.dataset.selectedMaterial)
            });

            self._togglePanel('customPresets', false)();

            self._togglePanel('advanced', false)();
          }
        }],
            selectPresetMaterial = function (e) {
          var elCustomPresets = ReactDOM.findDOMNode(self.refs.customPresets),
              meta;

          if ('undefined' !== typeof e.target.dataset.meta) {
            meta = JSON.parse(e.target.dataset.meta);
            self.setState({
              hasSelectedPreset: true,
              chooseSpeed: meta.data.laser_speed,
              choosePower: meta.data.power
            });
            elCustomPresets.dataset.selectedMaterial = JSON.stringify(meta);
          }
        },
            handleDelPreset = function (e) {
          let elCustomPresets = ReactDOM.findDOMNode(self.refs.customPresets),
              customPresets = config().read('laser-custom-presets') || [],
              selectedPreset = JSON.parse(elCustomPresets.dataset.selectedMaterial),
              isSelected,
              selectedIdx;
          AlertActions.showPopupYesNo('removePreset', lang.laser.advanced.removePreset, '', '', {
            yes: function () {
              customPresets.some(function (preset, idx) {
                isSelected = selectedPreset.value === preset.value ? true : false;
                selectedIdx = idx;
                return isSelected;
              });
              customPresets.splice(selectedIdx, 1);
              config().write('laser-custom-presets', customPresets);
              self.forceUpdate();
            },
            no: function () {}
          });
        },
            advancedLang = lang.laser.advanced,
            content;

        customPresets = customPresets.map(function (opt, i) {
          opt.label = /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
            name: "custom-preset-item",
            type: "radio"
          }), /*#__PURE__*/React.createElement("p", {
            className: "preset-item-name",
            "data-meta": JSON.stringify(opt)
          }, opt.label, /*#__PURE__*/React.createElement("i", {
            className: "fa fa-times",
            onClick: handleDelPreset
          })));
          return opt;
        });
        content = /*#__PURE__*/React.createElement("div", {
          className: "custom-presets-wrapper",
          ref: "customPresets"
        }, /*#__PURE__*/React.createElement("p", {
          className: "caption"
        }, lang.laser.presets), /*#__PURE__*/React.createElement(List, {
          className: "custom-presets-list",
          items: customPresets,
          onClick: selectPresetMaterial,
          emptyMessage: "N/A"
        }), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "label"
        }, advancedLang.form.laser_speed.text), /*#__PURE__*/React.createElement("input", {
          type: "range",
          ref: "presetSpeed",
          min: advancedLang.form.laser_speed.min,
          max: advancedLang.form.laser_speed.max,
          step: advancedLang.form.laser_speed.step,
          value: this.state.chooseSpeed || 0,
          className: "readonly"
        }), /*#__PURE__*/React.createElement("span", {
          className: "value-text",
          ref: "presetSpeedDisplay",
          "data-tail": ' ' + advancedLang.form.laser_speed.unit
        }, this.state.chooseSpeed || 0)), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "label"
        }, advancedLang.form.power.text), /*#__PURE__*/React.createElement("input", {
          type: "range",
          ref: "presetPower",
          min: advancedLang.form.power.min,
          max: advancedLang.form.power.max,
          step: advancedLang.form.power.step,
          value: this.state.choosePower || 0,
          className: "readonly"
        }), /*#__PURE__*/React.createElement("span", {
          className: "value-text",
          ref: "presetPowerDisplay",
          "data-tail": " %"
        }, round(this.state.choosePower / advancedLang.form.power.max * 100, -2) || 0)), /*#__PURE__*/React.createElement(ButtonGroup, {
          className: "btn-h-group custom-preset-buttons",
          buttons: buttons
        }));
        return true === self.state.openCustomPresets ? /*#__PURE__*/React.createElement(Modal, {
          className: {
            hasShadow: true
          },
          content: content,
          onClose: self._togglePanel('customPresets', false)
        }) : '';
      });

      _defineProperty(this, "_onLoadCalibrationImage", () => {
        this.props.onLoadCalibrationImage();

        this._togglePanel('advanced', false)();
      });

      _defineProperty(this, "_renderAdvancedPanel", default_material => {
        var content = /*#__PURE__*/React.createElement(AdvancedPanel, {
          lang: lang,
          defaultMaterial: default_material,
          onClose: this._togglePanel('advanced', false),
          onLoadPreset: this._togglePanel('customPresets', true),
          onLoadCalibrationImage: this._onLoadCalibrationImage,
          onApply: this._onAdvanceDone,
          onSave: this._onSaveCustomPreset,
          ref: "advancedPanel"
        });
        return true === this.state.openAdvancedPanel ? /*#__PURE__*/React.createElement(Modal, {
          className: {
            hasShadow: true
          },
          content: content,
          onClose: this._togglePanel('advanced', false)
        }) : '';
      });

      _defineProperty(this, "_renderHeightOffset", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.laser.title.height_offset
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.laser.print_params.height_offset.text), /*#__PURE__*/React.createElement("span", null, this.state.defaults.heightOffset), /*#__PURE__*/React.createElement("span", null, lang.laser.print_params.height_offset.unit)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            defaultUnit: "mm",
            defaultValue: this.state.defaults.heightOffset,
            getValue: this._refreshHeightOffset,
            min: -10,
            max: 100
          }))
        };
      });

      _defineProperty(this, "_renderObjectHeight", () => {
        return {
          label: /*#__PURE__*/React.createElement("div", {
            title: lang.laser.title.object_height
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.laser.print_params.object_height.text), /*#__PURE__*/React.createElement("span", null, this.state.defaults.objectHeight), /*#__PURE__*/React.createElement("span", null, lang.laser.print_params.object_height.unit)),
          content: /*#__PURE__*/React.createElement("div", {
            className: "object-height-input"
          }, /*#__PURE__*/React.createElement(UnitInput, {
            defaultUnit: "mm",
            defaultValue: this.state.defaults.objectHeight,
            getValue: this._refreshObjectHeight,
            min: 0,
            max: 150
          }))
        };
      });

      _defineProperty(this, "_renderMaterialSelection", () => {
        var state = this.state,
            materialOptions = lang.laser.advanced.form.object_options.options,
            defaultMaterial;
        defaultMaterial = materialOptions.filter(function (material) {
          return material.value === state.defaults.material.value;
        })[0] || state.defaults.material;
        return {
          label: /*#__PURE__*/React.createElement("div", {
            className: "material-name",
            title: lang.laser.title.material
          }, /*#__PURE__*/React.createElement("span", {
            className: "caption"
          }, lang.laser.advanced.form.object_options.text), /*#__PURE__*/React.createElement("span", null, defaultMaterial.label)),
          content: /*#__PURE__*/React.createElement(List, {
            className: "material-list",
            ref: "materials",
            items: this.state.materials,
            onClick: this._onPickupMaterial
          })
        };
      });

      _defineProperty(this, "_renderShading", () => {
        var checked = 'undefined' !== typeof this.props.imageFormat && 'svg' === this.props.imageFormat ? false : this.state.defaults.isShading,
            classes = ReactCx.cx('display-text', 'shading');
        return {
          label: /*#__PURE__*/React.createElement(TextToggle, {
            ref: "shading",
            className: classes,
            title: lang.laser.title.shading,
            displayText: lang.laser.print_params.shading.text,
            textOn: lang.laser.print_params.shading.textOn,
            textOff: lang.laser.print_params.shading.textOff,
            defaultChecked: checked,
            onClick: this._onShadingChanged
          }),
          labelClass: {
            'disabled-pointer': 'svg' === this.props.imageFormat
          },
          content: ''
        };
      });

      _defineProperty(this, "_renderAlert", () => {
        var buttons = [{
          label: lang.laser.confirm,
          dataAttrs: {
            'ga-event': 'confirm'
          },
          onClick: this._togglePanel('alert', false)
        }],
            content = /*#__PURE__*/React.createElement(AlertDialog, {
          caption: this.state.alertContent.caption,
          message: this.state.alertContent.message,
          buttons: buttons
        });
        return true === this.state.showAlert ? /*#__PURE__*/React.createElement(Modal, {
          className: {
            hasShadow: true
          },
          content: content,
          disabledEscapeOnBackground: true,
          onClose: this._togglePanel('alert', false)
        }) : '';
      });

      _defineProperty(this, "_renderAdvancedButton", () => {
        return {
          label: /*#__PURE__*/React.createElement("button", {
            className: "btn btn-advance",
            "data-ga-event": "open-laser-advanced-panel",
            title: lang.laser.title.advanced,
            onClick: this._togglePanel('advanced', true)
          }, lang.laser.button_advanced),
          content: ''
        };
      });

      this.state = {
        openAdvancedPanel: false,
        openCustomPresets: false,
        hasSelectedPreset: false,
        defaults: this.props.defaults,
        materials: lang.laser.advanced.form.object_options.options,
        showAlert: false,
        alertContent: {
          caption: '',
          message: ''
        }
      };
    }

    render() {
      var advancedPanel = this._renderAdvancedPanel(this.state.defaults.material),
          customPresets = this._renderCustomPresets(),
          alert = this._renderAlert(),
          items = [this._renderMaterialSelection(), this._renderShading(), this._renderObjectHeight(), this._renderHeightOffset(), this._renderAdvancedButton()];

      return /*#__PURE__*/React.createElement("div", {
        className: "setup-panel operating-panel"
      }, /*#__PURE__*/React.createElement(DialogMenu, {
        ref: "dialogMenu",
        items: items
      }), advancedPanel, customPresets, alert);
    }

  }

  ;
  SetupPanel.defaultProps = {
    defaults: {},
    imageFormat: 'bitmap',
    // svg, bitmap
    onShadingChanged: function () {}
  };
  return SetupPanel;
});