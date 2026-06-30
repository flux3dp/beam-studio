import React from 'react';

import type { ISVGEditor } from '@core/app/actions/beambox/svg-editor';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import dialogCaller from '@core/app/actions/dialog-caller';
import { showArrayModal } from '@core/app/components/dialogs/ArrayModal';
import { showCurvePanel, showRotaryWarped, showSharpenPanel } from '@core/app/components/dialogs/image';
import { showOffsetModal } from '@core/app/components/dialogs/OffsetModal';
import { CanvasElements } from '@core/app/constants/canvasElements';
import ActionPanelIcons from '@core/app/icons/action-panel/ActionPanelIcons';
import { BatchCommand } from '@core/app/svgedit/history/history';
import undoManager from '@core/app/svgedit/history/undoManager';
import { autoFit } from '@core/app/svgedit/operations/autoFit';
import disassembleUse from '@core/app/svgedit/operations/disassembleUse';
import selectionManager from '@core/app/svgedit/selection';
import textEdit from '@core/app/svgedit/text/textedit';
import updateElementColor from '@core/helpers/color/updateElementColor';
import { convertSvgToImage } from '@core/helpers/convertToImage';
import { convertSvgToPath, dispatchConvertToPath } from '@core/helpers/convertToPath';
import imageEdit from '@core/helpers/image-edit';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import dialog from '@core/implementations/dialog';
import type { ICommand } from '@core/interfaces/IHistory';
import type { ILang } from '@core/interfaces/ILang';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

let svgCanvas: ISVGCanvas;
let svgEditor: ISVGEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

export enum DisabledReason {
  CHILDREN_VT,
  FILLED,
  SHADING,
  VT,
}

type ResolveILangFn = (
  i18n: ILang,
  tActionsPanel: ILang['beambox']['right_panel']['object_panel']['actions_panel'],
) => string;

export interface PanelAction {
  disabledReasons?: DisabledReason[];
  icon: React.JSX.Element;
  id: string;
  label: ResolveILangFn;
  mainIcon?: React.JSX.Element;
  mobileIcon?: React.JSX.Element;
  mobileLabel?: ResolveILangFn;
  onClick: (elem: SVGElement) => void;
}
export type ActionKey =
  | 'array'
  | 'autoFit'
  | 'bgRemoval'
  | 'convertToImage'
  | 'convertToPath'
  | 'createTextpath'
  | 'crop'
  | 'decomposePath'
  | 'detachPath'
  | 'disassembleUse'
  | 'editSvgPath'
  | 'editTextPath'
  | 'grading'
  | 'imageEditPanel'
  | 'invert'
  | 'offset'
  | 'potrace'
  | 'replaceWith'
  | 'sharpen'
  | 'simplify'
  | 'smartNest'
  | 'stampMakerPanel'
  | 'tab'
  | 'trace'
  | 'trapezoid'
  | 'weldText';

