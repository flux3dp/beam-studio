import React, { useCallback, useEffect } from 'react';

import { Button, ConfigProvider } from 'antd';
import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import Dialog from '@core/app/actions/dialog-caller';
import { textButtonTheme } from '@core/app/constants/antd-config';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import autoFit from '@core/app/svgedit/operations/autoFit';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import textActions from '@core/app/svgedit/text/textactions';
import textEdit from '@core/app/svgedit/text/textedit';
import ObjectPanelController from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import { showRotaryWarped } from '@core/app/views/dialogs/image-edit/RotaryWarped';
import updateElementColor from '@core/helpers/color/updateElementColor';
import imageEdit from '@core/helpers/image-edit';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import webNeedConnectionWrapper from '@core/helpers/web-need-connection-helper';
import dialog from '@core/implementations/dialog';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ActionsPanel.module.scss';

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

interface Props {
  elem: SVGElement;
}

interface ButtonOpts {
  autoClose?: boolean;
  isDisabled?: boolean;
  isFullLine?: boolean;
  isText?: boolean;
  mobileLabel?: string;
}

interface TabButtonOptions extends ButtonOpts {
  convertToPath: (elem: any) => Promise<DOMRect>;
}

const ActionsPanel = ({ elem }: Props): React.JSX.Element => {
  const i18n = useI18n();
  const forceUpdate = useForceUpdate();
  const tab = i18n.tab_panel.title;
  const lang = i18n.beambox.right_panel.object_panel.actions_panel;
  const replaceImage = async (): Promise<void> => {
    setTimeout(() => ObjectPanelController.updateActiveKey(null), 300);

    const option = {
      filters: [
        {
          extensions: ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi', 'bmp', 'jp2', 'j2k', 'jpf', 'jpx', 'jpm'],
          name: 'Images',
        },
      ],
    };
    const fileBlob = await dialog.getFileFromDialog(option);

    if (fileBlob) svgEditor.replaceBitmap(fileBlob, elem);
  };

  const convertTextToPath = async (weldingTexts = false): Promise<DOMRect> => {
    const isTextPath = elem.getAttribute('data-textpath-g');
    const textElem = isTextPath ? elem.querySelector('text') : elem;

    if (textActions.isEditing) textActions.toSelectMode();

    svgCanvas.clearSelection();

    const { path } = await FontFuncs.convertTextToPath(textElem!, { weldingTexts });

    if (path) svgCanvas.selectOnly([path]);

    return path?.getBBox()!;
  };

  const renderButtons = useCallback(
    (
      id: string,
      label: string,
      onClick: () => void,
      icon: React.JSX.Element,
      mobileIcon: React.JSX.Element,
      { autoClose, isDisabled, isFullLine, mobileLabel }: ButtonOpts = {},
    ): React.JSX.Element =>
      isMobile() ? (
        <ObjectPanelItem.Item
          autoClose={autoClose}
          content={mobileIcon}
          disabled={isDisabled}
          id={id}
          key={mobileLabel || label}
          label={mobileLabel || label}
          onClick={onClick}
        />
      ) : (
        <div className={classNames(styles['btn-container'], { [styles.half]: !isFullLine })} key={label}>
          <Button block className={styles.btn} disabled={isDisabled} icon={icon} id={id} onClick={onClick}>
            <span className={styles.label}>{label}</span>
          </Button>
        </div>
      ),
    [],
  );

  const renderAutoFitButton = (opts: ButtonOpts = {}): React.JSX.Element =>
    renderButtons(
      'auto-fit',
      `${lang.auto_fit} (Beta)`,
      () => autoFit(elem as SVGElement),
      <ActionPanelIcons.AutoFit />,
      <ActionPanelIcons.AutoFit />,
      { autoClose: false, isFullLine: true, ...opts },
    );

  const renderArrayButton = (opts: ButtonOpts = {}): React.JSX.Element =>
    renderButtons(
      'array',
      lang.array,
      () => svgEditor.triggerGridTool(),
      <ActionPanelIcons.Array />,
      <ActionPanelIcons.ArrayMobile />,
      { autoClose: false, ...opts },
    );

  const renderOffsetButton = (opts: ButtonOpts = {}): React.JSX.Element =>
    renderButtons(
      'offset',
      lang.offset,
      () => svgEditor.triggerOffsetTool(),
      <ActionPanelIcons.Offset />,
      <ActionPanelIcons.Offset />,
      { autoClose: false, ...opts },
    );

  const renderConvertToPathButton = ({ isText, ...opts }: ButtonOpts = { isText: false }): React.JSX.Element =>
    renderButtons(
      'convert_to_path',
      lang.convert_to_path,
      () => (isText ? convertTextToPath() : svgCanvas.convertToPath(elem as SVGElement)),
      <ActionPanelIcons.ConvertToPath />,
      <ActionPanelIcons.ConvertToPathMobile />,
      { isFullLine: true, mobileLabel: lang.outline, ...opts },
    );

  const renderSmartNestButton = (opts: ButtonOpts = {}): React.JSX.Element =>
    renderButtons(
      'smart-nest',
      lang.smart_nest,
      () => Dialog.showSvgNestButtons(),
      <ActionPanelIcons.SmartNest />,
      <ActionPanelIcons.SmartNest />,
      { isFullLine: true, ...opts },
    );

  const renderTabButton = (
    { convertToPath, ...opts }: TabButtonOptions = {
      convertToPath: ((elem: any) => {
        const { path } = svgCanvas.convertToPath(elem);

        svgCanvas.selectOnly([path]);

        return path.getBBox();
      }) as any,
    },
  ): React.JSX.Element =>
    renderButtons(
      'tab',
      tab,
      async () => {
        let bbox = (elem as SVGSVGElement).getBBox();

        // Convert to path if it's not a path
        if (!(elem instanceof SVGPathElement)) {
          bbox = await convertToPath(elem);
        }

        Dialog.showTabPanel({ bbox, onClose: () => {} });
      },
      <ActionPanelIcons.Tab />,
      <ActionPanelIcons.Tab />,
      { isDisabled: elem.getAttribute('fill') !== 'none', isFullLine: true, ...opts },
    );

  const renderImageActions = (): React.JSX.Element[] => {
    const isShading = elem.getAttribute('data-shading') === 'true';
    const content = {
      array: renderArrayButton(),
      autoFit: renderAutoFitButton(),
      bevel: renderButtons(
        'bevel',
        lang.bevel,
        () => imageEdit.generateStampBevel(elem as SVGImageElement),
        <ActionPanelIcons.Bevel />,
        <ActionPanelIcons.BevelMobile />,
      ),
      'bg-removal': renderButtons(
        'bg-removal',
        lang.ai_bg_removal,
        () => imageEdit.removeBackground(elem as SVGImageElement),
        <ActionPanelIcons.BackgroundRemoval />,
        <ActionPanelIcons.BackgroundRemovalMobile />,
        { isFullLine: true, mobileLabel: lang.ai_bg_removal_short },
      ),
      crop: renderButtons(
        'crop',
        lang.crop,
        () => Dialog.showCropPanel(),
        <ActionPanelIcons.Crop />,
        <ActionPanelIcons.Crop />,
        { autoClose: false },
      ),
      grading: renderButtons(
        'grading',
        lang.grading,
        () => Dialog.showPhotoEditPanel('curve'),
        <ActionPanelIcons.Grading />,
        <ActionPanelIcons.Brightness />,
        { autoClose: false, mobileLabel: lang.brightness },
      ),
      imageEditPanel: renderButtons(
        'imageEditPanel',
        i18n.image_edit_panel.title,
        () => Dialog.showImageEditPanel(),
        <ActionPanelIcons.EditImage />,
        <ActionPanelIcons.EditImage />,
        { isFullLine: true, mobileLabel: lang.ai_bg_removal_short },
      ),
      invert: renderButtons(
        'invert',
        lang.invert,
        () => imageEdit.colorInvert(elem as SVGImageElement),
        <ActionPanelIcons.Invert />,
        <ActionPanelIcons.Invert />,
      ),
      potrace: renderButtons(
        'potrace',
        lang.outline,
        () => imageEdit.potrace(elem as SVGImageElement),
        <ActionPanelIcons.Outline />,
        <ActionPanelIcons.Outline />,
      ),
      replace_with: renderButtons(
        'replace_with',
        lang.replace_with,
        replaceImage,
        <ActionPanelIcons.Replace />,
        <ActionPanelIcons.ReplaceMobile />,
        { autoClose: false, isFullLine: true, mobileLabel: lang.replace_with_short },
      ),
      sharpen: renderButtons(
        'sharpen',
        lang.sharpen,
        () => {
          webNeedConnectionWrapper(() => Dialog.showPhotoEditPanel('sharpen'));
        },
        <ActionPanelIcons.Sharpen />,
        <ActionPanelIcons.SharpenMobile />,
        { autoClose: false },
      ),
      smartNest: renderSmartNestButton(),
      trace: renderButtons(
        'trace',
        lang.trace,
        () => imageEdit.traceImage(elem as SVGImageElement),
        <ActionPanelIcons.Trace />,
        <ActionPanelIcons.Trace />,
        { isDisabled: isShading },
      ),
      trapezoid: renderButtons(
        'trapezoid',
        i18n.beambox.photo_edit_panel.rotary_warped,
        () => showRotaryWarped(elem as SVGImageElement),
        <ActionPanelIcons.RotaryWarped />,
        <ActionPanelIcons.RotaryWarped />,
        { isFullLine: true },
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

    return contentOrder.map((key) => (content as any)[key]);
  };

  const renderTextActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderConvertToPathButton({ isText: true }),
    renderButtons(
      'weld',
      lang.weld_text,
      () => convertTextToPath(true),
      <ActionPanelIcons.WeldText />,
      <ActionPanelIcons.WeldText />,
      { isFullLine: true },
    ),
    renderSmartNestButton(),
    renderArrayButton({ isFullLine: true }),
    renderTabButton({ convertToPath: convertTextToPath }),
  ];

  const renderTextPathActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderButtons(
      'edit_path',
      lang.edit_path,
      () => textPathEdit.editPath(elem as SVGGElement),
      <ActionPanelIcons.EditPath />,
      <ActionPanelIcons.EditPathMobile />,
      { isFullLine: true },
    ),
    renderButtons(
      'detach_path',
      lang.detach_path,
      () => {
        const { path, text } = textPathEdit.detachText(elem as SVGGElement);

        textEdit.renderText(text);
        svgCanvas.multiSelect([text, path]);
      },
      <ActionPanelIcons.DecomposeTextpath />,
      <ActionPanelIcons.DecomposeTextpath />,
      { isFullLine: true, mobileLabel: lang.detach_path_short },
    ),
    renderConvertToPathButton({ isText: true }),
    renderSmartNestButton(),
    renderArrayButton({ isFullLine: true }),
  ];

  const renderPathActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderButtons(
      'edit_path',
      lang.edit_path,
      () => svgCanvas.pathActions.toEditMode(elem),
      <ActionPanelIcons.EditPath />,
      <ActionPanelIcons.EditPathMobile />,
      { isFullLine: true },
    ),
    renderButtons(
      'decompose_path',
      lang.decompose_path,
      () => svgCanvas.decomposePath(),
      <ActionPanelIcons.Decompose />,
      <ActionPanelIcons.DecomposeMobile />,
      { isFullLine: true },
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
      { isFullLine: true },
    ),
    renderTabButton(),
  ];

  const renderCommonSvgActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderConvertToPathButton(),
    renderSmartNestButton(),
    renderOffsetButton(),
    renderArrayButton(),
    renderTabButton(),
  ];

  const renderUseActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderButtons(
      'disassemble_use',
      lang.disassemble_use,
      () => disassembleUse(),
      <ActionPanelIcons.Disassemble />,
      <ActionPanelIcons.DisassembleMobile />,
      { isFullLine: true },
    ),
    renderSmartNestButton(),
    renderArrayButton({ isFullLine: true }),
  ];

  const renderGroupActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderSmartNestButton(),
    renderArrayButton({ isFullLine: true }),
  ];

  const renderMultiSelectActions = (): React.JSX.Element[] => {
    const children = Array.from(elem.childNodes);
    const supportOffset = children.every((child: ChildNode) => !['g', 'image', 'text', 'use'].includes(child.nodeName));
    const appendOptionalButtons = (buttons: React.JSX.Element[]) => {
      const text = children.find((child) => child.nodeName === 'text') as Element;
      const pathLike = children.find((child) =>
        ['ellipse', 'line', 'path', 'polygon', 'rect'].includes(child.nodeName),
      ) as SVGElement;

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
            { isFullLine: true, mobileLabel: lang.create_textpath_short },
          ),
        );
      }
    };
    let content: React.JSX.Element[] = [];

    appendOptionalButtons(content);
    content = [
      renderAutoFitButton(),
      ...content,
      renderSmartNestButton(),
      renderOffsetButton({ isDisabled: !supportOffset }),
      renderArrayButton(),
    ];

    return content;
  };

  const content = match(elem?.tagName.toLowerCase())
    .with(P.union('image', 'img'), renderImageActions)
    .with('text', renderTextActions)
    .with('path', renderPathActions)
    .with(P.union('rect', 'ellipse', 'polygon', 'line'), renderCommonSvgActions)
    .with('use', renderUseActions)
    .with('g', () =>
      match(elem)
        .when((e) => e.getAttribute('data-tempgroup') === 'true', renderMultiSelectActions)
        .when((e) => e.getAttribute('data-textpath-g'), renderTextPathActions)
        .otherwise(renderGroupActions),
    )
    .otherwise(() => null);

  // Watch for changes in the `fill` attribute
  useEffect(() => {
    const observer = new MutationObserver(() => {
      forceUpdate();
    });

    if (elem) {
      observer.observe(elem, { attributeFilter: ['fill'] });
    }

    return () => observer.disconnect(); // Cleanup
  }, [elem, forceUpdate]);

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
