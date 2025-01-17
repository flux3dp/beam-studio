import classNames from 'classnames';
import React, { useCallback } from 'react';
import { Button, ConfigProvider } from 'antd';

import ActionPanelIcons from 'app/icons/action-panel/ActionPanelIcons';
import Dialog from 'app/actions/dialog-caller';
import dialog from 'implementations/dialog';
import FontFuncs from 'app/actions/beambox/font-funcs';
import imageEdit from 'helpers/image-edit';
import ObjectPanelController from 'app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import autoFit from 'app/svgedit/operations/autoFit';
import textActions from 'app/svgedit/text/textactions';
import textEdit from 'app/svgedit/text/textedit';
import textPathEdit from 'app/actions/beambox/textPathEdit';
import updateElementColor from 'helpers/color/updateElementColor';
import useI18n from 'helpers/useI18n';
import webNeedConnectionWrapper from 'helpers/web-need-connection-helper';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { isMobile } from 'helpers/system-helper';
import { showRotaryWarped } from 'app/views/dialogs/image-edit/RotaryWarped';
import { textButtonTheme } from 'app/constants/antd-config';

import styles from './ActionsPanel.module.scss';

let svgCanvas;
let svgEditor;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

interface Props {
  elem: Element;
}

interface ButtonOpts {
  isFullLine?: boolean;
  isDisabled?: boolean;
  autoClose?: boolean;
  mobileLabel?: string;
}

