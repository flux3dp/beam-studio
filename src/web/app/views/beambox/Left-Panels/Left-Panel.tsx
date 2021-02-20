import ImageTracePanelController from '../../../actions/beambox/Image-Trace-Panel-Controller';
import BeamboxActions from '../../../actions/beambox';
import DialogCaller from '../../../contexts/DialogCaller';
import FnWrapper from '../../../actions/beambox/svgeditor-function-wrapper';
import PreviewModeBackgroundDrawer from '../../../actions/beambox/preview-mode-background-drawer';
import PreviewModeController from '../../../actions/beambox/preview-mode-controller';
import InterProcessApi from '../../../../helpers/api/inter-process';
import shortcuts from '../../../../helpers/shortcuts';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });
const React = requireNode('react');
const classNames = requireNode('classnames');

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

    _renderToolButton(iconName: string, id?, label?: string, onClick?, className?, disabled?: boolean) {
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

        if (!isPreviewing) {
            return (
                <div className={this.leftPanelClass}>
                    {this._renderToolButton('cursor', 'Cursor', LANG.label.cursor + ' (V)', FnWrapper.useSelectTool, 'active')}
                    {this._renderToolButton('photo', 'Photo', LANG.label.photo + ' (I)', FnWrapper.importImage)}
                    {this._renderToolButton('text', 'Text', LANG.label.text + ' (T)', FnWrapper.insertText)}
                    {this._renderToolButton('rect', 'Rectangle', LANG.label.rect + ' (M)', FnWrapper.insertRectangle)}
                    {this._renderToolButton('oval', 'Ellipse', LANG.label.oval + ' (L)', FnWrapper.insertEllipse)}
                    {this._renderToolButton('polygon', 'Polygon', LANG.label.polygon, FnWrapper.insertPolygon)}
                    {this._renderToolButton('line', 'Line', LANG.label.line + ' (\\)', FnWrapper.insertLine)}
                    {this._renderToolButton('draw', 'Pen', LANG.label.pen + ' (P)', FnWrapper.insertPath)}
                    {this._renderToolButton('np', 'Icons', 'Open Shape Library', DialogCaller.showNounProjectPanel)}
                </div>
            );
        } else {
            const isDrawing = PreviewModeController.isDrawing;
            const isDrawn = !PreviewModeBackgroundDrawer.isClean();
            return (
                <div className={this.leftPanelClass}>
                    {this._renderToolButton('back', 'Exit-Preview', LANG.label.end_preview, this.props.endPreviewMode)}
                    {this._renderToolButton('shoot', 'Shoot', LANG.label.preview, () => {
                        if (!PreviewModeController.isPreviewMode()) {
                            this.props.setShouldStartPreviewController(true)
                        }
                    }, 'active')}
                    {this._renderToolButton('trace', 'Trace', LANG.label.trace, this.startImageTrace, '', isDrawing || !isDrawn)}
                    {this._renderToolButton('trash', 'Trash', LANG.label.clear_preview, this.clearPreview, '', isDrawing || !isDrawn)}
                </div>
            );
        }
    }
} 

export default LeftPanel;
