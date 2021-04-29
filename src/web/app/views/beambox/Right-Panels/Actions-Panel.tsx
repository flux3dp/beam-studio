import FontFuncs from 'app/actions/beambox/font-funcs';
import Progress from 'app/actions/progress-caller';
import Dialog from 'app/actions/dialog-caller';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import imageEdit from 'helpers/image-edit';
import * as i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => { svgCanvas = globalSVG.Canvas; svgEditor = globalSVG.Editor; });

const React = requireNode('react');
const classNames = requireNode('classnames');
const LANG = i18n.lang.beambox.right_panel.object_panel.actions_panel;

interface IProps {
  elem: HTMLElement,
  dimensionValues: { [key: string]: string },
  updateDimensionValues: (values: { [key: string]: string }) => void,
}

class ActionsPanel extends React.Component<IProps> {
  constructor(props: IProps) {
    super(props);
    this.state = {
    };
  }

  replaceImage = async (): Promise<void> => {
    const { elem } = this.props;
    const { remote } = requireNode('electron');
    const { dialog } = remote;
    const option = {
      properties: ['openFile'] as Array<'openFile'>,
      filters: [
        {
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'bmp', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm'],
        },
      ],
    };
    const { canceled, filePaths } = await dialog.showOpenDialog(option);
    if (!canceled && filePaths && filePaths.length > 0) {
      const filePath = filePaths[0];
      const resp = await fetch(filePath);
      const respBlob = await resp.blob();
      svgEditor.replaceBitmap(respBlob, elem);
    }
  };

  convertToPath = async (): Promise<void> => {
    const { elem, dimensionValues } = this.props;
    Progress.openNonstopProgress({ id: 'convert-font', message: LANG.wait_for_parsing_font });
    const bbox = svgCanvas.calculateTransformedBBox(elem);
    const convertByFluxsvg = BeamboxPreference.read('TextbyFluxsvg') !== false;
    if (svgCanvas.textActions.isEditing) {
      svgCanvas.textActions.toSelectMode();
    }
    svgCanvas.clearSelection();
    if (convertByFluxsvg) {
      await FontFuncs.convertTextToPathFluxsvg($(elem), bbox);
    } else {
      await new Promise((resolve) => {
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
  };

  renderButtons = (
    label: string, onClick: () => void, isFullLine?: boolean, isDisabled?: boolean,
  ): Element => {
    const className = classNames('btn', 'btn-default', { disabled: isDisabled });
    return (
      <div className={classNames('btn-container', { full: isFullLine, half: !isFullLine })} onClick={() => onClick()} key={label}>
        <button type="button" className={className}>{label}</button>
      </div>
    );
  };

  renderImageActions = (): Element[] => {
    const { elem } = this.props;
    const isShading = elem.getAttribute('data-shading') === 'true';
    const content = [
      this.renderButtons(LANG.replace_with, () => this.replaceImage(), true),
      this.renderButtons(LANG.trace, () => svgCanvas.imageToSVG(), false, isShading),
      this.renderButtons(LANG.grading, () => Dialog.showPhotoEditPanel('curve'), false),
      this.renderButtons(LANG.sharpen, () => Dialog.showPhotoEditPanel('sharpen'), false),
      this.renderButtons(LANG.crop, () => Dialog.showPhotoEditPanel('crop'), false),
      this.renderButtons(LANG.bevel, () => imageEdit.generateStampBevel(elem), false),
      this.renderButtons(LANG.invert, () => imageEdit.colorInvert(elem), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderTextActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.convert_to_path, this.convertToPath, true),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderPathActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.decompose_path, () => svgCanvas.decomposePath(), true),
      this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderRectActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderEllipseActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderPolygonActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderLineActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderUseActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.disassemble_use, () => svgCanvas.disassembleUse2Group(), false),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderGroupActions = (): Element[] => {
    const content = [
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  renderMultiSelectActions = (): Element[] => {
    const { elem } = this.props;
    const childs: HTMLElement[] = Array.from(elem.childNodes);
    const supportOffset = childs.every((child) => !['g', 'text', 'image', 'use'].includes(child.tagName));
    const content = [
      this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false, !supportOffset),
      this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false),
    ];
    return content;
  };

  render(): Element {
    const { elem } = this.props;
    const isMultiSelect = elem && elem.tagName === 'g' && elem.getAttribute('data-tempgroup') === 'true';
    let content = null;
    if (elem) {
      const { tagName } = elem;
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
        <div className="title">ACTIONS</div>
        <div className="btns-container">
          {content}
        </div>
      </div>
    );
  }
}

export default ActionsPanel;
