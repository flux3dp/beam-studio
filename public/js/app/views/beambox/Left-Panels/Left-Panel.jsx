define([
    'jsx!app/actions/beambox/Image-Trace-Panel-Controller',
    'app/actions/beambox',
    'app/actions/beambox/svgeditor-function-wrapper',
    'app/actions/beambox/preview-mode-background-drawer',
    'app/actions/beambox/preview-mode-controller',
    'app/actions/global-actions',
    'app/stores/beambox-store',
    'helpers/api/inter-process',
    'helpers/i18n'
], function(
    ImageTracePanelController,
    BeamboxActions,
    FnWrapper,
    PreviewModeBackgroundDrawer,
    PreviewModeController,
    GlobalActions,
    BeamboxStore,
    InterProcessApi,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');

    const LANG = i18n.lang.beambox.left_panel;
    const interProcessWebSocket = InterProcessApi() ;
    const isWin = process.platform === 'win32';

    class LeftPanel extends React.Component {
        constructor() {
            super();
            this.state = {};
        }

        componentDidMount() {
            // Selection Management

            $('#layerpanel').mouseup(() => {
                FnWrapper.clearSelection();
            });

            $('#layer-laser-panel-placeholder').mouseup(() => {
                FnWrapper.clearSelection();
            });

            // Add class color to #svg_editor
            $('#svg_editor').addClass('color');
        }

        componentWillUnmount() {
            $('#svg_editor').removeClass('color');
        }

        clearPreview = () => {
            if (!PreviewModeBackgroundDrawer.isClean()) {
                PreviewModeBackgroundDrawer.resetCoordinates();
                PreviewModeBackgroundDrawer.clear();
            }
            $('#left-Shoot').addClass('active');
            this.setState(this.state);
        }

        startImageTrace = () => {
            if (!document.getElementById('image-trace-panel-outer')) {
                ImageTracePanelController.render();
            }
            this.props.endPreviewMode();
            svgCanvas.clearSelection();
            BeamboxActions.showCropper();
            $('#left-Cursor').addClass('active');
        }

        _renderToolButton(iconName, id, label, onClick, className, disabled) {
            const cx = classNames('tool-btn', className, {disabled});
            const { isPreviewing } = this.props;
            const setActiveAndOnClick = () => {
                if (disabled) {
                    return;
                }
                if (!isPreviewing) {
                    $('.tool-btn').removeClass('active');
                    $(`#left-${id}`).addClass('active');
                }
                onClick();
            }
            return (
                <div id={`left-${id}`} className={cx} title={label} onClick={setActiveAndOnClick}>
                    <img src={`img/left-bar/icon-${iconName}.svg`} draggable="false"/>
                </div>
            );
        }

        render() {
            const { isPreviewing } = this.props;
            const leftPanelClass = classNames('left-toolbar', {win: isWin});
            if (!isPreviewing) {
                return (
                    <div className={leftPanelClass}>
                        {this._renderToolButton('cursor','Cursor', LANG.label.cursor, FnWrapper.useSelectTool, 'active')}
                        {this._renderToolButton('photo','Photo', LANG.label.photo, FnWrapper.importImage)}
                        {this._renderToolButton('text','Text', LANG.label.text, FnWrapper.insertText)}
                        {this._renderToolButton('rect','Rectangle', LANG.label.rect, FnWrapper.insertRectangle)}
                        {this._renderToolButton('oval','Ellipse', LANG.label.oval, FnWrapper.insertEllipse)}
                        {this._renderToolButton('polygon','Polygon', LANG.label.polygon, FnWrapper.insertPolygon)}
                        {this._renderToolButton('line','Line', LANG.label.line, FnWrapper.insertLine)}
                        {this._renderToolButton('draw','Pen', LANG.label.pen, FnWrapper.insertPath)}
                    </div>
                );
            } else {
                const isDrawing = PreviewModeController.isDrawing;
                const isDrawn = !PreviewModeBackgroundDrawer.isClean();
                return (
                    <div className={leftPanelClass}>
                        {this._renderToolButton('shoot', 'Shoot', LANG.label.preview, () => {
                            if (!PreviewModeController.isPreviewMode()) {
                                this.props.setShouldStartPreviewController(true)
                            }
                        }, 'active')}
                        {this._renderToolButton('trace', 'Trace', LANG.label.trace, () => this.startImageTrace(), '', isDrawing || !isDrawn)}
                        {this._renderToolButton('trash', 'Trash', LANG.label.clear_preview, () => {this.clearPreview()}, '', isDrawing || !isDrawn)}
                    </div>
                );
            }
        }
    } 

    return LeftPanel;
});
