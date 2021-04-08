import ImageTracePanelController from 'app/actions/beambox/Image-Trace-Panel-Controller';
import BeamboxActions from 'app/actions/beambox';
import alert from 'app/actions/alert-caller';
import dialog from 'app/actions/dialog-caller';
import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import alertConstants from 'app/constants/alert-constants';
import alertConfig from 'helpers/api/alert-config';
import InterProcessApi from 'helpers/api/inter-process';
import { getCurrentUser } from 'helpers/api/flux-id';
import shortcuts from 'helpers/shortcuts';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
const React = requireNode('react');
const classNames = requireNode('classnames');
const electron = requireNode('electron');

const LANG = i18n.lang.beambox.left_panel;
const interProcessWebSocket = InterProcessApi();
const isWin = process.platform === 'win32';

class LeftPanel extends React.Component {
    constructor() {
        super();
        this.state = {};
        this.leftPanelClass = classNames('left-toolbar', { win: isWin });
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

        shortcuts.on(['v'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.useSelectTool();
            }
        });

        shortcuts.on(['i'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.importImage();
            }
        });

        shortcuts.on(['t'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.insertText();
            }
        });

        shortcuts.on(['m'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.insertRectangle();
            }
        });

        shortcuts.on(['l'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.insertEllipse();
            }
        });

        shortcuts.on(['\\'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.insertLine();
            }
        });

        shortcuts.on(['p'], () => {
            if (!this.props.isPreviewing) {
                FnWrapper.insertPath();
            }
        });
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

    renderToolButton(iconName: string, id?, label?: string, onClick?, className?, disabled?: boolean) {
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

    renderNpButton() {
        return null;
        const { user } = this.props;
        const signup_url = i18n.lang.flux_id_login.signup_url;
        return this.renderToolButton('np', 'Icons', LANG.label.shapes, () => {
            if (user) {
                dialog.showNounProjectPanel();
                return;
            }
            alert.popUp({
                message: i18n.lang.noun_project_panel.login_first,
                children: (
                    <div className='hyper-link' onClick={() => electron.remote.shell.openExternal(signup_url)}>
                        {i18n.lang.flux_id_login.new_to_flux}
                    </div>
                ),
                buttonLabels: [i18n.lang.flux_id_login.login, i18n.lang.flux_id_login.offline],
                primaryButtonIndex: 0,
                callbacks: [
                    () => dialog.showLoginDialog(() => {
                        if (!alertConfig.read('skip-np-dialog-box')) {
                            if (getCurrentUser()) {
                                dialog.showDialogBox('login-np', {
                                    position: { left: 52, top: 413 },
                                }, i18n.lang.noun_project_panel.enjoy_shape_library);
                                alertConfig.write('skip-np-dialog-box', true);
                            }
                        }
                    }),
                    () => {}
                ],
            });
        });
    }

    render() {
        const { isPreviewing } = this.props;
        if (!isPreviewing) {
            return (
                <div className={this.leftPanelClass}>
                    {this.renderToolButton('cursor', 'Cursor', LANG.label.cursor + ' (V)', FnWrapper.useSelectTool, 'active')}
                    {this.renderToolButton('photo', 'Photo', LANG.label.photo + ' (I)', FnWrapper.importImage)}
                    {this.renderToolButton('text', 'Text', LANG.label.text + ' (T)', FnWrapper.insertText)}
                    {this.renderToolButton('rect', 'Rectangle', LANG.label.rect + ' (M)', FnWrapper.insertRectangle)}
                    {this.renderToolButton('oval', 'Ellipse', LANG.label.oval + ' (L)', FnWrapper.insertEllipse)}
                    {this.renderToolButton('polygon', 'Polygon', LANG.label.polygon, FnWrapper.insertPolygon)}
                    {this.renderToolButton('line', 'Line', LANG.label.line + ' (\\)', FnWrapper.insertLine)}
                    {this.renderToolButton('draw', 'Pen', LANG.label.pen + ' (P)', FnWrapper.insertPath)}
                    {/* {this.renderNpButton()} */}
                </div>
            );
        } else {
            const isDrawing = PreviewModeController.isDrawing;
            const isDrawn = !PreviewModeBackgroundDrawer.isClean();
            return (
                <div className={this.leftPanelClass}>
                    {this.renderToolButton('back', 'Exit-Preview', LANG.label.end_preview, this.props.endPreviewMode)}
                    {this.renderToolButton('shoot', 'Shoot', LANG.label.preview, () => {
                        if (!PreviewModeController.isPreviewMode()) {
                            this.props.setShouldStartPreviewController(true)
                        }
                    }, 'active')}
                    {this.renderToolButton('trace', 'Trace', LANG.label.trace, this.startImageTrace, '', isDrawing || !isDrawn)}
                    {this.renderToolButton('trash', 'Trash', LANG.label.clear_preview, this.clearPreview, '', isDrawing || !isDrawn)}
                </div>
            );
        }
    }
} 

export default LeftPanel;
