import { useCallback } from 'react';

import type { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import progressCaller from '@core/app/actions/progress-caller';
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import fontHelper from '@core/helpers/fonts/fontHelper';
import { resolveFontByStyle } from '@core/helpers/fonts/resolveFontByStyle';
import { useFontStyleOptions } from '@core/helpers/fonts/useFontStyleOptions';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type { GeneralFont } from '@core/interfaces/IFont';
import type { ConfigItem } from '@core/interfaces/ILayerConfig';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TextOption } from '@core/interfaces/ObjectPanel';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

// Utility functions
const isLocalFont = (font: GeneralFont) => 'path' in font;

interface UseFontHandlersProps {
  elem: Element;
  fontFamily: ConfigItem<string>;
  onConfigChange: <T extends keyof TextOption>(key: T, value: TextOption[T]) => void;
  textElements: SVGTextElement[];
}

export const useFontHandlers = ({ elem, fontFamily, onConfigChange, textElements }: UseFontHandlersProps) => {
  const styleOptions = useFontStyleOptions(fontFamily.hasMultiValue ? '' : fontFamily.value);

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

      // Resize selectors after font loading to update UI bounds
      selector.getSelectorManager().resizeSelectors([elem]);
      progressCaller.popById('load-font');
    },
    [elem],
  );

  const handleFontStyleChange = useCallback(
    async (val: string) => {
      const font = await resolveFontByStyle(fontFamily.value, val);

      if (!font) return;

      const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(font, getCurrentUser());

      if (!success) return;

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
    [fontFamily.value, textElements, waitForWebFont, onConfigChange],
  );

  const handleStartOffsetChange = useCallback(
    (val: null | number): void => {
      if (val === null) return;

      textPathEdit.setStartOffset(val, elem as SVGGElement);
      onConfigChange('startOffset', val);
    },
    [elem, onConfigChange],
  );

  const handleVerticalAlignChange = useCallback(
    (val: VerticalAlign): void => {
      textPathEdit.setVerticalAlign(val, elem as SVGGElement);
      onConfigChange('verticalAlign', val);
    },
    [elem, onConfigChange],
  );

  const handleVerticalTextClick = useCallback(
    (checked: boolean): void => {
      textEdit.setIsVertical(!checked, textElements);
      onConfigChange('isVertical', !checked);
    },
    [textElements, onConfigChange],
  );

  return {
    handleFontStyleChange,
    handleStartOffsetChange,
    handleVerticalAlignChange,
    handleVerticalTextClick,
    styleOptions,
    waitForWebFont,
  };
};
