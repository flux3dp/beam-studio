import BeamboxActions from '../../../actions/beambox'
import PreviewModeBackgroundDrawer from '../../../actions/beambox/preview-mode-background-drawer'
    const rootId = 'clear-preview-graffiti-button-placeholder';

    class ClearPreviewGraffitiButton {
        onClick: () => void;
        constructor() {
            this.onClick = () => {
                console.error('should init by preview-mode-controller');
            };
        }

        init(onClick) {
            this.onClick = onClick;
        }

        activate(endPreviewMode) {
            $(`#${rootId}`).addClass('active');
            $(`#${rootId}`).removeClass('hide');
            $('.svg-nest-buttons').addClass('previewing');
            const onClick= () => {
                if(!PreviewModeBackgroundDrawer.isClean()) {
                    PreviewModeBackgroundDrawer.resetCoordinates();
                    this.onClick();
                    BeamboxActions.clearCameraCanvas();
                }
                endPreviewMode();
                this.hide();
            }
            $(`#${rootId}`).bind('click', onClick);
        }

        deactivate() {
            $(`#${rootId}`).removeClass('active');
        }

        hide() {
            $('.svg-nest-buttons').removeClass('previewing');
            $(`#${rootId}`).addClass('hide');
        }
        
    };
    export default new ClearPreviewGraffitiButton();
