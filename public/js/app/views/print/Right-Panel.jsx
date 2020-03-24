define([
    'jquery',
    'reactClassset',
    'reactPropTypes',
    'app/actions/perspective-camera',
    'jsx!widgets/Button-Group',
    'app/actions/alert-actions',
    'app/stores/alert-store',
    'helpers/duration-formatter'
], function($, ReactCx, PropTypes, PerspectiveCamera, ButtonGroup, AlertActions, AlertStore, DurationFormatter) {
    const React = require('react');

    class RightPanel extends React.Component{

        componentDidMount() {
            PerspectiveCamera.init(this);
        }

        componentWillReceiveProps(nextProps) {
            if(nextProps.updateCamera === true) {
                PerspectiveCamera.setCameraPosition(nextProps.camera);
            }
        }

        _handleTest = () => {
            AlertActions.showInfo('hello');
            AlertActions.showWarning('warning');
            AlertActions.showError('error');
        }

        _handleRetry = (id) => {
            console.log('sending retry with ID:' + id);
        }

        _handleAnswer = (id, isYes) => {
            console.log(id, isYes);
        }

        _handleGeneric = (id, message) => {
            console.log(id, message);
        }

        _handleGetFCode = () => {
            this.props.onDownloadFCode();
        }

        _handleGo = (e) => {
            e.preventDefault();
            this.props.onGoClick();
        }

        _handleGetGCode = () => {
            this.props.onDownloadGCode();
        }

        _updateCamera = (position, rotation) => {
            this.props.onCameraPositionChange(position, rotation);
        }

        _renderActionButtons = (lang) => {
            let { hasObject, hasOutOfBoundsObject, disableGoButtons } = this.props,
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
                }
                ];

            return (
                <ButtonGroup buttons={buttons} className="beehive-buttons action-buttons"/>
            );
        }

        _renderTimeAndCost = (lang) => {
            let { slicingStatus, slicingPercentage, hasObject, hasOutOfBoundsObject } = this.props;
            if(slicingStatus && hasObject && !hasOutOfBoundsObject && slicingPercentage === 1) {
                if(!slicingStatus.filament_length) {
                    return '';
                }
                else {
                    return (
                        <div className="preview-time-cost">
                            {Math.round(slicingStatus.filament_length * 0.03) /10}
                            {lang.print.gram} / {DurationFormatter(slicingStatus.time).split(' ').join('')}
                        </div>
                    );
                }
            }
            else {
                return '';
            }
        }

        render() {
            var lang            = this.props.lang,
                actionButtons   = this._renderActionButtons(lang),
                previewTimeAndCost = this._renderTimeAndCost(lang);

            return (
                <div className='rightPanel'>
                    <div id="cameraViewController" className="cameraViewController"></div>
                    {previewTimeAndCost}
                    {actionButtons}
                </div>
            );
        }
    };

    RightPanel.propTypes = {
        lang                    : PropTypes.object,
        hasObject               : PropTypes.bool,
        hasOutOfBoundsObject    : PropTypes.bool,
        onDownloadGCode         : PropTypes.func,
        onDownloadFCode         : PropTypes.func,
        onGoClick               : PropTypes.func,
        onCameraPositionChange  : PropTypes.func,
    };

    return RightPanel;
});