export const actions: { [key in ActionKey]: PanelAction } = {
  array: {
    icon: <ActionPanelIcons.Array />,
    id: 'array',
    label: (_i18n, tActionsPanel) => tActionsPanel.array,
    mobileIcon: <ActionPanelIcons.ArrayMobile />,
    onClick: () => showArrayModal(),
  },
  autoFit: {
    icon: <ActionPanelIcons.AutoFit />,
    id: 'auto-fit',
    label: (_i18n, tActionsPanel) => tActionsPanel.auto_fit,
    onClick: (elem) => autoFit(elem),
  },
  bgRemoval: {
    icon: <ActionPanelIcons.BackgroundRemoval />,
    id: 'bg-removal',
    label: (_i18n, tActionsPanel) => tActionsPanel.ai_bg_removal,
    mainIcon: <ActionPanelIcons.BackgroundRemovalMobile viewBox="5 5 22 22" />,
    mobileIcon: <ActionPanelIcons.BackgroundRemovalMobile />,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.ai_bg_removal_short,
    onClick: (elem) => imageEdit.removeBackground(elem as SVGImageElement),
  },
  convertToImage: {
    disabledReasons: [DisabledReason.VT],
    icon: <ActionPanelIcons.ConvertToImage />,
    id: 'to_image',
    label: (_i18n, tActionsPanel) => tActionsPanel.to_image,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.outline,
    onClick: (elem) => convertSvgToImage({ svgElement: elem as SVGGElement }),
  },
  convertToPath: {
    disabledReasons: [DisabledReason.VT, DisabledReason.CHILDREN_VT],
    icon: <ActionPanelIcons.ConvertToPath />,
    id: 'to_path',
    label: (_i18n, tActionsPanel) => tActionsPanel.to_path,
    mobileIcon: <ActionPanelIcons.ConvertToPathMobile />,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.outline,
    onClick: (elem) => dispatchConvertToPath(elem, { isToSelect: true }),
  },
  createTextpath: {
    disabledReasons: [DisabledReason.CHILDREN_VT],
    icon: <ActionPanelIcons.CreateTextpath />,
    id: 'create_textpath',
    label: (_i18n, tActionsPanel) => tActionsPanel.create_textpath,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.create_textpath_short,
    onClick: (elem) => {
      // Note: ungroupTempGroup returns elements in reverse order
      const elements = selectionManager.ungroupTempGroup(elem);
      const textElements = elements.filter((el) => el.nodeName === 'text').reverse();
      const pathLikeElements = elements.filter((el) => CanvasElements.basicPaths.includes(el.nodeName)).reverse();
      const pairCount = Math.min(textElements.length, pathLikeElements.length);
      const batchCommand = new BatchCommand('Create Text on Path');
      const resultGroups: SVGElement[] = [];

      for (let i = 0; i < pairCount; i++) {
        let path = pathLikeElements[i];

        if (path.nodeName !== 'path') {
          path = convertSvgToPath(path, { parentCmd: batchCommand }).path!;
        }

        textPathEdit.attachTextToPath(textElements[i], path, { parentCmd: batchCommand });
        updateElementColor(textElements[i]);
        resultGroups.push(selectionManager.getSelectedElements()[0]);
      }

      if (!batchCommand.isEmpty()) {
        undoManager.addCommandToHistory(batchCommand);
      }

      if (resultGroups.length > 0) {
        selectionManager.multiSelect(resultGroups);
      }
    },
  },
  crop: {
    icon: <ActionPanelIcons.Crop />,
    id: 'crop',
    label: (_i18n, tActionsPanel) => tActionsPanel.crop,
    onClick: () => dialogCaller.showCropPanel(),
  },
  decomposePath: {
    icon: <ActionPanelIcons.Decompose />,
    id: 'decompose_path',
    label: (_i18n, tActionsPanel) => tActionsPanel.decompose_path,
    mobileIcon: <ActionPanelIcons.DecomposeMobile />,
    onClick: () => svgCanvas.decomposePath(),
  },
  detachPath: {
    icon: <ActionPanelIcons.DecomposeTextpath />,
    id: 'detach_path',
    label: (_i18n, tActionsPanel) => tActionsPanel.detach_path,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.detach_path_short,
    onClick: (elem) => {
      const { path, text } = textPathEdit.detachText(elem as SVGGElement);

      textEdit.renderText(text);
      selectionManager.multiSelect([text, path]);
    },
  },
  disassembleUse: {
    disabledReasons: [DisabledReason.VT],
    icon: <ActionPanelIcons.Disassemble />,
    id: 'disassemble_use',
    label: (_i18n, tActionsPanel) => tActionsPanel.disassemble_use,
    mobileIcon: <ActionPanelIcons.DisassembleMobile />,
    onClick: () => disassembleUse(),
  },
  editSvgPath: {
    icon: <ActionPanelIcons.EditPath />,
    id: 'edit_path',
    label: (_i18n, tActionsPanel) => tActionsPanel.edit_path,
    mobileIcon: <ActionPanelIcons.EditPathMobile />,
    onClick: (elem) => svgCanvas.pathActions.toEditMode(elem),
  },
  editTextPath: {
    icon: <ActionPanelIcons.EditPath />,
    id: 'edit_path',
    label: (_i18n, tActionsPanel) => tActionsPanel.edit_path,
    mobileIcon: <ActionPanelIcons.EditPathMobile />,
    onClick: (elem) => textPathEdit.editPath(elem as SVGGElement),
  },
  grading: {
    icon: <ActionPanelIcons.Grading />,
    id: 'grading',
    label: (_i18n, tActionsPanel) => tActionsPanel.grading,
    mobileIcon: <ActionPanelIcons.Brightness />,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.brightness,
    onClick: () => showCurvePanel(),
  },
  imageEditPanel: {
    icon: <ActionPanelIcons.EditImage />,
    id: 'imageEditPanel',
    label: (i18n) => i18n.image_edit_panel.title,
    mainIcon: <ActionPanelIcons.EditImage viewBox="2 2 20 20" />,
    onClick: () => dialogCaller.showImageEditPanel(),
  },
  invert: {
    icon: <ActionPanelIcons.Invert />,
    id: 'invert',
    label: (_i18n, tActionsPanel) => tActionsPanel.invert,
    onClick: (elem) => imageEdit.colorInvert(elem as SVGImageElement),
  },
  offset: {
    icon: <ActionPanelIcons.Offset />,
    id: 'offset',
    label: (_i18n, tActionsPanel) => tActionsPanel.offset,
    mainIcon: <ActionPanelIcons.Offset viewBox="4 4 16 16" />,
    onClick: () => showOffsetModal(),
  },
  potrace: {
    icon: <ActionPanelIcons.Outline />,
    id: 'potrace',
    label: (_i18n, tActionsPanel) => tActionsPanel.outline,
    onClick: (elem) => imageEdit.potrace(elem as SVGImageElement),
  },
  replaceWith: {
    icon: <ActionPanelIcons.Replace />,
    id: 'replace_with',
    label: (_i18n, tActionsPanel) => tActionsPanel.replace_with,
    mobileIcon: <ActionPanelIcons.ReplaceMobile />,
    mobileLabel: (_i18n, tActionsPanel) => tActionsPanel.replace_with_short,
    onClick: async (elem): Promise<void> => {
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
    },
  },
  sharpen: {
    icon: <ActionPanelIcons.Sharpen />,
    id: 'sharpen',
    label: (_i18n, tActionsPanel) => tActionsPanel.sharpen,
    mobileIcon: <ActionPanelIcons.SharpenMobile />,
    onClick: () => showSharpenPanel(),
  },
  simplify: {
    icon: <ActionPanelIcons.Simplify />,
    id: 'simplify',
    label: (_i18n, tActionsPanel) => tActionsPanel.simplify,
    mobileIcon: <ActionPanelIcons.SimplifyMobile />,
    onClick: () => svgCanvas.simplifyPath(),
  },
  smartNest: {
    icon: <ActionPanelIcons.SmartNest />,
    id: 'smart-nest',
    label: (_i18n, tActionsPanel) => tActionsPanel.smart_nest,
    onClick: () => dialogCaller.showSvgNestButtons(),
  },
  stampMakerPanel: {
    icon: <ActionPanelIcons.Stamp />,
    id: 'stampMakerPanel',
    label: (i18n) => i18n.stamp_maker_panel.title,
    onClick: () => dialogCaller.showStampMakerPanel(),
  },
  tab: {
    disabledReasons: [DisabledReason.FILLED, DisabledReason.VT],
    icon: <ActionPanelIcons.Tab />,
    id: 'tab',
    label: (i18n) => i18n.tab_panel.title,
    onClick: async (elem) => {
      let bbox = (elem as SVGSVGElement).getBBox();
      let command: ICommand | undefined;

      // Convert to path if it's not a path
      if (!(elem instanceof SVGPathElement)) {
        const { bbox: newBbox, command: subCommand } = (await dispatchConvertToPath(elem, {
          addToHistory: false,
          isToSelect: true,
        }))!;

        bbox = newBbox;
        command = subCommand;
      }

      dialogCaller.showTabPanel({
        bbox,
        command,
        onClose: () => {
          selectionManager.clearSelection();
        },
      });
    },
  },
  trace: {
    disabledReasons: [DisabledReason.SHADING],
    icon: <ActionPanelIcons.Trace />,
    id: 'trace',
    label: (_i18n, tActionsPanel) => tActionsPanel.trace,
    onClick: (elem) => imageEdit.traceImage(elem as SVGImageElement),
  },
  trapezoid: {
    icon: <ActionPanelIcons.RotaryWarped />,
    id: 'trapezoid',
    label: (i18n) => i18n.beambox.photo_edit_panel.rotary_warped,
    onClick: (elem) => showRotaryWarped(elem as SVGImageElement),
  },
  weldText: {
    disabledReasons: [DisabledReason.VT, DisabledReason.CHILDREN_VT],
    icon: <ActionPanelIcons.WeldText />,
    id: 'weld',
    label: (_i18n, tActionsPanel) => tActionsPanel.weld_text,
    mainIcon: <ActionPanelIcons.WeldText viewBox="2 2 20 20" />,
    onClick: (elem) => dispatchConvertToPath(elem, { isToSelect: true, weldingTexts: true }),
  },
};
