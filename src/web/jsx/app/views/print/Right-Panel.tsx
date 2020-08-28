function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactClassset', 'reactPropTypes', 'app/actions/perspective-camera', 'jsx!widgets/Button-Group', 'app/actions/alert-actions', 'app/stores/alert-store', 'helpers/duration-formatter'], function ($, ReactCx, PropTypes, PerspectiveCamera, ButtonGroup, AlertActions, AlertStore, DurationFormatter) {
  const React = require('react');

  class RightPanel extends React.Component {
    constructor(...args) {
      super(...args);

      _defineProperty(this, "_handleTest", () => {
        AlertActions.showInfo('hello');
        AlertActions.showWarning('warning');
        AlertActions.showError('error');
      });

      _defineProperty(this, "_handleRetry", id => {
        console.log('sending retry with ID:' + id);
      });

      _defineProperty(this, "_handleAnswer", (id, isYes) => {
        console.log(id, isYes);
      });

      _defineProperty(this, "_handleGeneric", (id, message) => {
        console.log(id, message);
      });

      _defineProperty(this, "_handleGetFCode", () => {
        this.props.onDownloadFCode();
      });

      _defineProperty(this, "_handleGo", e => {
        e.preventDefault();
        this.props.onGoClick();
      });

      _defineProperty(this, "_handleGetGCode", () => {
        this.props.onDownloadGCode();
      });

      _defineProperty(this, "_updateCamera", (position, rotation) => {
        this.props.onCameraPositionChange(position, rotation);
      });

      _defineProperty(this, "_renderActionButtons", lang => {
        let {
          hasObject,
          hasOutOfBoundsObject,
          disableGoButtons
        } = this.props,
            buttons = [{
          label: lang.monitor.start,
          className: ReactCx.cx({
            'btn-disabled': !hasObject || hasOutOfBoundsObject || disableGoButtons,
            'btn-default': true,
            'btn-hexagon': true,
            'btn-go': true
          }),
          title: lang.print.goTitle,
          dataAttrs: {
            'ga-event': 'print-goto-monitor'
          },
          onClick: this._handleGo
        }];
        return /*#__PURE__*/React.createElement(ButtonGroup, {
          buttons: buttons,
          className: "beehive-buttons action-buttons"
        });
      });

      _defineProperty(this, "_renderTimeAndCost", lang => {
        let {
          slicingStatus,
          slicingPercentage,
          hasObject,
          hasOutOfBoundsObject
        } = this.props;

        if (slicingStatus && hasObject && !hasOutOfBoundsObject && slicingPercentage === 1) {
          if (!slicingStatus.filament_length) {
            return '';
          } else {
            return /*#__PURE__*/React.createElement("div", {
              className: "preview-time-cost"
            }, Math.round(slicingStatus.filament_length * 0.03) / 10, lang.print.gram, " / ", DurationFormatter(slicingStatus.time).split(' ').join(''));
          }
        } else {
          return '';
        }
      });
    }

    componentDidMount() {
      PerspectiveCamera.init(this);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (nextProps.updateCamera === true) {
        PerspectiveCamera.setCameraPosition(nextProps.camera);
      }
    }

    render() {
      var lang = this.props.lang,
          actionButtons = this._renderActionButtons(lang),
          previewTimeAndCost = this._renderTimeAndCost(lang);

      return /*#__PURE__*/React.createElement("div", {
        className: "rightPanel"
      }, /*#__PURE__*/React.createElement("div", {
        id: "cameraViewController",
        className: "cameraViewController"
      }), previewTimeAndCost, actionButtons);
    }

  }

  ;
  RightPanel.propTypes = {
    lang: PropTypes.object,
    hasObject: PropTypes.bool,
    hasOutOfBoundsObject: PropTypes.bool,
    onDownloadGCode: PropTypes.func,
    onDownloadFCode: PropTypes.func,
    onGoClick: PropTypes.func,
    onCameraPositionChange: PropTypes.func
  };
  return RightPanel;
});