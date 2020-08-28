function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'jsx!views/laser/Setup-Panel', 'jsx!pages/Holder', 'helpers/api/config', 'helpers/i18n'], function ($, PropTypes, LaserSetupPanel, HolderGenerator, ConfigHelper, i18n) {
  const React = require('react');

  let Config = ConfigHelper(),
      lang = i18n.lang;
  'use strict';

  return function (args) {
    args = args || {};
    let Holder = HolderGenerator(args);

    class Laser extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "_fetchFormalSettings", holder => {
          let options = Config.read('laser-defaults') || {},
              max = lang.laser.advanced.form.power.max;
          return {
            object_height: options.objectHeight,
            height_offset: options.heightOffset || 0,
            laser_speed: options.material.data.laser_speed,
            calibration: holder.state.debug || 0,
            power: options.material.data.power / max,
            shading: true === holder.refs.setupPanel.isShading() ? 1 : 0
          };
        });

        _defineProperty(this, "_renderSetupPanel", holder => {
          return /*#__PURE__*/React.createElement(LaserSetupPanel, {
            page: holder.props.page,
            className: "operating-panel",
            imageFormat: holder.state.fileFormat,
            defaults: holder.state.panelOptions,
            onLoadCalibrationImage: holder._onLoadCalibrationImage,
            ref: "setupPanel",
            onShadingChanged: holder._onShadingChanged
          });
        });

        this.state = {
          options: {
            material: lang.laser.advanced.form.object_options.options[0],
            objectHeight: 0,
            heightOffset: 0,
            isShading: false
          }
        };
      }

      componentDidMount() {
        let options = Config.read('laser-defaults') || {};

        if (options.material == null) {
          options.material = lang.laser.advanced.form.object_options.options[0];
        }

        options.objectHeight = options.objectHeight || 0;
        options.heightOffset = options.heightOffset || (Config.read('default-model') === 'fd1p' ? -2.3 : 0);
        options.isShading = !!options.isShading;

        if (!Config.read('laser-defaults')) {
          Config.write('laser-defaults', options);
        }

        this.setState({
          options
        });
      }

      render() {
        // return <div />;
        return /*#__PURE__*/React.createElement(Holder, {
          page: this.props.page,
          acceptFormat: 'image/*',
          panelOptions: this.state.options,
          fetchFormalSettings: this._fetchFormalSettings,
          renderSetupPanel: this._renderSetupPanel
        });
      }

    }

    ;
    Laser.propTypes = {
      page: PropTypes.string
    };
    return Laser;
  };
});