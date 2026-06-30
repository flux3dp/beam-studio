import { useCallback, useEffect, useState } from 'react';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import {
  FONT_FALLBACK_FAMILIES,
  generateGoogleFontPostScriptName,
  generateStyleFromWeightAndItalic,
} from '@core/helpers/fonts/fontUtils';
import { updateConfigs } from '@core/helpers/update-configs';
import type { GeneralFont } from '@core/interfaces/IFont';
import type { TextConfig, TextOption } from '@core/interfaces/ObjectPanel';

import ObjectPanelController from '../../../contexts/ObjectPanelController';

const findFallbackFont = (targetFont: GeneralFont, availableFamilies: string[]): string | undefined =>
  [targetFont.family, ...FONT_FALLBACK_FAMILIES].find((candidate) =>
    availableFamilies.some((local) => local.toLowerCase() === candidate.toLowerCase()),
  );

const isGoogleFontLoaded = (
  fontFamily: string,
  availableFamilies: string[],
  fontHistory: string[],
  sessionLoadedFonts: Set<string>,
): boolean => {
  const fontFamilyLower = fontFamily.toLowerCase();
  const isLocal = availableFamilies.some((f) => f.toLowerCase() === fontFamilyLower);

  if (isLocal) return false;

  const isInHistory = fontHistory.some((h) => h.toLowerCase() === fontFamilyLower);
  const isInSession = sessionLoadedFonts.has(fontFamily);
  const isFontAvailable = document.fonts.check(`1em "${fontFamily}"`);

  return (isInHistory || isInSession) && isFontAvailable;
};

export const defaultTextConfigs: TextConfig = {
  fontFamily: { hasMultiValue: false, value: '' },
  fontStyle: { hasMultiValue: false, value: '' },
  id: { hasMultiValue: false, value: '' },
  isVertical: { hasMultiValue: false, value: false },
  startOffset: { hasMultiValue: false, value: 0 },
  verticalAlign: { hasMultiValue: false, value: VerticalAlign.MIDDLE },
};

interface UseTextConfigsProps {
  elem: SVGElement;
  textElements: SVGTextElement[];
}

export const useTextConfigs = ({ elem, textElements }: UseTextConfigsProps) => {
  const fontHistory = useStorageStore((state) => state['font-history']);
  const [fontFamilies, setFontFamilies] = useState<string[]>(FontFuncs.requestAvailableFontFamilies());
  const [configs, setConfigs] = useState(defaultTextConfigs);

  const handleSizeChange = useCallback(() => {
    selector.getSelectorManager().resizeSelectors([elem]);
    ObjectPanelController.updateDimensionValues(getBBox(elem));
    ObjectPanelController.updateObjectPanel();
  }, [elem]);

  const onConfigChange = useCallback(
    <T extends keyof TextOption>(key: T, value: TextOption[T]) => {
      setConfigs((prev) => ({ ...prev, [key]: { hasMultiValue: false, value } }));
      handleSizeChange();
    },
    [handleSizeChange],
  );

  useEffect(() => {
    const getStateFromElem = () => {
      const elemId = elem.getAttribute('id')!;
      const newConfigs: Partial<TextConfig> = { id: { hasMultiValue: false, value: elemId } };

      if (elemId === configs.id.value) {
        return;
      }

      for (const textElement of textElements) {
        const elementFontFamily = textEdit.getFontFamilyData(textElement);
        const cleanFontFamily = elementFontFamily.replace(/^['"]|['"]$/g, '');
        const localFontMatch = fontFamilies.find((f) => f.toLowerCase() === cleanFontFamily.toLowerCase());

        let font: GeneralFont;

        const currentSessionLoadedFonts = useGoogleFontStore.getState().sessionLoadedFonts;
        const isGoogleFontFromAnySource =
          !localFontMatch &&
          (fontHistory.some((h) => h.toLowerCase() === cleanFontFamily.toLowerCase()) ||
            currentSessionLoadedFonts.has(cleanFontFamily));

        if (isGoogleFontFromAnySource) {
          const actualWeight = textEdit.getFontWeight(textElement) || 400;
          const actualItalic = textEdit.getItalic(textElement);
          const actualPostscriptName = textEdit.getFontPostscriptName(textElement);
          const postscriptName =
            actualPostscriptName || generateGoogleFontPostScriptName(cleanFontFamily, actualWeight, actualItalic);
          const style = generateStyleFromWeightAndItalic(actualWeight, actualItalic);

          font = {
            family: cleanFontFamily,
            italic: actualItalic,
            postscriptName,
            style,
            weight: actualWeight,
          };
        } else {
          const postscriptName = textEdit.getFontPostscriptName(textElement);

          if (postscriptName) {
            font = FontFuncs.getFontOfPostscriptName(postscriptName);

            if (!textElement.getAttribute('font-style')) {
              textElement.setAttribute('font-style', font.italic ? 'italic' : 'normal');
            }

            if (!textElement.getAttribute('font-weight')) {
              textElement.setAttribute('font-weight', font.weight ? font.weight.toString() : 'normal');
            }
          } else {
            const family = textEdit.getFontFamilyData(textElement);
            const weight = textEdit.getFontWeight(textElement);
            const italic = textEdit.getItalic(textElement);

            font = FontFuncs.requestFontByFamilyAndStyle({ family, italic, weight });
          }
        }

        const fontIsLocallyAvailable = fontFamilies.find((f) => f.toLowerCase() === font.family.toLowerCase());
        const googleFontIsLoaded_ = isGoogleFontLoaded(
          font.family,
          fontFamilies,
          fontHistory,
          currentSessionLoadedFonts,
        );

        if (!googleFontIsLoaded_ && !fontIsLocallyAvailable) {
          const sanitizedFamily = findFallbackFont(font, fontFamilies);

          if (sanitizedFamily && sanitizedFamily !== font.family) {
            const fonts = FontFuncs.requestFontsOfTheFontFamily(sanitizedFamily);

            if (fonts && fonts.length > 0) {
              const newFont = fonts[0];

              console.warn(`unsupported font ${font.family}, fallback to ${sanitizedFamily}`);
              textEdit.setFontFamily(sanitizedFamily, true, [textElement]);
              textEdit.setFontPostscriptName(newFont.postscriptName, true, [textElement]);

              font = newFont;
            } else {
              console.error(`Fallback font family ${sanitizedFamily} has no available fonts`);
            }
          }
        }

        updateConfigs(newConfigs, 'fontFamily', () => font.family);
        updateConfigs(newConfigs, 'fontStyle', () => font.style);
        updateConfigs(newConfigs, 'isVertical', () => textEdit.getIsVertical(textElement));

        if (textElement.getAttribute('data-textpath')) {
          const textPath = textElement.querySelector('textPath');

          if (textPath) {
            updateConfigs(newConfigs, 'startOffset', () => textPathEdit.getStartOffset(textPath));
            updateConfigs(newConfigs, 'verticalAlign', () => textPathEdit.getVerticalAlign(textPath));
          }
        }
      }

      setConfigs({ ...defaultTextConfigs, ...newConfigs });
      selector.getSelectorManager().resizeSelectors([elem]);
    };

    getStateFromElem();
  }, [elem, textElements, fontFamilies, configs.id.value, fontHistory]);

  return { configs, fontFamilies, handleSizeChange, onConfigChange, setFontFamilies };
};
