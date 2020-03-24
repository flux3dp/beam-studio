
/* eslint-disable react/no-multi-comp */
define([
    'jquery',
    'reactPropTypes',
    'helpers/i18n',
    'jsx!app/actions/beambox/Image-Trace-Panel-Controller',
    'app/actions/beambox',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/preview-mode-background-drawer',
    'app/actions/beambox/preview-mode-controller',
    'app/stores/beambox-store',
    'plugins/classnames/index',
    'helpers/api/image-tracer',
], function(
    $,
    PropTypes,
    i18n,
    ImageTracePanelController,
    BeamboxActions,
    BeamboxPreference,
    PreviewModeBackgroundDrawer,
    PreviewModeController,
    BeamboxStore,
    classNames,
    ImageTracerApi
) {
    const React = require('react');
    const LANG = i18n.lang.beambox.left_panel;

    class ImageTraceButton extends React.Component {
        constructor(props) {
            super(props);
        }

        _handleClick() {
            this.props.onClick();
            BeamboxActions.showCropper();
        }

        _renderButton() {
            return (
                <div
                    className='option preview-btn'
                    onClick={() => this._handleClick()}
                >
                    {LANG.image_trace}
                </div>
            );
        }

        render() {
            const active = this.props.active && !(PreviewModeBackgroundDrawer.isClean());
            const borderless = BeamboxPreference.read('borderless') || false; 
            return (
                <div
                    id='image-trace-button'
                    className={classNames({'active': active}, {'hide': !this.props.show}, {'borderless': borderless})}
                    onClick={() => this._handleClick()}
                >
                    <div className={'text'}>{LANG.image_trace}</div>
                </div>
            );
        }
    };
    return ImageTraceButton;
});