const ActionsPanel = ({ elem }: Props): JSX.Element => {
  const t = useI18n();
  const lang = t.beambox.right_panel.object_panel.actions_panel;
  const replaceImage = async (): Promise<void> => {
    setTimeout(() => ObjectPanelController.updateActiveKey(null), 300);
    const option = {
      filters: [
        {
          name: 'Images',
          extensions: [
            'png',
            'jpg',
            'jpeg',
            'jpe',
            'jif',
            'jfif',
            'jfi',
            'bmp',
            'jp2',
            'j2k',
            'jpf',
            'jpx',
            'jpm',
          ],
        },
      ],
    };
    const fileBlob = await dialog.getFileFromDialog(option);
    if (fileBlob) {
      svgEditor.replaceBitmap(fileBlob, elem);
    }
  };

  const convertTextToPath = async (): Promise<void> => {
    const isTextPath = elem.getAttribute('data-textpath-g');
    const textElem = isTextPath ? elem.querySelector('text') : elem;
    if (textActions.isEditing) {
      textActions.toSelectMode();
    }
    svgCanvas.clearSelection();
    await FontFuncs.convertTextToPath(textElem);
  };

  const weldText = async (): Promise<void> => {
    const isTextPath = elem.getAttribute('data-textpath-g');
    const textElem = isTextPath ? elem.querySelector('text') : elem;
    if (textActions.isEditing) {
      textActions.toSelectMode();
    }
    svgCanvas.clearSelection();
    await FontFuncs.convertTextToPath(textElem, { weldingTexts: true });
  };

  const renderButtons = useCallback(
    (
      id: string,
      label: string,
      onClick: () => void,
      icon: JSX.Element,
      mobileIcon: JSX.Element,
      opts: ButtonOpts = {}
    ): JSX.Element => {
      const { isFullLine, isDisabled, autoClose, mobileLabel } = opts;
      return isMobile() ? (
        <ObjectPanelItem.Item
          key={mobileLabel || label}
          id={id}
          content={mobileIcon}
          label={mobileLabel || label}
          onClick={onClick}
          disabled={isDisabled}
          autoClose={autoClose}
        />
      ) : (
        <div
          className={classNames(styles['btn-container'], { [styles.half]: !isFullLine })}
          key={label}
        >
          <Button
            className={styles.btn}
            id={id}
            icon={icon}
            onClick={onClick}
            disabled={isDisabled}
            block
          >
            <span className={styles.label}>{label}</span>
          </Button>
        </div>
      );
    },
    []
  );

  const renderAutoFitButon = (opts: ButtonOpts = {}): JSX.Element =>
    renderButtons(
      'auto-fit',
      `${lang.auto_fit} (Beta)`,
      () => autoFit(elem as SVGElement),
      <ActionPanelIcons.AutoFit />,
      <ActionPanelIcons.AutoFit />,
      { isFullLine: true, autoClose: false, ...opts }
    );

  const renderArrayButton = (opts: ButtonOpts = {}): JSX.Element =>
    renderButtons(
      'array',
      lang.array,
      () => svgEditor.triggerGridTool(),
      <ActionPanelIcons.Array />,
      <ActionPanelIcons.ArrayMobile />,
      { autoClose: false, ...opts }
    );

  const renderOffsetButton = (opts: ButtonOpts = {}): JSX.Element =>
    renderButtons(
      'offset',
      lang.offset,
      () => svgEditor.triggerOffsetTool(),
      <ActionPanelIcons.Offset />,
      <ActionPanelIcons.Offset />,
      { autoClose: false, ...opts }
    );

  const renderSmartNestButton = (opts: ButtonOpts = {}): JSX.Element =>
    renderButtons(
      'smart-nest',
      lang.smart_nest,
      () => Dialog.showSvgNestButtons(),
      <ActionPanelIcons.SmartNest />,
      <ActionPanelIcons.SmartNest />,
      { isFullLine: true, ...opts }
    );

  const renderImageActions = (): JSX.Element[] => {
    const isShading = elem.getAttribute('data-shading') === 'true';
    const content = {
      autoFit: renderAutoFitButon(),
      smartNest: renderSmartNestButton(),
      replace_with: renderButtons(
        'replace_with',
        lang.replace_with,
        replaceImage,
        <ActionPanelIcons.Replace />,
        <ActionPanelIcons.ReplaceMobile />,
        { isFullLine: true, autoClose: false, mobileLabel: lang.replace_with_short }
      ),
      'bg-removal': renderButtons(
        'bg-removal',
        lang.ai_bg_removal,
        () => imageEdit.removeBackground(elem as SVGImageElement),
        <ActionPanelIcons.BackgroungRemoval />,
        <ActionPanelIcons.BackgroungRemovalMobile />,
        { isFullLine: true, mobileLabel: lang.ai_bg_removal_short }
      ),
      imageEditPanel: renderButtons(
        'imageEditPanel',
        t.image_edit_panel.title,
        () => Dialog.showImageEditPanel(),
        <ActionPanelIcons.EditImage />,
        <ActionPanelIcons.EditImage />,
        { isFullLine: true, mobileLabel: lang.ai_bg_removal_short }
      ),
      trapezoid: renderButtons(
        'trapezoid',
        t.beambox.photo_edit_panel.rotary_warped,
        () => showRotaryWarped(elem as SVGImageElement),
        <ActionPanelIcons.RotaryWarped />,
        <ActionPanelIcons.RotaryWarped />,
        { isFullLine: true }
      ),
      trace: renderButtons(
        'trace',
        lang.trace,
        () => imageEdit.traceImage(elem as SVGImageElement),
        <ActionPanelIcons.Trace />,
        <ActionPanelIcons.Trace />,
        { isDisabled: isShading }
      ),
      grading: renderButtons(
        'grading',
        lang.grading,
        () => Dialog.showPhotoEditPanel('curve'),
        <ActionPanelIcons.Grading />,
        <ActionPanelIcons.Brightness />,
        { autoClose: false, mobileLabel: lang.brightness }
      ),
      sharpen: renderButtons(
        'sharpen',
        lang.sharpen,
        () => {
          webNeedConnectionWrapper(() => Dialog.showPhotoEditPanel('sharpen'));
        },
        <ActionPanelIcons.Sharpen />,
        <ActionPanelIcons.SharpenMobile />,
        { autoClose: false }
      ),
      crop: renderButtons(
        'crop',
        lang.crop,
        () => Dialog.showCropPanel(),
        <ActionPanelIcons.Crop />,
        <ActionPanelIcons.Crop />,
        { autoClose: false }
      ),
      bevel: renderButtons(
        'bevel',
        lang.bevel,
        () => imageEdit.generateStampBevel(elem as SVGImageElement),
        <ActionPanelIcons.Bevel />,
        <ActionPanelIcons.BevelMobile />
      ),
      invert: renderButtons(
        'invert',
        lang.invert,
        () => imageEdit.colorInvert(elem as SVGImageElement),
        <ActionPanelIcons.Invert />,
        <ActionPanelIcons.Invert />
      ),
      array: renderArrayButton(),
      potrace: renderButtons(
        'potrace',
        lang.outline,
        () => imageEdit.potrace(elem as SVGImageElement),
        <ActionPanelIcons.Outline />,
        <ActionPanelIcons.Outline />
      ),
    };
    const contentOrder = isMobile()
      ? [
          'autoFit',
          'replace_with',
          'potrace',
          'grading',
          'sharpen',
          'crop',
          'bevel',
          'invert',
          'array',
          'trace',
          'bg-removal',
          'smartNest',
          'trapezoid',
        ]
      : [
          'autoFit',
          'replace_with',
          'bg-removal',
          'smartNest',
          'imageEditPanel',
          'trace',
          'grading',
          'sharpen',
          'crop',
          'bevel',
          'invert',
          'array',
          'potrace',
          'trapezoid',
        ];
    const contentInOrder = contentOrder.map((key) => content[key]);
    return contentInOrder;
  };

  const renderTextActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'convert_to_path',
        lang.convert_to_path,
        convertTextToPath,
        <ActionPanelIcons.ConvertToPath />,
        <ActionPanelIcons.ConvertToPathMobile />,
        {
          isFullLine: true,
          mobileLabel: lang.outline,
        }
      ),
      renderButtons(
        'weld',
        lang.weld_text,
        weldText,
        <ActionPanelIcons.WeldText />,
        <ActionPanelIcons.WeldText />,
        {
          isFullLine: true,
        }
      ),
      renderSmartNestButton(),
      renderArrayButton({ isFullLine: true }),
    ];
    return content;
  };

  const renderTextPathActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'edit_path',
        lang.edit_path,
        () => textPathEdit.editPath(elem as SVGGElement),
        <ActionPanelIcons.EditPath />,
        <ActionPanelIcons.EditPathMobile />,
        { isFullLine: true }
      ),
      renderButtons(
        'detach_path',
        lang.detach_path,
        () => {
          const { text, path } = textPathEdit.detachText(elem as SVGGElement);
          textEdit.renderText(text);
          svgCanvas.multiSelect([text, path], true);
        },
        <ActionPanelIcons.DecomposeTextpath />,
        <ActionPanelIcons.DecomposeTextpath />,
        { isFullLine: true, mobileLabel: lang.detach_path_short }
      ),
      renderButtons(
        'convert_to_path',
        lang.convert_to_path,
        convertTextToPath,
        <ActionPanelIcons.ConvertToPath />,
        <ActionPanelIcons.ConvertToPathMobile />,
        { isFullLine: true, mobileLabel: lang.outline }
      ),
      renderSmartNestButton(),
      renderArrayButton({ isFullLine: true }),
    ];
    return content;
  };

  const renderPathActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'edit_path',
        lang.edit_path,
        () => svgCanvas.pathActions.toEditMode(elem),
        <ActionPanelIcons.EditPath />,
        <ActionPanelIcons.EditPathMobile />,
        { isFullLine: true }
      ),
      renderButtons(
        'decompose_path',
        lang.decompose_path,
        () => svgCanvas.decomposePath(),
        <ActionPanelIcons.Decompose />,
        <ActionPanelIcons.DecomposeMobile />,
        { isFullLine: true }
      ),
      renderSmartNestButton(),
      renderOffsetButton(),
      renderArrayButton(),
      renderButtons(
        'simplify',
        lang.simplify,
        () => svgCanvas.simplifyPath(),
        <ActionPanelIcons.Simplify />,
        <ActionPanelIcons.SimplifyMobile />,
        { isFullLine: true }
      ),
    ];
    return content;
  };

  const renderRectActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'convert_to_path',
        lang.convert_to_path,
        () => svgCanvas.convertToPath(elem),
        <ActionPanelIcons.ConvertToPath />,
        <ActionPanelIcons.ConvertToPathMobile />,
        { isFullLine: true, mobileLabel: lang.outline }
      ),
      renderSmartNestButton(),
      renderOffsetButton(),
      renderArrayButton(),
    ];
    return content;
  };

  const renderEllipseActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'convert_to_path',
        lang.convert_to_path,
        () => svgCanvas.convertToPath(elem),
        <ActionPanelIcons.ConvertToPath />,
        <ActionPanelIcons.ConvertToPathMobile />,
        { isFullLine: true, mobileLabel: lang.outline }
      ),
      renderSmartNestButton(),
      renderOffsetButton(),
      renderArrayButton(),
    ];
    return content;
  };

  const renderPolygonActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'convert_to_path',
        lang.convert_to_path,
        () => svgCanvas.convertToPath(elem),
        <ActionPanelIcons.ConvertToPath />,
        <ActionPanelIcons.ConvertToPathMobile />,
        { isFullLine: true, mobileLabel: lang.outline }
      ),
      renderSmartNestButton(),
      renderOffsetButton(),
      renderArrayButton(),
    ];
    return content;
  };

  const renderLineActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'convert_to_path',
        lang.convert_to_path,
        () => svgCanvas.convertToPath(elem),
        <ActionPanelIcons.ConvertToPath />,
        <ActionPanelIcons.ConvertToPathMobile />,
        { isFullLine: true, mobileLabel: lang.outline }
      ),
      renderSmartNestButton(),
      renderOffsetButton(),
      renderArrayButton(),
    ];
    return content;
  };

  const renderUseActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderButtons(
        'disassemble_use',
        lang.disassemble_use,
        () => svgCanvas.disassembleUse2Group(),
        <ActionPanelIcons.Disassemble />,
        <ActionPanelIcons.DisassembleMobile />,
        { isFullLine: true }
      ),
      renderSmartNestButton(),
      renderArrayButton({ isFullLine: true }),
    ];
    return content;
  };

  const renderGroupActions = (): JSX.Element[] => {
    const content = [
      renderAutoFitButon(),
      renderSmartNestButton(),
      renderArrayButton({ isFullLine: true }),
    ];
    return content;
  };

  const renderMultiSelectActions = (): JSX.Element[] => {
    const children = Array.from(elem.childNodes);
    const supportOffset = children.every(
      (child: ChildNode) => !['g', 'text', 'image', 'use'].includes(child.nodeName)
    );

    const appendOptionalButtons = (buttons: JSX.Element[]) => {
      const text = children.find((child) => child.nodeName === 'text') as Element;
      const pathLike = children.find((child) =>
        ['path', 'ellipse', 'line', 'polygon', 'rect'].includes(child.nodeName)
      ) as Element;
      if (children.length === 2 && text && pathLike) {
        buttons.push(
          renderButtons(
            'create_textpath',
            lang.create_textpath,
            () => {
              svgCanvas.ungroupTempGroup();
              let path = pathLike;
              if (pathLike.nodeName !== 'path') {
                path = svgCanvas.convertToPath(path).path;
              }
              textPathEdit.attachTextToPath(text, path);
              updateElementColor(text);
            },
            <ActionPanelIcons.CreateTextpath />,
            <ActionPanelIcons.CreateTextpath />,
            { isFullLine: true, mobileLabel: lang.create_textpath_short }
          )
        );
      }
    };
    let content: JSX.Element[] = [];
    appendOptionalButtons(content);
    content = [
      renderAutoFitButon(),
      ...content,
      renderSmartNestButton(),
      renderOffsetButton({ isDisabled: !supportOffset }),
      renderArrayButton(),
    ];
    return content;
  };

  let content: JSX.Element[] | null = null;
  if (elem) {
    const tagName = elem.tagName.toLowerCase();
    if (tagName === 'image' || tagName === 'img') {
      content = renderImageActions();
    } else if (tagName === 'text') {
      content = renderTextActions();
    } else if (tagName === 'path') {
      content = renderPathActions();
    } else if (tagName === 'rect') {
      content = renderRectActions();
    } else if (tagName === 'ellipse') {
      content = renderEllipseActions();
    } else if (tagName === 'polygon') {
      content = renderPolygonActions();
    } else if (tagName === 'line') {
      content = renderLineActions();
    } else if (tagName === 'use') {
      content = renderUseActions();
    } else if (tagName === 'g') {
      if (elem.getAttribute('data-tempgroup') === 'true') {
        content = renderMultiSelectActions();
      } else if (elem.getAttribute('data-textpath-g')) {
        content = renderTextPathActions();
      } else {
        content = renderGroupActions();
      }
    }
  }
  return isMobile() ? (
    <div className={styles.container}>
      <ObjectPanelItem.Divider />
      {content}
    </div>
  ) : (
    <div className={styles.panel}>
      <div className={styles.title}>ACTIONS</div>
      <div className={styles['btns-container']}>
        <ConfigProvider theme={textButtonTheme}>{content}</ConfigProvider>
      </div>
    </div>
  );
};

export default ActionsPanel;
