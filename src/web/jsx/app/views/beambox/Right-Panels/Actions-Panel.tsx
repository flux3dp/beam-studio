function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['app/actions/beambox/svgeditor-function-wrapper', 'app/actions/beambox/font-funcs', 'app/contexts/ProgressCaller', 'jsx!contexts/DialogCaller', 'app/contexts/AlertCaller', 'app/constants/alert-constants', 'app/actions/beambox/constant', 'app/actions/beambox/beambox-preference', 'helpers/i18n'], function (FnWrapper, FontFuncs, Progress, DialogCaller, Alert, AlertConstants, Constant, BeamboxPreference, i18n) {
  const React = require('react');

  const classNames = require('classnames');

  const LANG = i18n.lang.beambox.right_panel.object_panel.actions_panel;

  class ActionsPanel extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "replaceImage", async () => {
        const {
          elem
        } = this.props;

        const {
          remote
        } = require('electron');

        const {
          dialog
        } = remote;
        const option = {
          properties: ['openFile'],
          filters: [{
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'bmp', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm']
          }]
        };
        let res = await dialog.showOpenDialog(option);

        if (res && res.length > 0) {
          const filePath = res[0];
          res = await fetch(filePath);
          res = await res.blob();
          svgEditor.replaceBitmap(res, elem);
        }
      });

      _defineProperty(this, "convertToPath", async () => {
        const {
          elem,
          dimensionValues
        } = this.props;
        Progress.openNonstopProgress({
          id: 'convert-font',
          message: LANG.wait_for_parsing_font
        });
        const bbox = svgCanvas.calculateTransformedBBox(elem);
        const convertByFluxsvg = BeamboxPreference.read('TextbyFluxsvg') !== false;

        if (convertByFluxsvg) {
          await FontFuncs.convertTextToPathFluxsvg($(elem), bbox);
        } else {
          await new Promise(resolve => {
            setTimeout(async () => {
              await FontFuncs.requestToConvertTextToPath($(elem), {
                family: elem.getAttribute('font-family'),
                weight: elem.getAttribute('font-weight'),
                style: dimensionValues.fontStyle
              });
              resolve();
            }, 50);
          });
        }

        FnWrapper.reset_select_mode();
        Progress.popById('convert-font');
      });

      _defineProperty(this, "renderButtons", (label, onClick, isFullLine, isDisabled) => {
        const className = classNames('btn', 'btn-default', {
          'btn-full': isFullLine,
          'btn-half': !isFullLine,
          'disabled': isDisabled
        });
        return /*#__PURE__*/React.createElement("div", {
          className: "btn-container",
          onClick: () => {
            onClick();
          },
          key: label
        }, /*#__PURE__*/React.createElement("button", {
          className: className
        }, label));
      });

      _defineProperty(this, "renderImageActions", () => {
        const {
          elem
        } = this.props;
        const isShading = elem.getAttribute('data-shading') === 'true';
        let content = [];
        content.push(this.renderButtons(LANG.replace_with, () => this.replaceImage(), true));
        content.push(this.renderButtons(LANG.trace, () => svgCanvas.imageToSVG(), false, isShading));
        content.push(this.renderButtons(LANG.grading, () => DialogCaller.showPhotoEditPanel('curve'), false));
        content.push(this.renderButtons(LANG.sharpen, () => DialogCaller.showPhotoEditPanel('sharpen'), false));
        content.push(this.renderButtons(LANG.crop, () => DialogCaller.showPhotoEditPanel('crop'), false));
        content.push(this.renderButtons(LANG.bevel, () => DialogCaller.showPhotoEditPanel('stamp'), false));
        content.push(this.renderButtons(LANG.invert, () => DialogCaller.showPhotoEditPanel('invert'), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderTextActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.convert_to_path, this.convertToPath, true));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderPathActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.decompose_path, () => svgCanvas.decomposePath(), true));
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderRectActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderEllipseActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderPolygonActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderLineActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderUseActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.disassemble_use, () => svgCanvas.disassembleUse2Group(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderGroupActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      _defineProperty(this, "renderMultiSelectActions", () => {
        let content = [];
        content.push(this.renderButtons(LANG.offset, () => svgEditor.triggerOffsetTool(), false));
        content.push(this.renderButtons(LANG.array, () => svgEditor.triggerGridTool(), false));
        return content;
      });

      this.state = {};
    }

    componentDidMount() {}

    componentWillUnmount() {}

    render() {
      const {
        elem
      } = this.props;
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

      return /*#__PURE__*/React.createElement("div", {
        className: "actions-panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, 'ACTIONS'), /*#__PURE__*/React.createElement("div", {
        className: "btns-container"
      }, content));
    }

  }

  return ActionsPanel;
});