function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

define(['reactPropTypes', 'plugins/classnames/index', 'app/actions/beambox/constant', 'helpers/i18n', 'jsx!views/beambox/Tool-Panels/RowColumn', 'jsx!views/beambox/Tool-Panels/Interval', 'jsx!views/beambox/Tool-Panels/OffsetDir', 'jsx!views/beambox/Tool-Panels/OffsetCorner', 'jsx!views/beambox/Tool-Panels/OffsetDist', 'jsx!views/beambox/Tool-Panels/NestSpacing', 'jsx!views/beambox/Tool-Panels/NestGA', 'jsx!views/beambox/Tool-Panels/NestRotation'], function (PropTypes, ClassNames, Constant, i18n, RowColumnPanel, IntervalPanel, OffsetDirPanel, OffsetCornerPanel, OffsetDistPanel, NestSpacingPanel, NestGAPanel, NestRotationPanel) {
  const React = require('react');

  const LANG = i18n.lang.beambox.tool_panels;

  let _mm2pixel = function (pixel_input) {
    const dpmm = Constant.dpmm;
    return Number(pixel_input * dpmm);
  };

  const validPanelsMap = {
    'unknown': [],
    'gridArray': ['rowColumn', 'distance'],
    'offset': ['offsetDir', 'offsetCorner', 'offsetDist'],
    'nest': ['nestOffset', 'nestRotation', 'nestGA']
  };

  class ToolPanel extends React.Component {
    constructor(props) {
      super(props);
      this._setArrayRowColumn = this._setArrayRowColumn.bind(this);
      this._setArrayDistance = this._setArrayDistance.bind(this);
      this._setOffsetDir = this._setOffsetDir.bind(this);
      this._setOffsetCorner = this._setOffsetCorner.bind(this);
      this._setOffsetDist = this._setOffsetDist.bind(this);
      this.offset = {
        dir: 1,
        // 1 for outward, 0 for inward
        distance: 5,
        cornerType: 'sharp'
      };
      this.nestOptions = {
        spacing: 0,
        generations: 3,
        population: 10,
        rotations: 1
      };
    }

    _setArrayRowColumn(rowcolumn) {
      this.props.data.rowcolumn = rowcolumn;
      let rc = rowcolumn;
      this.setState({
        rowcolumn: rc
      });
    }

    _setArrayDistance(distance) {
      this.props.data.distance = distance;
      let d = distance;
      this.setState({
        distance: d
      });
    }

    _setOffsetDir(dir) {
      this.offset.dir = dir;
    }

    _setOffsetDist(val) {
      this.offset.distance = val;
    }

    _setOffsetCorner(val) {
      this.offset.cornerType = val;
    }

    _renderPanels() {
      const data = this.props.data;
      const validPanels = validPanelsMap[this.props.type] || validPanelsMap['unknown'];
      let panelsToBeRender = [];

      for (let i = 0; i < validPanels.length; ++i) {
        const panelName = validPanels[i];
        let panel;

        switch (panelName) {
          case 'rowColumn':
            panel = /*#__PURE__*/React.createElement(RowColumnPanel, _extends({
              key: panelName
            }, data.rowcolumn, {
              onValueChange: this._setArrayRowColumn
            }));
            break;

          case 'distance':
            panel = /*#__PURE__*/React.createElement(IntervalPanel, _extends({
              key: panelName
            }, data.distance, {
              onValueChange: this._setArrayDistance
            }));
            break;

          case 'offsetDir':
            panel = /*#__PURE__*/React.createElement(OffsetDirPanel, {
              key: panelName,
              dir: this.offset.dir,
              onValueChange: this._setOffsetDir
            });
            break;

          case 'offsetCorner':
            panel = /*#__PURE__*/React.createElement(OffsetCornerPanel, {
              key: panelName,
              cornerType: this.offset.cornerType,
              onValueChange: this._setOffsetCorner
            });
            break;

          case 'offsetDist':
            panel = /*#__PURE__*/React.createElement(OffsetDistPanel, {
              key: panelName,
              distance: this.offset.distance,
              onValueChange: this._setOffsetDist
            });
            break;

          case 'nestOffset':
            panel = /*#__PURE__*/React.createElement(NestSpacingPanel, {
              key: panelName,
              spacing: this.nestOptions.spacing,
              onValueChange: val => {
                this.nestOptions.spacing = val;
              }
            });
            break;

          case 'nestGA':
            panel = /*#__PURE__*/React.createElement(NestGAPanel, {
              key: panelName,
              nestOptions: this.nestOptions,
              updateNestOptions: options => {
                this.nestOptions = { ...this.nestOptions,
                  ...options
                };
              }
            });
            break;

          case 'nestRotation':
            panel = /*#__PURE__*/React.createElement(NestRotationPanel, {
              key: panelName,
              rotations: this.nestOptions.rotations,
              onValueChange: val => {
                this.nestOptions.rotations = val;
              }
            });
            break;
          //case 'button':          panel = <div; break;
        }

        panelsToBeRender.push(panel);
      }

      ;
      return panelsToBeRender;
    }

    _renderTitle() {
      const type = this.props.type;
      const titleMap = {
        'gridArray': LANG.grid_array,
        'offset': LANG.offset
      };
      const title = titleMap[type];
      return /*#__PURE__*/React.createElement("div", {
        className: "tool-panel"
      }, /*#__PURE__*/React.createElement("label", {
        className: "controls accordion"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        className: "accordion-switcher",
        defaultChecked: true
      }), /*#__PURE__*/React.createElement("p", {
        className: "caption"
      }, /*#__PURE__*/React.createElement("span", {
        className: "value"
      }, title))));
    }

    _renderButtons() {
      let _onCancel = () => {
        this.props.unmount();
        svgCanvas.setMode('select');
        $('.tool-btn').removeClass('active');
        $('#left-Cursor').addClass('active');
      };

      let _onYes = () => {
        this.props.unmount();
      };

      const type = this.props.type;

      switch (type) {
        case 'gridArray':
          _onYes = () => {
            let data = this.props.data;
            let distance = {};
            distance.dx = _mm2pixel(data.distance.dx);
            distance.dy = _mm2pixel(data.distance.dy);
            svgCanvas.gridArraySelectedElement(distance, data.rowcolumn);
            this.props.unmount();
            svgCanvas.setMode('select');
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
            svgCanvas.setHasUnsavedChange(true);
          };

          break;

        case 'offset':
          _onYes = () => {
            svgCanvas.offsetElements(this.offset.dir, _mm2pixel(this.offset.distance), this.offset.cornerType);
            this.props.unmount();
            svgCanvas.setMode('select');
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
            svgCanvas.setHasUnsavedChange(true);
          };

          break;

        case 'nest':
          _onYes = () => {
            this.nestOptions.spacing *= 10; //pixel to mm

            svgCanvas.nestElements(null, null, this.nestOptions);
            this.props.unmount();
            svgCanvas.setMode('select');
            $('.tool-btn').removeClass('active');
            $('#left-Cursor').addClass('active');
          };

      }

      return /*#__PURE__*/React.createElement("div", {
        className: "tool-block"
      }, /*#__PURE__*/React.createElement("div", {
        className: "btn-h-group"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default primary",
        onClick: () => {
          _onYes();
        }
      }, LANG.confirm), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        onClick: _onCancel
      }, LANG.cancel)));
    }

    _findPositionStyle() {
      const angle = function () {
        const A = $('#selectorGrip_resize_w').offset();
        const B = $('#selectorGrip_resize_e').offset();
        const dX = B.left - A.left;
        const dY = B.top - A.top;
        const radius = Math.atan2(-dY, dX);
        let degree = radius * (180 / Math.PI);
        if (degree < 0) degree += 360;
        return degree;
      }();

      const positionStyle = {
        position: 'absolute',
        zIndex: 10,
        bottom: 10,
        left: $('.left-toolbar').width()
      };
      return positionStyle;
    }

    render() {
      const lang = localStorage.getItem('active-lang') || 'en';

      const positionStyle = this._findPositionStyle();

      const classes = ClassNames('tool-panels', lang);
      return /*#__PURE__*/React.createElement("div", {
        id: "beamboxToolPanel",
        className: classes,
        style: positionStyle
      }, this._renderTitle(), this._renderPanels(), this._renderButtons());
    }

  }

  ;
  ToolPanel.propTypes = {
    type: PropTypes.oneOf(Object.keys(validPanelsMap)).isRequired,
    data: PropTypes.object.isRequired
  };
  return ToolPanel;
});