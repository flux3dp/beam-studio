function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'app/actions/beambox/svgeditor-function-wrapper', 'helpers/image-data', 'helpers/i18n'], function ($, PropTypes, FnWrapper, ImageData, i18n) {
  'use strict';

  const React = require('react');

  const LANG = i18n.lang.beambox.object_panels;

  class ShadingThreshold extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_writeShading", val => {
        FnWrapper.write_image_data_shading(this.props.$me, val);
      });

      _defineProperty(this, "_writeThreshold", val => {
        FnWrapper.write_image_data_threshold(this.props.$me, val);
      });

      _defineProperty(this, "_refreshImage", () => {
        const $me = this.props.$me;
        ImageData($me.attr("origImage"), {
          height: $me.height(),
          width: $me.width(),
          grayscale: {
            is_rgba: true,
            is_shading: Boolean(this.state.shading),
            threshold: parseInt(this.state.threshold),
            is_svg: false
          },
          onComplete: function (result) {
            $me.attr('xlink:href', result.canvas.toDataURL('image/png'));
          }
        });
      });

      _defineProperty(this, "handleShadingClick", event => {
        event.stopPropagation();
        const {
          shading
        } = this.state;
        const threshold = shading ? 128 : 255;
        this.setState({
          shading: !shading,
          threshold: threshold
        }, () => {
          this._writeShading(!shading);

          this._writeThreshold(threshold);

          this._refreshImage();
        });
      });

      _defineProperty(this, "handleThresholdChange", event => {
        const val = event.target.value;
        this.setState({
          threshold: val
        }, function () {
          this._writeThreshold(val);

          this._refreshImage();
        });
      });

      _defineProperty(this, "_renderThresholdPanel", () => {
        return this.state.shading ? null : /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, LANG.threshold), /*#__PURE__*/React.createElement("input", {
          type: "range",
          min: 0,
          max: 255,
          value: this.state.threshold,
          onChange: e => this.handleThresholdChange(e),
          onClick: e => {
            e.stopPropagation();
          }
        }));
      });

      this.state = {
        shading: this.props.shading,
        threshold: this.props.threshold
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      this.setState({
        shading: this.props.$me.attr('data-shading') === 'true',
        threshold: nextProps.threshold
      });
    }

    render() {
      const {
        shading,
        threshold
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
        className: "accordion-switcher"
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, LANG.laser_config, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, shading ? LANG.shading + ', ' : '', threshold)), /*#__PURE__*/React.createElement("label", {
        className: "accordion-body"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-center header"
      }, LANG.shading), /*#__PURE__*/React.createElement("label", {
        className: "shading-checkbox",
        onClick: e => this.handleShadingClick(e)
      }, /*#__PURE__*/React.createElement("i", {
        className: shading ? "fa fa-toggle-on" : "fa fa-toggle-off"
      }))), this._renderThresholdPanel())));
    }

  }

  ;
  ShadingThreshold.propTypes = {
    shading: PropTypes.bool.isRequired,
    threshold: PropTypes.number.isRequired,
    $me: PropTypes.object.isRequired
  };
  return ShadingThreshold;
});