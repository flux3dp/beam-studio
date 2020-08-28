function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactClassset', 'jquery', 'jsx!widgets/Unit-Input', 'helpers/round'], function (ReactCx, $, UnitInput, round) {
  'use strict';

  const React = require('react');

  const ReactDOM = require('react-dom');

  class ManipulationPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_onClearNoise", e => {
        this.props.onClearNoise(this.state.handleMesh);
      });

      _defineProperty(this, "_onSavePCD", e => {
        this.props.onSavePCD();
      });

      _defineProperty(this, "_onSaveASC", e => {
        this.props.onSaveASC();
      });

      _defineProperty(this, "_onCrop", e => {
        var me = e.currentTarget,
            onCropping = this.state.onCropping,
            handleMesh = this.state.handleMesh;

        if (true === onCropping) {
          this.props.onCropOff(handleMesh);
        } else {
          this.props.onCropOn(handleMesh);
        }

        this.setState({
          onCropping: !onCropping
        });
      });

      _defineProperty(this, "_onManualMerge", e => {
        this.props.onManualMerge(e);
      });

      _defineProperty(this, "_onTransform", e => {
        var self = this,
            me = e.currentTarget,
            type = me.dataset.type.split('.'),
            parent = type[0],
            child = type[1],
            object = self.state.object;
        object[parent][child] = parseFloat(me.value, 10);

        if ('rotation' === parent) {
          object[parent][child] = Math.PI * object[parent][child] / 180;
        }

        self.setState({
          object: object
        }, function () {
          self.props.onChange(self.state.handleMesh, object);
        });
      });

      _defineProperty(this, "_renderForMultipleMesh", lang => {
        return /*#__PURE__*/React.createElement("div", {
          className: "wrapper"
        }, /*#__PURE__*/React.createElement("label", {
          className: "controls accordion"
        }, /*#__PURE__*/React.createElement("input", {
          type: "radio",
          className: "accordion-switcher",
          disabled: true,
          checked: true
        }), /*#__PURE__*/React.createElement("p", {
          className: "caption"
        }, lang.scan.manipulation.filter), /*#__PURE__*/React.createElement("div", {
          className: "accordion-body"
        }, /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("button", {
          className: "btn btn-action btn-merge",
          "data-ga-event": "manual-merge",
          onClick: this._onManualMerge
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-merge.png"
        }), lang.scan.manipulation.manual_merge)), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("button", {
          className: "btn btn-action btn-save-pcd",
          "data-ga-event": "save-point-cloud",
          onClick: this._onSavePCD
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-export.png"
        }), lang.scan.manipulation.save_pointcloud)))));
      });

      _defineProperty(this, "_renderForSingleMesh", lang => {
        var props = this.props,
            state = this.state,
            position = {
          x: round(state.object.position.x || 0, -2),
          y: round(state.object.position.y || 0, -2),
          z: round(state.object.position.z || 0, -2)
        },
            size = {
          x: round(state.object.size.x || 0, -2),
          y: round(state.object.size.y || 0, -2),
          z: round(state.object.size.z || 0, -2)
        },
            rotation = {
          x: round(state.object.rotation.x * 180 / Math.PI || 0, 0),
          y: round(state.object.rotation.y * 180 / Math.PI || 0, 0),
          z: round(state.object.rotation.z * 180 / Math.PI || 0, 0)
        },
            cropClass = {
          'btn': true,
          'btn-action': true,
          'btn-crop': true,
          'btn-pressed': this.state.onCropping
        };
        return /*#__PURE__*/React.createElement("div", {
          className: "wrapper"
        }, /*#__PURE__*/React.createElement("label", {
          className: "controls accordion"
        }, /*#__PURE__*/React.createElement("input", {
          name: "maniplulation",
          type: "radio",
          className: "accordion-switcher",
          defaultChecked: true
        }), /*#__PURE__*/React.createElement("p", {
          className: "caption"
        }, lang.scan.manipulation.filter), /*#__PURE__*/React.createElement("div", {
          className: "accordion-body"
        }, /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("button", {
          className: ReactCx.cx(cropClass),
          "data-ga-event": "crop",
          onClick: this._onCrop
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-crop.png"
        }), lang.scan.manipulation.crop)), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("button", {
          className: "btn btn-action btn-denoise",
          "data-ga-event": "denoise",
          onClick: this._onClearNoise
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-denoise.png"
        }), lang.scan.manipulation.clear_noise)), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("button", {
          className: "btn btn-action btn-save-pcd",
          "data-ga-event": "save-point-cloud",
          onClick: this._onSavePCD
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-export.png"
        }), lang.scan.manipulation.save_pointcloud, " PCD")), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("button", {
          className: "btn btn-action btn-save-pcd",
          "data-ga-event": "save-point-cloud",
          onClick: this._onSaveASC
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/icon-export.png"
        }), lang.scan.manipulation.save_pointcloud, " ASC")))), /*#__PURE__*/React.createElement("label", {
          className: "controls accordion",
          onClick: this.props.switchTransformMode.bind(this, 'translate')
        }, /*#__PURE__*/React.createElement("input", {
          name: "maniplulation",
          type: "radio",
          className: "accordion-switcher"
        }), /*#__PURE__*/React.createElement("p", {
          className: "caption"
        }, lang.scan.manipulation.position, /*#__PURE__*/React.createElement("span", {
          className: "value"
        }, position.x, " ,", position.y, " ,", position.z)), /*#__PURE__*/React.createElement("label", {
          className: "accordion-body"
        }, /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
          dataAttrs: {
            type: 'position.x'
          },
          defaultValue: position.x,
          getValue: this._onTransform
        })), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
          dataAttrs: {
            type: 'position.y'
          },
          defaultValue: position.y,
          getValue: this._onTransform
        })), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, "Z"), /*#__PURE__*/React.createElement(UnitInput, {
          dataAttrs: {
            type: 'position.z'
          },
          defaultValue: position.z,
          getValue: this._onTransform
        })))), /*#__PURE__*/React.createElement("label", {
          className: "controls accordion",
          onClick: this.props.switchTransformMode.bind(this, 'rotate')
        }, /*#__PURE__*/React.createElement("input", {
          name: "maniplulation",
          type: "radio",
          className: "accordion-switcher"
        }), /*#__PURE__*/React.createElement("p", {
          className: "caption"
        }, lang.scan.manipulation.rotate, /*#__PURE__*/React.createElement("span", {
          className: "value"
        }, rotation.x, " ,", rotation.y, " ,", rotation.z)), /*#__PURE__*/React.createElement("label", {
          className: "accordion-body"
        }, /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, "X"), /*#__PURE__*/React.createElement(UnitInput, {
          dataAttrs: {
            type: 'rotation.x'
          },
          defaultValue: rotation.x,
          min: -180,
          max: 180,
          defaultUnitType: "angle",
          defaultUnit: "\xB0",
          getValue: this._onTransform
        })), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, "Y"), /*#__PURE__*/React.createElement(UnitInput, {
          dataAttrs: {
            type: 'rotation.y'
          },
          defaultValue: rotation.y,
          min: -180,
          max: 180,
          defaultUnitType: "angle",
          defaultUnit: "\xB0",
          getValue: this._onTransform
        })), /*#__PURE__*/React.createElement("div", {
          className: "control"
        }, /*#__PURE__*/React.createElement("span", {
          className: "text-center header"
        }, "Z"), /*#__PURE__*/React.createElement(UnitInput, {
          dataAttrs: {
            type: 'rotation.z'
          },
          defaultValue: rotation.z,
          min: -180,
          max: 180,
          defaultUnitType: "angle",
          defaultUnit: "\xB0",
          getValue: this._onTransform
        })))));
      });

      _defineProperty(this, "_computePosition", position => {
        var manipulationPanel = ReactDOM.findDOMNode(this.refs.manipulationPanel),
            windowSize = {
          height: window.innerHeight,
          width: window.innerWidth
        },
            panelSize = {
          height: manipulationPanel.offsetHeight,
          width: manipulationPanel.offsetWidth
        };
        position = {
          top: position.top - panelSize.height / 2,
          left: position.left + panelSize.width / 2
        }; // check top/bottom

        if (position.top + panelSize.height > windowSize.height) {
          position.top = windowSize.height - panelSize.height;
        }

        if (0 > position.top) {
          position.top = 0;
        } // check left/right


        if (0 > position.left) {
          position.left = 0;
        }

        if (position.left - panelSize.width > windowSize.width) {
          position.left = windowSize.width - panelSize.width * 1.5;
        }

        return position;
      });

      this.state = {
        onCropping: false,
        handleMesh: this.props.selectedMeshes[0],
        visible: false,
        position: this.props.position,
        object: this.props.object
      };
    }

    render() {
      var self = this,
          props = self.props,
          lang = props.lang,
          wrapperClassName,
          position,
          content;
      wrapperClassName = ReactCx.cx({
        'manipulation-panel': true,
        'operating-panel': true
      });
      position = {
        top: 0,
        left: 0,
        transform: 'translate(' + this.state.position.left + 'px, ' + this.state.position.top + 'px)',
        visible: true === this.state.visible ? 'visible' : 'hidden'
      };
      content = 1 < this.props.selectedMeshes.length ? this._renderForMultipleMesh(lang) : this._renderForSingleMesh(lang);
      return /*#__PURE__*/React.createElement("div", {
        className: wrapperClassName,
        ref: "manipulationPanel",
        style: position
      }, /*#__PURE__*/React.createElement("svg", {
        className: "arrow",
        version: "1.1",
        xmlns: "http://www.w3.org/2000/svg",
        width: "36.8",
        height: "20"
      }, /*#__PURE__*/React.createElement("polygon", {
        points: "0,10 36.8,0 36.8,20"
      })), content);
    }

    componentDidMount() {
      this.setState({
        visible: true,
        position: this._computePosition(this.props.position)
      });
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      var manipulationPanel = ReactDOM.findDOMNode(this.refs.manipulationPanel);
      this.setState({
        visible: true,
        handleMesh: nextProps.selectedMeshes[0],
        position: this._computePosition(nextProps.position),
        object: nextProps.object
      });
    }

  }

  ;
  ManipulationPanel.defaultProps = {
    position: {
      top: 0,
      left: 0
    },
    object: {
      position: {},
      size: {},
      rotation: {}
    },
    selectedMeshes: [],
    onCropOn: function () {},
    onCropOff: function () {},
    onSavePCD: function () {},
    onSaveASC: function () {},
    onClearNoise: function () {},
    onManualMerge: function () {},
    onReset: function () {},
    switchTransformMode: function () {},
    onChange: function (objectMatrix) {}
  };
  return ManipulationPanel;
});