define([
    'reactPropTypes',
    'reactClassset'
], function(PropTypes, ReactCx) {
    'use strict';
    const React = require('react');

    class ProgressBar extends React.Component{
        constructor(props) {
            super(props);
            this.ESTIMATED_STEP = 10;
            this.state = {
                stop: false
            };
        }

        _paddingZero = (str, len) => {
            var zero = new Array(len + 1),
                afterPadding = zero.join(0) + str;

            return afterPadding.substr(-1 * len);
        }

        _formatSecondToTime = (seconds) => {
            var minutes = parseInt(seconds / 60, 10),
                seconds = seconds % 60;

            return this._paddingZero(minutes, 2) + 'm' + this._paddingZero(seconds, 2) + 's';
        }

        _onStop = () => {
            var self = this;

            self.props.onStop();

            self.setState({
                stop: true
            }, function() {
                self.setState(self.getInitialState());
            });
        }

        _renderProgress = () => {
            var self = this,
                lang = self.props.lang,
                estimatedTime = self.props.remainingTime,
                textRemainingTime = (
                    self.ESTIMATED_STEP < self.props.currentSteps ?
                    lang.scan.remaining_time :
                    ''
                ),
                stopButtonClasses = ReactCx.cx({
                    'btn': true,
                    'btn-hexagon': true,
                    'btn-stop-scan': true,
                    'btn-disabled': (0 === self.props.percentage),
                });

            return (
                <div className="progress-status">
                    <span className="progress-text">{self.props.percentage}%,</span>
                    <span className="progress-text">{estimatedTime}</span>
                    <span className="progress-text">{textRemainingTime}</span>
                    <button className={stopButtonClasses} data-ga-event="stop-scan" onClick={this._onStop}>{lang.scan.stop_scan}</button>
                </div>
            );
        }

        _renderFinish = () => {
            var lang = this.props.lang;

            return (
                <p>
                    <span className="amination-breath">{lang.scan.processing}</span>
                </p>
            );
        }

        render() {
            var lang = this.props.lang,
                isFinish = (100 <= this.props.percentage),
                className = {
                    'scan-progress': true,
                    'hide': true === this.state.stop
                },
                content = (
                    true === isFinish ?
                    this._renderFinish() :
                    this._renderProgress()
                );

            return (
                <div className={ReactCx.cx(className)}>
                    {content}
                </div>
            );
        }

    };

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
        onStop: function() {}
    };

    return ProgressBar;
});
