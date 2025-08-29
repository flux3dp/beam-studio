import { match } from 'ts-pattern';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import textEdit from '@core/app/svgedit/text/textedit';
import { updateConfigs } from '@core/helpers/update-configs';
import type { TextConfig } from '@core/interfaces/ObjectPanel';

import { sanitizeFontFamily } from './fontUtils';

/**
 * Extracts text configuration from a single text element
 */
export const extractTextElementConfig = (
  textElement: SVGTextElement,
  availableFontFamilies: string[],
): Partial<TextConfig> => {
  // Get font information
  const postscriptName = textEdit.getFontPostscriptName(textElement);

  const font = match(postscriptName)
    .when(
      (name) => name && FontFuncs.getFontOfPostscriptName,
      (name) => {
        const fontFromPostscript = FontFuncs.getFontOfPostscriptName(name);

        // Set missing attributes if not present
        if (!textElement.getAttribute('font-style')) {
          textElement.setAttribute('font-style', fontFromPostscript.italic ? 'italic' : 'normal');
        }

        if (!textElement.getAttribute('font-weight')) {
          textElement.setAttribute(
            'font-weight',
            fontFromPostscript.weight ? fontFromPostscript.weight.toString() : 'normal',
          );
        }

        return fontFromPostscript;
      },
    )
    .otherwise(() => {
      const family = textEdit.getFontFamilyData(textElement);
      const weight = textEdit.getFontWeight(textElement);
      const italic = textEdit.getItalic(textElement);

      return FontFuncs.requestFontByFamilyAndStyle({ family, italic, weight });
    });

  console.log('Font info:', font);

  // Sanitize font family
  const { isChanged, sanitizedFamily } = sanitizeFontFamily(font, availableFontFamilies);

  if (isChanged) {
    const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedFamily)[0];

    console.warn(`Unsupported font ${font.family}, fallback to ${sanitizedFamily}`);
    textEdit.setFontFamily(sanitizedFamily, true, [textElement]);
    textEdit.setFontPostscriptName(newFont.postscriptName, true, [textElement]);
  }

  // Build configuration object
  const configs: Partial<TextConfig> = {};

  updateConfigs(configs, 'fontFamily', () => sanitizedFamily);
  updateConfigs(configs, 'fontStyle', () => font.style);
  updateConfigs(configs, 'fontSize', () => textEdit.getFontSize(textElement));
  updateConfigs(configs, 'letterSpacing', () => textEdit.getLetterSpacing(textElement));
  updateConfigs(configs, 'lineSpacing', () => textEdit.getLineSpacing(textElement));
  updateConfigs(configs, 'isVertical', () => textEdit.getIsVertical(textElement));

  // Handle text path specific configurations
  if (textElement.getAttribute('data-textpath')) {
    const textPath = textElement.querySelector('textPath');

    if (textPath) {
      updateConfigs(configs, 'startOffset', () => textPathEdit.getStartOffset(textPath));
      updateConfigs(configs, 'verticalAlign', () => textPathEdit.getVerticalAlign(textPath));
    }
  }

  return configs;
};

/**
 * Extracts configuration from multiple text elements
 */
export const extractTextElementsConfig = (
  textElements: SVGTextElement[],
  availableFontFamilies: string[],
  elementId: string,
): TextConfig => {
  const newConfigs: Partial<TextConfig> = {
    id: { hasMultiValue: false, value: elementId },
  };

  for (const textElement of textElements) {
    const elementConfig = extractTextElementConfig(textElement, availableFontFamilies);

    // Merge configurations
    Object.entries(elementConfig).forEach(([key, config]) => {
      if (key in newConfigs) {
        newConfigs[key as keyof TextConfig] = config;
      }
    });
  }

  // Return merged configuration with defaults
  return {
    fontFamily: { hasMultiValue: false, value: '' },
    fontSize: { hasMultiValue: false, value: 200 },
    fontStyle: { hasMultiValue: false, value: '' },
    id: { hasMultiValue: false, value: '' },
    isVertical: { hasMultiValue: false, value: false },
    letterSpacing: { hasMultiValue: false, value: 0 },
    lineSpacing: { hasMultiValue: false, value: 1 },
    startOffset: { hasMultiValue: false, value: 0 },
    verticalAlign: { hasMultiValue: false, value: 0 },
    ...newConfigs,
  } as TextConfig;
};

/**
 * Checks if element configuration should be updated
 */
export const shouldUpdateElementConfig = (elementId: string, currentElementId: string): boolean => {
  return elementId !== currentElementId;
};
