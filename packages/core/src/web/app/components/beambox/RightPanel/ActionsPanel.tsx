import React, { useCallback, useEffect } from 'react';

import { Button, ConfigProvider, Tooltip } from 'antd';
import classNames from 'classnames';
import { match, P } from 'ts-pattern';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import Dialog from '@core/app/actions/dialog-caller';
import { showArrayModal } from '@core/app/components/dialogs/ArrayModal';
import { showCurvePanel, showRotaryWarped, showSharpenPanel } from '@core/app/components/dialogs/image';
import { showOffsetModal } from '@core/app/components/dialogs/OffsetModal';
import { textButtonTheme } from '@core/app/constants/antd-config';
import { CanvasElements } from '@core/app/constants/canvasElements';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { BatchCommand } from '@core/app/svgedit/history/history';
import autoFit from '@core/app/svgedit/operations/autoFit';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import textEdit from '@core/app/svgedit/text/textedit';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { convertSvgToImage } from '@core/helpers/convertToImage';
import {
  convertSvgToPath,
  convertTextOnPathToPath,
  convertTextToPath,
  convertUseToPath,
} from '@core/helpers/convertToPath';
import imageEdit from '@core/helpers/image-edit';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { isMobile } from '@core/helpers/system-helper';
import useForceUpdate from '@core/helpers/use-force-update';
import useI18n from '@core/helpers/useI18n';
import { getVariableTextType } from '@core/helpers/variableText';
import dialog from '@core/implementations/dialog';
import type { IBatchCommand } from '@core/interfaces/IHistory';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import { VariableTextType } from '@core/interfaces/ObjectPanel';

import styles from './ActionsPanel.module.scss';
import ObjectPanelController from './contexts/ObjectPanelController';
import ObjectPanelItem from './ObjectPanelItem';

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
  tooltipIfDisabled?: string;
}

interface ConvertButtonOptions extends ButtonOpts {
  converter?: () => Promise<ConvertPathResult>;
}

interface TabButtonOptions extends ButtonOpts {
  convertToPath: () => Promise<ConvertPathResult>;
}

