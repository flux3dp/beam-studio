import { useCallback, useMemo } from 'react';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import progressCaller from '@core/app/actions/progress-caller';
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import fontHelper from '@core/helpers/fonts/fontHelper';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import { isLocalFont } from '../utils/fontUtils';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

interface UseFontOperationsParams {
  addToFontHistory: (family: string) => void;
  elem: Element;
  onConfigChange: <T extends keyof any>(key: T, value: any) => void;
  textElements: SVGTextElement[];
}

export const useFontOperations = ({
  addToFontHistory,
  elem,
  onConfigChange,
  textElements,
}: UseFontOperationsParams) => {
  const waitForWebFont = useCallback(
    async (fontLoadedPromise?: Promise<void>) => {
      await progressCaller.openNonstopProgress({
        caption: i18n.lang.beambox.right_panel.object_panel.actions_panel.fetching_web_font,
        id: 'load-font',
      });
      await document.fonts.ready;

      if (fontLoadedPromise) {
        await fontLoadedPromise;
      }

      selector.getSelectorManager().resizeSelectors([elem]);
      progressCaller.popById('load-font');
    },
    [elem],
  );

  const handleFontFamilyChange = useCallback(
    async (newFamily: string, option: { family?: string }) => {
      const family = option.family ?? newFamily;
      const newFont = FontFuncs.requestFontsOfTheFontFamily(family)[0];

      addToFontHistory(newFont.family);

      const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(newFont, getCurrentUser());

      if (!success) {
        return;
      }

      const batchCmd = new history.BatchCommand('Change Font family');

      [
        textEdit.setFontPostscriptName(newFont.postscriptName, true, textElements),
        textEdit.setItalic(newFont.italic, true, textElements),
        textEdit.setFontWeight(newFont.weight, true, textElements),
        textEdit.setFontFamily(family, true, textElements),
      ].forEach((cmd) => {
        if (cmd) batchCmd.addSubCommand(cmd);
      });

      svgCanvas.undoMgr.addCommandToHistory(batchCmd);

      if (!isLocalFont(newFont)) {
        await waitForWebFont(fontLoadedPromise);
      }

      onConfigChange('fontFamily', family);
      onConfigChange('fontStyle', newFont.style);
    },
    [textElements, onConfigChange, addToFontHistory, waitForWebFont],
  );

  const handleFontStyleChange = useCallback(
    async (val: string, currentFontFamily: string) => {
      const font = FontFuncs.requestFontByFamilyAndStyle({
        family: currentFontFamily,
        style: val,
      });

      const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(font, getCurrentUser());

      if (!success) {
        return;
      }

      const batchCmd = new history.BatchCommand('Change Font Style');

      [
        textEdit.setFontPostscriptName(font.postscriptName, true, textElements),
        textEdit.setItalic(font.italic, true, textElements),
        textEdit.setFontWeight(font.weight, true, textElements),
      ].forEach((cmd) => {
        if (cmd) batchCmd.addSubCommand(cmd);
      });

      svgCanvas.undoMgr.addCommandToHistory(batchCmd);

      if (!isLocalFont(font)) {
        await waitForWebFont(fontLoadedPromise);
      }

      onConfigChange('fontStyle', val);
    },
    [textElements, onConfigChange, waitForWebFont],
  );

  const handleFontSizeChange = useCallback(
    (val: number) => {
      textEdit.setFontSize(val, textElements);
      onConfigChange('fontSize', val);
    },
    [textElements, onConfigChange],
  );

  const handleLetterSpacingChange = useCallback(
    (val: number) => {
      textEdit.setLetterSpacing(val, textElements);
      onConfigChange('letterSpacing', val);
    },
    [textElements, onConfigChange],
  );

  const handleLineSpacingChange = useCallback(
    (val: number) => {
      textEdit.setLineSpacing(val, textElements);
      onConfigChange('lineSpacing', val);
    },
    [textElements, onConfigChange],
  );

  const handleVerticalTextChange = useCallback(
    (val: boolean) => {
      textEdit.setIsVertical(val, textElements);
      onConfigChange('isVertical', val);
    },
    [textElements, onConfigChange],
  );

  return useMemo(
    () => ({
      handleFontFamilyChange,
      handleFontSizeChange,
      handleFontStyleChange,
      handleLetterSpacingChange,
      handleLineSpacingChange,
      handleVerticalTextChange,
    }),
    [
      handleFontFamilyChange,
      handleFontSizeChange,
      handleFontStyleChange,
      handleLetterSpacingChange,
      handleLineSpacingChange,
      handleVerticalTextChange,
    ],
  );
};
