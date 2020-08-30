
/* eslint-disable react/no-multi-comp */
import $ from 'jquery'
import * as i18n from '../../../../helpers/i18n'
import ImageTracePanelController from '../../../actions/beambox/Image-Trace-Panel-Controller'
import BeamboxActions from '../../../actions/beambox'
import BeamboxPreference from '../../../actions/beambox/beambox-preference'
import PreviewModeBackgroundDrawer from '../../../actions/beambox/preview-mode-background-drawer'
import PreviewModeController from '../../../actions/beambox/preview-mode-controller'
import BeamboxStore from '../../../stores/beambox-store'
import ImageTracerApi from '../../../../helpers/api/image-tracer'
const classNames = requireNode('classnames')

    const React = requireNode('react');;
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
            if (!this.props.show) {
                return null;
            }
            return (
                <div
                    id='image-trace-button'
                    className={classNames({'active': active}, 'preview-control-button')}
                    onClick={() => this._handleClick()}
                >
                    <div className={'text'}>{LANG.image_trace}</div>
                </div>
            );
        }
    };
    export default ImageTraceButton;