type ConvertPathResult = {
  bbox: DOMRect;
  command?: IBatchCommand;
};

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

  const renderButtons = useCallback(
    (
      id: string,
      label: string,
      onClick: () => void,
      icon: React.JSX.Element,
      mobileIcon: React.JSX.Element,
      { autoClose, isDisabled, isFullLine, mobileLabel, tooltipIfDisabled }: ButtonOpts = {},
    ): React.JSX.Element =>
      isMobile() ? (
        <ObjectPanelItem.Item
          autoClose={autoClose}
          content={mobileIcon}
          disabled={isDisabled}
          id={id}
          key={id}
          label={mobileLabel || label}
          onClick={onClick}
        />
      ) : (
        <Tooltip key={label} title={isDisabled ? tooltipIfDisabled : undefined}>
          <div className={classNames(styles['btn-container'], { [styles.half]: !isFullLine })}>
            <Button block className={styles.btn} disabled={isDisabled} icon={icon} id={id} onClick={onClick}>
              <span className={styles.label}>{label}</span>
            </Button>
          </div>
        </Tooltip>
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
    renderButtons('array', lang.array, showArrayModal, <ActionPanelIcons.Array />, <ActionPanelIcons.ArrayMobile />, {
      autoClose: false,
      ...opts,
    });

  const renderOffsetButton = (opts: ButtonOpts = {}): React.JSX.Element =>
    renderButtons('offset', lang.offset, showOffsetModal, <ActionPanelIcons.Offset />, <ActionPanelIcons.Offset />, {
      autoClose: false,
      ...opts,
    });

  const renderConvertToPathButton = (
    { converter, isText, ...opts }: ConvertButtonOptions = { converter: undefined, isText: false },
  ): React.JSX.Element =>
    renderButtons(
      'convert_to_path',
      lang.convert_to_path,
      () =>
        match({ converter, isText })
          .with({ converter: P.nonNullable }, async ({ converter }) => converter())
          .with({ isText: true }, async () => convertTextToPath({ element: elem, isToSelect: true }))
          .otherwise(async () => convertSvgToPath({ element: elem, isToSelect: true })),
      <ActionPanelIcons.ConvertToPath />,
      <ActionPanelIcons.ConvertToPathMobile />,
      { isFullLine: true, mobileLabel: lang.outline, ...opts },
    );

  const renderConvertToImageButton = (
    { isText: _isText = false, ...opts }: ButtonOpts = {
      isText: false,
    },
  ): React.JSX.Element =>
    renderButtons(
      'convert_to_image',
      lang.convert_to_image,
      () => convertSvgToImage({ svgElement: elem as SVGGElement }),
      <ActionPanelIcons.ConvertToImage />,
      <ActionPanelIcons.ConvertToImage />,
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
    { convertToPath, ...options }: TabButtonOptions = {
      convertToPath: () => convertSvgToPath({ element: elem, isToSelect: true }),
    },
  ): React.JSX.Element => {
    const isFilled = match(elem.getAttribute('fill'))
      // 'none' for SVG elements
      // 'nullish' for use elements
      .with(P.union('none', P.nullish), () => false)
      .otherwise(() => true);
    const isVariableText = getVariableTextType(elem) !== VariableTextType.NONE;
    const tooltipIfDisabled =
      isFilled && isVariableText
        ? lang.disabled_by_infilled_and_variable_text
        : isFilled
          ? lang.disabled_by_infilled
          : lang.disabled_by_variable_text;

    return renderButtons(
      'tab',
      tab,
      async () => {
        let bbox = (elem as SVGSVGElement).getBBox();
        let command: IBatchCommand | undefined;

        // Convert to path if it's not a path
        if (!(elem instanceof SVGPathElement)) {
          const { bbox: newBbox, command: subCommand } = await convertToPath();

          bbox = newBbox;
          command = subCommand;
        }

        Dialog.showTabPanel({
          bbox,
          command,
          onClose: () => {
            svgCanvas.clearSelection();
          },
        });
      },
      <ActionPanelIcons.Tab />,
      <ActionPanelIcons.Tab />,
      {
        isDisabled: isFilled || isVariableText,
        isFullLine: true,
        ...options,
        tooltipIfDisabled,
      },
    );
  };

  const renderImageActions = (): React.JSX.Element[] => {
    const isShading = elem.getAttribute('data-shading') === 'true';
    const content = {
      array: renderArrayButton(),
      autoFit: renderAutoFitButton(),
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
        showCurvePanel,
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
      offset: renderOffsetButton(),
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
        showSharpenPanel,
        <ActionPanelIcons.Sharpen />,
        <ActionPanelIcons.SharpenMobile />,
        { autoClose: false },
      ),
      smartNest: renderSmartNestButton(),
      stampMakerPanel: renderButtons(
        'stampMakerPanel',
        i18n.stamp_maker_panel.title,
        () => Dialog.showStampMakerPanel(),
        <ActionPanelIcons.Stamp />,
        <ActionPanelIcons.Stamp />,
        { isFullLine: true },
      ),
      trace: renderButtons(
        'trace',
        lang.trace,
        () => imageEdit.traceImage(elem as SVGImageElement),
        <ActionPanelIcons.Trace />,
        <ActionPanelIcons.Trace />,
        { isDisabled: isShading, tooltipIfDisabled: lang.disabled_by_gradient },
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
    const contentOrder: Array<keyof typeof content> = isMobile()
      ? [
          'autoFit',
          'replace_with',
          'potrace',
          'grading',
          'sharpen',
          'crop',
          'offset',
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
          'stampMakerPanel',
          'trace',
          'grading',
          'sharpen',
          'crop',
          'offset',
          'invert',
          'array',
          'potrace',
          'trapezoid',
        ];

    return contentOrder.map((key) => content[key]);
  };

  const renderTextActions = (): React.JSX.Element[] => {
    const isVariableText = getVariableTextType(elem) !== VariableTextType.NONE;
    const tooltipIfDisabled = lang.disabled_by_variable_text;

    return [
      renderAutoFitButton(),
      renderConvertToPathButton({ isDisabled: isVariableText, isText: true, tooltipIfDisabled }),
      renderConvertToImageButton({ isDisabled: isVariableText, isText: true, tooltipIfDisabled }),
      renderButtons(
        'weld',
        lang.weld_text,
        () => convertTextToPath({ element: elem, isToSelect: true, weldingTexts: true }),
        <ActionPanelIcons.WeldText />,
        <ActionPanelIcons.WeldText />,
        { isDisabled: isVariableText, isFullLine: true, tooltipIfDisabled },
      ),
      renderSmartNestButton(),
      renderArrayButton({ isFullLine: true }),
      renderOffsetButton({ isFullLine: true }),
      renderTabButton({
        convertToPath: () =>
          convertTextToPath({ element: elem, isToSelect: true, parentCommand: new BatchCommand('Text Tab') }),
      }),
    ];
  };

  const renderTextOnPathActions = (): React.JSX.Element[] => [
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
    renderConvertToPathButton({ converter: () => convertTextOnPathToPath({ element: elem }) }),
    renderConvertToImageButton({ isText: true }),
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
    renderConvertToImageButton(),
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
    renderConvertToImageButton(),
    renderSmartNestButton(),
    renderOffsetButton(),
    renderArrayButton(),
    renderTabButton(),
  ];

  const renderUseActions = (): React.JSX.Element[] => {
    const isVariableText = getVariableTextType(elem) !== VariableTextType.NONE;
    const tooltipIfDisabled = lang.disabled_by_variable_text;

    return [
      renderAutoFitButton(),
      renderButtons(
        'disassemble_use',
        lang.disassemble_use,
        () => disassembleUse(),
        <ActionPanelIcons.Disassemble />,
        <ActionPanelIcons.DisassembleMobile />,
        { isDisabled: isVariableText, isFullLine: true, tooltipIfDisabled },
      ),
      renderSmartNestButton(),
      renderConvertToImageButton(),
      renderArrayButton({ isFullLine: true }),
      renderOffsetButton({ isFullLine: true }),
      renderTabButton({ convertToPath: () => convertUseToPath({ element: elem, isToSelect: true }) }),
    ];
  };

  const renderGroupActions = (): React.JSX.Element[] => [
    renderAutoFitButton(),
    renderSmartNestButton(),
    renderConvertToImageButton(),
    renderOffsetButton(),
    renderArrayButton(),
  ];

  const renderMultiSelectActions = (): React.JSX.Element[] => {
    const children = Array.from(elem.childNodes) as SVGElement[];
    const onlyPaths = children.every((child) => child.nodeName === 'path');
    let content: React.JSX.Element[] = [];

    const appendOptionalButtons = (buttons: React.JSX.Element[]) => {
      const text = children.find((child) => child.nodeName === 'text') as SVGElement;
      const pathLike = children.find((child) => CanvasElements.basicPaths.includes(child.nodeName)) as SVGElement;

      if (children.length === 2 && text && pathLike) {
        const isVariableText = getVariableTextType(text) !== VariableTextType.NONE;

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
            {
              isDisabled: isVariableText,
              isFullLine: true,
              mobileLabel: lang.create_textpath_short,
              tooltipIfDisabled: lang.disabled_by_variable_text,
            },
          ),
        );
      }
    };

    appendOptionalButtons(content);

    const buttons = [
      renderAutoFitButton(),
      ...content,
      renderSmartNestButton(),
      renderConvertToImageButton(),
      renderOffsetButton(),
      renderArrayButton(),
    ];

    if (onlyPaths) {
      buttons.push(
        renderButtons(
          'simplify',
          lang.simplify,
          () => svgCanvas.simplifyPath(),
          <ActionPanelIcons.Simplify />,
          <ActionPanelIcons.SimplifyMobile />,
          { isFullLine: true },
        ),
      );
    }

    return buttons;
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
        .when((e) => e.getAttribute('data-textpath-g'), renderTextOnPathActions)
        .otherwise(renderGroupActions),
    )
    .otherwise(() => null);

  // Watch for changes in the `fill` attribute for path and `data-shading` attribute for image
  useEffect(() => {
    const observer = new MutationObserver(() => {
      forceUpdate();
    });

    if (elem) observer.observe(elem, { attributeFilter: ['fill', 'data-shading', 'data-vt-type'] });

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
