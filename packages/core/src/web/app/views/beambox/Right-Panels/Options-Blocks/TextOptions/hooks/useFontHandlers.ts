import { useCallback, useEffect, useState } from 'react';

import { map, pipe } from 'remeda';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import type { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import progressCaller from '@core/app/actions/progress-caller';
import { useFontLoading, useFontRegistry } from '@core/app/stores/googleFontStore';
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import fontHelper from '@core/helpers/fonts/fontHelper';
import { createGoogleFontObject, getWeightAndStyleFromVariant } from '@core/helpers/fonts/fontUtils';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
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

// Utility functions
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
    const getStyleOptions = async (family: string) => {
      // First try local fonts
      const localFonts = FontFuncs.requestFontsOfTheFontFamily(family);

      if (localFonts.length > 0) {
        const options = pipe(
          localFonts,
          map(({ style }) => ({ label: style, value: style })),
        );

        setStyleOptions(options);

        return;
      }

      // If no local fonts found, check if it's a Google Font
      try {
        const googleFontData = await googleFontsApiCache.findFont(family);

        if (googleFontData?.variants?.length) {
          const googleFontOptions = pipe(
            googleFontData.variants,
            map((variant) => {
              const { style } = getWeightAndStyleFromVariant(variant);

              return { label: style, value: style };
            }),
          );

          setStyleOptions(googleFontOptions);

          return;
        }
      } catch (error) {
        console.warn('Failed to fetch Google Font variants:', error);
      }

      // Fallback: no variants found
      setStyleOptions([]);
    };

    if (fontFamily.hasMultiValue) {
      setStyleOptions([]);
    } else {
      getStyleOptions(fontFamily.value);
    }
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

  // Simplified Google Font creation using unified stores
  const createGoogleFontFromStyle = useCallback(
    async (family: string, targetStyle: string): Promise<GeneralFont | null> => {
      try {
        const googleFontData = await googleFontsApiCache.findFont(family);

        if (!googleFontData?.variants) return null;

        // Find matching variant using unified parser
        const targetVariant = googleFontData.variants.find((variant) => {
          const { style } = getWeightAndStyleFromVariant(variant);

          return style === targetStyle;
        });

        if (!targetVariant) return null;

        // Use the unified font creation utility
        const { weight } = getWeightAndStyleFromVariant(targetVariant);
        const loadBinary = useFontLoading.getState().loadBinary;

        const googleFont = createGoogleFontObject({
          binaryLoader: loadBinary,
          fontFamily: family,
          style: targetStyle,
          weight,
        });

        // Register using the focused registry store
        await useFontRegistry.getState().registerGoogleFont(family);

        return googleFont;
      } catch (error) {
        console.warn('Failed to create Google Font from style:', error);

        return null;
      }
    },
    [],
  );

  const handleFontStyleChange = useCallback(
    async (val: string) => {
      // First try local fonts
      let font = FontFuncs.requestFontByFamilyAndStyle({ family: fontFamily.value, style: val });

      const isLocalFontResult = font && font.family.toLowerCase() === fontFamily.value.toLowerCase();

      // If not a valid local font result, try Google Fonts
      if (!isLocalFontResult) {
        const googleFont = await createGoogleFontFromStyle(fontFamily.value, val);

        if (googleFont) {
          font = googleFont;
        }
      }

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
    [fontFamily.value, textElements, waitForWebFont, onConfigChange, createGoogleFontFromStyle],
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
    handleFontSizeChange,
    handleFontStyleChange,
    handleLetterSpacingChange,
    handleLineSpacingChange,
    handleStartOffsetChange,
    handleVerticalAlignChange,
    handleVerticalTextClick,
    styleOptions,
    waitForWebFont,
  };
};
