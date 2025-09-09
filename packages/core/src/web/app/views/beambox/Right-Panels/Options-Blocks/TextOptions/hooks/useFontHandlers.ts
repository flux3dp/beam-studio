import { useCallback, useEffect, useState } from 'react';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import type { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import progressCaller from '@core/app/actions/progress-caller';
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import fontHelper from '@core/helpers/fonts/fontHelper';
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

type FontOption = {
  family?: string;
  label: React.ReactNode;
  value: string;
};

const isLocalFont = (font: GeneralFont) => 'path' in font;

interface UseFontHandlersProps {
  elem: Element;
  fontFamily: ConfigItem<string>;
  onConfigChange: <T extends keyof TextOption>(key: T, value: TextOption[T]) => void;
  textElements: SVGTextElement[];
}

export const useFontHandlers = ({ elem, fontFamily, onConfigChange, textElements }: UseFontHandlersProps) => {
  const [styleOptions, setStyleOptions] = useState<FontOption[]>([]);

  // Update style options when font family changes
  useEffect(() => {
    const getStyleOptions = (family: string) => {
      const options = FontFuncs.requestFontsOfTheFontFamily(family).map(({ style }) => ({
        label: style,
        value: style,
      }));

      setStyleOptions(options);
    };

    if (fontFamily.hasMultiValue) setStyleOptions([]);
    else getStyleOptions(fontFamily.value);
  }, [fontFamily]);

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
      const font = FontFuncs.requestFontByFamilyAndStyle({ family: fontFamily.value, style: val });
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
    [fontFamily.value, textElements, waitForWebFont, onConfigChange],
  );

  const handleFontSizeChange = useCallback(
    (val: number): void => {
      textEdit.setFontSize(val, textElements);
      onConfigChange('fontSize', val);
    },
    [textElements, onConfigChange],
  );

  const handleLetterSpacingChange = useCallback(
    (val: number): void => {
      textEdit.setLetterSpacing(val, textElements);
      onConfigChange('letterSpacing', val);
    },
    [textElements, onConfigChange],
  );

  const handleLineSpacingChange = useCallback(
    (val: number): void => {
      textEdit.setLineSpacing(val, textElements);
      onConfigChange('lineSpacing', val);
    },
    [textElements, onConfigChange],
  );

  const handleStartOffsetChange = useCallback(
    (val: number): void => {
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
    // Handler functions
    handleFontSizeChange,
    handleFontStyleChange,
    handleLetterSpacingChange,
    handleLineSpacingChange,
    handleStartOffsetChange,
    handleVerticalAlignChange,
    handleVerticalTextClick,
    // Computed values
    styleOptions,
    // Utility functions
    waitForWebFont,
  };
};
