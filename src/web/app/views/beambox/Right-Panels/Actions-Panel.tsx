import FnWrapper from '../../../actions/beambox/svgeditor-function-wrapper';
import FontFuncs from '../../../actions/beambox/font-funcs';
import Progress from '../../../actions/progress-caller';
import Dialog from '../../../actions/dialog-caller';
import Constant from '../../../actions/beambox/constant';
import BeamboxPreference from '../../../actions/beambox/beambox-preference';
import * as i18n from '../../../../helpers/i18n';
import { getSVGAsync } from '../../../../helpers/svg-editor-helper';
let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.object_panel.actions_panel;

class ActionsPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    replaceImage = async () => {
        const { elem } = this.props;
        const { remote } = requireNode('electron');
        const { dialog } = remote;
        const option = {
            properties: ['openFile'] as Array<'openFile'>,
            filters: [
                { 
                    name: 'Images', 
                    extensions: ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'bmp', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm']
                },
            ]
        }
        let { canceled, filePaths } = await dialog.showOpenDialog(option);
        if (!canceled && filePaths && filePaths.length > 0) {
            const filePath = filePaths[0];
            const resp = await fetch(filePath);
            const respBlob = await resp.blob();
            svgEditor.replaceBitmap(respBlob, elem);
        }
    }

    convertToPath = async () => {
        const { elem, dimensionValues } = this.props;
        Progress.openNonstopProgress({id: 'convert-font', message: LANG.wait_for_parsing_font});
        const bbox = svgCanvas.calculateTransformedBBox(elem);
        const convertByFluxsvg = BeamboxPreference.read('TextbyFluxsvg') !== false;
        if (svgCanvas.textActions.isEditing) {
            svgCanvas.textActions.toSelectMode();
        }
        svgCanvas.clearSelection();
        if (convertByFluxsvg) {
            await FontFuncs.convertTextToPathFluxsvg($(elem), bbox);
        } else {
            await new Promise(resolve => {
                setTimeout(async () => {
                    await FontFuncs.requestToConvertTextToPath($(elem), {
                        family: elem.getAttribute('font-family'),
                        weight: elem.getAttribute('font-weight'),
                        style: dimensionValues.fontStyle,
                    });
                    resolve(null);
                }, 50);
            });
        }
        Progress.popById('convert-font');
    }

    renderButtons = (label: string, onClick: Function, isFullLine?: boolean, isDisabled?: boolean) => {
        const className = classNames('btn', 'btn-default', {'disabled': isDisabled});
        return (
            <div className={classNames('btn-container', {'full': isFullLine, 'half': !isFullLine})} onClick={() => {onClick()}} key={label}>
                <button className={className}>{label}</button>
            </div>
        );
    }

    renderImageActions = () => {
        const { elem } = this.props;
        const isShading = elem.getAttribute('data-shading') === 'true';
        let content = [];
        content.push(this.renderButtons(LANG.replace_with, () => this.replaceImage(), true));
        content.push(this.renderButtons(LANG.trace, () => svgCanvas.imageToSVG(), false, isShading));
        content.push(this.renderButtons(LANG.grading, () => Dialog.showPhotoEditPanel('curve'), false));
        content.push(this.renderButtons(LANG.sharpen, () => Dialog.showPhotoEditPanel('sharpen'), false));
        content.push(this.renderButtons(LANG.crop, () => Dialog.showPhotoEditPanel('crop'), false));
        content.push(this.renderButtons(LANG.bevel, () => Dialog.showPhotoEditPanel('stamp'), false));
        content.push(this.renderButtons(LANG.invert, () => Dialog.showPhotoEditPanel('invert'), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderTextActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.convert_to_path, this.convertToPath, true));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderPathActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.decompose_path, () => svgCanvas.decomposePath(), true));
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderRectActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderEllipseActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderPolygonActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderLineActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderUseActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.disassemble_use, () => svgCanvas.disassembleUse2Group(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderGroupActions = () => {
        let content = [];
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    renderMultiSelectActions = () => {
        const { elem } = this.props;
        const childs: HTMLElement[] = Array.from(elem.childNodes);
        const supportOffset = childs.every((child) => {return !['g', 'text', 'image', 'use'].includes(child.tagName)});
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false, !supportOffset));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
    }

    render() {
        const { elem } = this.props;
        const isMultiSelect = elem.tagName === 'g' && elem.getAttribute('data-tempgroup') === 'true';
        let content = [];
        if (elem) {
            const tagName = elem.tagName;
            if (tagName === 'image') {
                content = this.renderImageActions();
            } else if (tagName === 'text') {
                content = this.renderTextActions();
            } else if (tagName === 'path') {
                content = this.renderPathActions();
            } else if (tagName === 'rect') {
                content = this.renderRectActions();
            } else if (tagName === 'ellipse') {
                content = this.renderEllipseActions();
            } else if (tagName === 'polygon') {
                content = this.renderPolygonActions();
            } else if (tagName === 'line') {
                content = this.renderLineActions();
            } else if (tagName === 'use') {
                content = this.renderUseActions();
            } else if (tagName === 'g') {
                if (isMultiSelect) {
                    content = this.renderMultiSelectActions();
                } else {
                    content = this.renderGroupActions();
                }
            }
        }
        return (
            <div className="actions-panel">
                <div className="title">{'ACTIONS'}</div>
                <div className="btns-container">
                    {content}
                </div>
            </div>
        );
    }
}

export default ActionsPanel;
