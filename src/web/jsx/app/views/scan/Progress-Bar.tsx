function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'reactClassset'], function (PropTypes, ReactCx) {
  'use strict';

  const React = require('react');

  class ProgressBar extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_paddingZero", (str, len) => {
        var zero = new Array(len + 1),
            afterPadding = zero.join(0) + str;
        return afterPadding.substr(-1 * len);
      });

      _defineProperty(this, "_formatSecondToTime", seconds => {
        var minutes = parseInt(seconds / 60, 10),
            seconds = seconds % 60;
        return this._paddingZero(minutes, 2) + 'm' + this._paddingZero(seconds, 2) + 's';
      });

      _defineProperty(this, "_onStop", () => {
        var self = this;
        self.props.onStop();
        self.setState({
          stop: true
        }, function () {
          self.setState(self.getInitialState());
        });
      });

      _defineProperty(this, "_renderProgress", () => {
        var self = this,
            lang = self.props.lang,
            estimatedTime = self.props.remainingTime,
            textRemainingTime = self.ESTIMATED_STEP < self.props.currentSteps ? lang.scan.remaining_time : '',
            stopButtonClasses = ReactCx.cx({
          'btn': true,
          'btn-hexagon': true,
          'btn-stop-scan': true,
          'btn-disabled': 0 === self.props.percentage
        });
        return /*#__PURE__*/React.createElement("div", {
          className: "progress-status"
        }, /*#__PURE__*/React.createElement("span", {
          className: "progress-text"
        }, self.props.percentage, "%,"), /*#__PURE__*/React.createElement("span", {
          className: "progress-text"
        }, estimatedTime), /*#__PURE__*/React.createElement("span", {
          className: "progress-text"
        }, textRemainingTime), /*#__PURE__*/React.createElement("button", {
          className: stopButtonClasses,
          "data-ga-event": "stop-scan",
          onClick: this._onStop
        }, lang.scan.stop_scan));
      });

      _defineProperty(this, "_renderFinish", () => {
        var lang = this.props.lang;
        return /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
          className: "amination-breath"
        }, lang.scan.processing));
      });

      this.ESTIMATED_STEP = 10;
      this.state = {
        stop: false
      };
    }

    render() {
      var lang = this.props.lang,
          isFinish = 100 <= this.props.percentage,
          className = {
        'scan-progress': true,
        'hide': true === this.state.stop
      },
          content = true === isFinish ? this._renderFinish() : this._renderProgress();
      return /*#__PURE__*/React.createElement("div", {
        className: ReactCx.cx(className)
      }, content);
    }

  }

  ;
  ProgressBar.propTypes = {
    lang: PropTypes.object,
    percentage: PropTypes.number,
    remainingTime: PropTypes.number,
    currentSteps: PropTypes.number,
    onStop: PropTypes.func
  };
  ProgressBar.defaultProps = {
    lang: {},
    percentage: 0,
    remainingTime: 0,
    currentSteps: 0,
    onStop: function () {}
  };
  return ProgressBar;
});