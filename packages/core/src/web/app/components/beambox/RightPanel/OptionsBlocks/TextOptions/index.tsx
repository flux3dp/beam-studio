import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import classNames from 'classnames';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import dialogCaller from '@core/app/actions/dialog-caller';
import { ObjectPanelContext } from '@core/app/components/beambox/RightPanel/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/components/beambox/RightPanel/ObjectPanelItem';
import { iconButtonTheme, selectTheme } from '@core/app/constants/antd-config';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import type { Selector } from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import fontHelper from '@core/helpers/fonts/fontHelper';
import {
  createGoogleFontObject,
  FONT_FALLBACK_FAMILIES,
  generateGoogleFontPostScriptName,
  generateStyleFromWeightAndItalic,
  getWeightAndStyleFromVariant,
} from '@core/helpers/fonts/fontUtils';
import { googleFontsApiCache } from '@core/helpers/fonts/googleFontsApiCache';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import { updateConfigs } from '@core/helpers/update-configs';
import useI18n from '@core/helpers/useI18n';
import { isVariableTextSupported } from '@core/helpers/variableText';
import type { GeneralFont } from '@core/interfaces/IFont';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TextConfig, TextOption } from '@core/interfaces/ObjectPanel';

import InFillBlock from '../InFillBlock';
import StartOffsetBlock from '../TextOptions/components/StartOffsetBlock';
import VerticalAlignBlock from '../TextOptions/components/VerticalAlignBlock';
import { useFontHandlers } from '../TextOptions/hooks/useFontHandlers';
import VariableTextBlock from '../VariableTextBlock';

import styles from './index.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('font');

const isLocalFont = (font: GeneralFont) => 'path' in font;

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
  const isLocalFont = availableFamilies.some((f) => f.toLowerCase() === fontFamilyLower);

  if (isLocalFont) return false; // Local fonts are not considered "Google fonts"

  const isInHistory = fontHistory.some((h) => h.toLowerCase() === fontFamilyLower);
  const isInSession = sessionLoadedFonts.has(fontFamily);
  const isFontAvailable = document.fonts.check(`1em "${fontFamily}"`);

  return (isInHistory || isInSession) && isFontAvailable;
};

interface Props {
  elem: Element;
  isTextPath?: boolean;
  showColorPanel?: boolean;
  textElements: SVGTextElement[];
}

const defaultTextConfigs: TextConfig = {
  fontFamily: { hasMultiValue: false, value: '' },
  fontSize: { hasMultiValue: false, value: 200 },
  fontStyle: { hasMultiValue: false, value: '' },
  id: { hasMultiValue: false, value: '' },
  isVertical: { hasMultiValue: false, value: false },
  letterSpacing: { hasMultiValue: false, value: 0 },
  lineSpacing: { hasMultiValue: false, value: 1 },
  startOffset: { hasMultiValue: false, value: 0 },
  verticalAlign: { hasMultiValue: false, value: VerticalAlign.MIDDLE },
};

type FontOption = {
  family?: string;
  label: React.ReactNode;
  value: string;
};

const getFontFamilyOption = (family: string, isHistory = false): FontOption => {
  const fontName = FontFuncs.fontNameMap.get(family);
  const displayName = fontName ?? family;
  const src = fontHelper.getWebFontPreviewUrl(family);

  const label = src ? (
    <div className={styles['family-option']}>
      <div className={styles['img-container']}>
        <img alt={displayName} draggable="false" src={src} />
      </div>
      {src.includes('monotype') && <FluxIcons.FluxPlus />}
    </div>
  ) : (
    <div className={styles['font-family-display']} style={{ fontFamily: `'${family}'` }}>
      {displayName}
    </div>
  );

  return isHistory ? { family, label, value: `history-${family}` } : { label, value: family };
};

const TextOptions = ({ elem, isTextPath, showColorPanel, textElements }: Props) => {
  const lang = useI18n();
  const langOptionPanel = lang.beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const { updateObjectPanel } = useContext(ObjectPanelContext);
  const fontHistory = useStorageStore((state) => state['font-history']);
  const [availableFontFamilies, setAvailableFontFamilies] = useState<string[]>([]);
  const [configs, setConfigs] = useState(defaultTextConfigs);
  const { fontFamily } = configs;
  const selectorRef = useRef<null | Selector>(null);
  const workarea = useWorkarea();
  const showVariableText = useMemo(isVariableTextSupported, [workarea]);

  useEffect(() => {
    selectorRef.current = selector.getSelectorManager().requestSelector(elem);

    return () => {
      selector.getSelectorManager().releaseSelector(elem);
      selectorRef.current = null;
    };
  }, [elem]);

  const onConfigChange = useCallback(
    <T extends keyof TextOption>(key: T, value: TextOption[T]) => {
      setConfigs((prev) => ({ ...prev, [key]: { hasMultiValue: false, value } }));
      selectorRef.current?.resize();
      updateObjectPanel();
    },
    [updateObjectPanel],
  );

  const {
    handleFontSizeChange,
    handleFontStyleChange,
    handleLetterSpacingChange,
    handleLineSpacingChange,
    handleStartOffsetChange,
    handleVerticalAlignChange,
    handleVerticalTextClick,
    styleOptions,
    waitForWebFont,
  } = useFontHandlers({ elem, fontFamily, onConfigChange, textElements });
  const {
    addToHistory,
    loadGoogleFontBinary: binaryLoader,
    registerGoogleFont,
    sessionLoadedFonts,
  } = useGoogleFontStore();

  // Helper function to apply font changes to text elements with undo support
  const applyFontToElements = useCallback(
    async ({
      font,
      fontFamily,
      fontLoadedPromise,
    }: {
      font: GeneralFont;
      fontFamily: string;
      fontLoadedPromise?: Promise<void>;
    }): Promise<void> => {
      const batchCmd = new history.BatchCommand('Change Font family');

      [
        textEdit.setFontPostscriptName(font.postscriptName, true, textElements),
        textEdit.setItalic(font.italic, true, textElements),
        textEdit.setFontWeight(font.weight, true, textElements),
        textEdit.setFontFamily(fontFamily, true, textElements),
      ].forEach((cmd) => {
        if (cmd) batchCmd.addSubCommand(cmd);
      });

      svgCanvas.undoMgr.addCommandToHistory(batchCmd);

      if (!isLocalFont(font)) {
        await waitForWebFont(fontLoadedPromise);
      }

      onConfigChange('fontFamily', fontFamily);
      onConfigChange('fontStyle', font.style);
    },
    [textElements, onConfigChange, waitForWebFont],
  );

  const proactivelyLoadHistoryFonts = useCallback(() => {
    if (fontHistory && fontHistory.length > 0) {
      fontHistory.forEach((family) => {
        if (!useGoogleFontStore.getState().isGoogleFontLoaded(family)) {
          useGoogleFontStore.getState().loadGoogleFont(family);
        }
      });
    }
  }, [fontHistory]);

  const historyFontFamilies = useMemo(
    () =>
      fontHistory
        .map((family) => {
          const isSystemFont = availableFontFamilies.some((f) => f.toLowerCase() === family.toLowerCase());
          const useHistoryPrefix = FontFuncs.requestAvailableFontFamilies() && isSystemFont;

          return getFontFamilyOption(family, useHistoryPrefix);
        })
        .filter(Boolean),
    [fontHistory, availableFontFamilies],
  );

  const getFontFamilies = useCallback(async () => {
    setAvailableFontFamilies(FontFuncs.requestAvailableFontFamilies());
  }, []);

  useEffect(() => {
    eventEmitter.on('GET_MONOTYPE_FONTS', getFontFamilies);

    return () => {
      eventEmitter.removeListener('GET_MONOTYPE_FONTS', getFontFamilies);
    };
  }, [getFontFamilies]);

  useEffect(() => {
    const getStateFromElem = () => {
      const elemId = elem.getAttribute('id')!;
      const newConfigs: Partial<TextConfig> = { id: { hasMultiValue: false, value: elemId } };

      if (elemId === configs.id.value) {
        return;
      }

      proactivelyLoadHistoryFonts();

      for (const textElement of textElements) {
        const elementFontFamily = textEdit.getFontFamilyData(textElement);
        const cleanFontFamily = elementFontFamily.replace(/^['"]|['"]$/g, '');
        const localFontMatch = availableFontFamilies.find((f) => f.toLowerCase() === cleanFontFamily.toLowerCase());

        let font: GeneralFont;

        const isGoogleFontFromAnySource =
          !localFontMatch &&
          (fontHistory.some((h) => h.toLowerCase() === cleanFontFamily.toLowerCase()) ||
            sessionLoadedFonts.has(cleanFontFamily));

        if (isGoogleFontFromAnySource) {
          // Create synthetic Google Font object to bypass PostScript lookup
          // This is only for web fonts that are not available locally
          const actualWeight = textEdit.getFontWeight(textElement) || 400;
          const actualItalic = textEdit.getItalic(textElement);
          const actualPostscriptName = textEdit.getFontPostscriptName(textElement);
          // Use actual PostScript name if available, otherwise generate proper name based on weight/style
          const postscriptName =
            actualPostscriptName || generateGoogleFontPostScriptName(cleanFontFamily, actualWeight, actualItalic);

          // Determine style based on weight and italic
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

        // Check if this font should use fallback
        const fontIsLocallyAvailable = availableFontFamilies.find((f) => f.toLowerCase() === font.family.toLowerCase());
        const googleFontIsLoaded = isGoogleFontLoaded(
          font.family,
          availableFontFamilies,
          fontHistory,
          sessionLoadedFonts,
        );

        if (!googleFontIsLoaded && !fontIsLocallyAvailable) {
          // Use fallback fonts if postscriptName cannot find in user PC
          const sanitizedFamily = findFallbackFont(font, availableFontFamilies);

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
        updateConfigs(newConfigs, 'fontSize', () => textEdit.getFontSize(textElement));
        updateConfigs(newConfigs, 'letterSpacing', () => textEdit.getLetterSpacing(textElement));
        updateConfigs(newConfigs, 'lineSpacing', () => textEdit.getLineSpacing(textElement));
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
      selectorRef.current?.resize();
    };

    if (availableFontFamilies.length > 0) {
      getStateFromElem();
    } else {
      getFontFamilies();
    }
  }, [
    elem,
    textElements,
    availableFontFamilies,
    configs.id.value,
    getFontFamilies,
    fontHistory,
    sessionLoadedFonts,
    proactivelyLoadHistoryFonts,
  ]);

  const handleFontFamilyChange = async (newFamily: string, option: FontOption) => {
    if (newFamily === 'more-google-fonts') {
      dialogCaller.showGoogleFontsPanel(handleGoogleFontSelect);

      return;
    }

    const family = option.family ?? newFamily;

    const localFontMatch = FontFuncs.findFontFamilyCaseInsensitive(family);

    if (!localFontMatch) {
      await handleGoogleFontSelect(family);

      return;
    }

    const fonts = FontFuncs.requestFontsOfTheFontFamily(localFontMatch);

    if (!fonts || fonts.length === 0) {
      console.error(`No fonts found for family: ${localFontMatch}`);
      await handleGoogleFontSelect(family);

      return;
    }

    const newFont = fonts[0];

    addToHistory(newFont);

    const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(newFont, getCurrentUser());

    if (!success) {
      return;
    }

    await applyFontToElements({
      font: newFont,
      fontFamily: localFontMatch,
      fontLoadedPromise,
    });
  };

  const handleGoogleFontSelect = useCallback(
    async (fontFamily: string) => {
      const localFontMatch = FontFuncs.findFontFamilyCaseInsensitive(fontFamily);

      if (localFontMatch) {
        const fonts = FontFuncs.requestFontsOfTheFontFamily(localFontMatch);

        if (!fonts || fonts.length === 0) {
          console.error(`No fonts found for family: ${localFontMatch}`);

          return;
        }

        const localFont = fonts[0];

        addToHistory(localFont);

        const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(localFont, getCurrentUser());

        if (!success) {
          return;
        }

        await applyFontToElements({
          font: localFont,
          fontFamily: localFontMatch,
          fontLoadedPromise,
        });
      } else {
        // Load the font properly through the store system
        await useGoogleFontStore.getState().loadGoogleFontForTextEditing(fontFamily);

        // Get the first available variant for this font family
        const fontData = await googleFontsApiCache.findFont(fontFamily);

        if (fontData && fontData.variants && fontData.variants.length > 0) {
          const { style, weight } = getWeightAndStyleFromVariant(fontData.variants[0]);
          const googleFont = createGoogleFontObject({ binaryLoader, fontFamily, style, weight });

          addToHistory(googleFont);
          registerGoogleFont(fontFamily);

          await applyFontToElements({
            font: googleFont,
            fontFamily,
          });
        } else {
          // Fallback to Regular if font data not available
          const googleFont = createGoogleFontObject({ binaryLoader, fontFamily, style: 'Regular', weight: 400 });

          addToHistory(googleFont);
          registerGoogleFont(fontFamily);

          await applyFontToElements({
            font: googleFont,
            fontFamily,
          });
        }
      }
    },
    [addToHistory, applyFontToElements, binaryLoader, registerGoogleFont],
  );

  const renderFontFamilyBlock = (): React.JSX.Element => {
    const options: FontOption[] = availableFontFamilies.map((family) => getFontFamilyOption(family));

    if (isMobile) {
      return (
        <ObjectPanelItem.Select
          id="font_family"
          label={langOptionPanel.font_family}
          onChange={handleFontFamilyChange}
          options={
            historyFontFamilies.length > 0
              ? [
                  { label: langOptionPanel.recently_used, type: 'group' },
                  ...historyFontFamilies,
                  { type: 'divider' },
                  ...options,
                ]
              : [...options, { type: 'divider' }]
          }
          selected={
            fontFamily.hasMultiValue ? { label: '-', value: '' } : { label: fontFamily.value, value: fontFamily.value }
          }
        />
      );
    }

    const isOnlyOneOption = options.length === 1;

    return (
      <Select
        className={styles['font-family']}
        disabled={isOnlyOneOption}
        dropdownRender={(menu) => (
          <>
            {menu}
            <div className={styles['google-fonts-separator']}>
              <div
                className={styles['google-fonts-button']}
                onClick={() => dialogCaller.showGoogleFontsPanel(handleGoogleFontSelect)}
              >
                {lang.google_font_panel.more_google_fonts}
              </div>
            </div>
          </>
        )}
        filterOption={(input: string, option?: DefaultOptionType) => {
          if (option?.family) return false;

          if (option?.value) {
            const family = option.value as string;
            const searchKey = input.toLowerCase();

            if (family.toLowerCase().includes(searchKey)) {
              return true;
            }

            const fontName = FontFuncs.fontNameMap.get(family) || '';

            if (fontName.toLowerCase().includes(searchKey)) {
              return true;
            }
          }

          return false;
        }}
        onChange={(value, option) => handleFontFamilyChange(value, option as FontOption)}
        onKeyDown={(e) => e.stopPropagation()}
        options={[
          { label: langOptionPanel.recently_used, options: historyFontFamilies, title: 'history' },
          { label: null, options, title: 'normal' },
        ]}
        placement="bottomRight"
        popupClassName={styles['font-family-dropdown']}
        popupMatchSelectWidth={false}
        showSearch
        title={langOptionPanel.font_family}
        value={fontFamily.hasMultiValue ? '-' : fontFamily.value}
      />
    );
  };

  const renderFontStyleBlock = (): React.JSX.Element => {
    const { fontStyle } = configs;

    if (isMobile) {
      return (
        <ObjectPanelItem.Select
          id="font_style"
          label={langOptionPanel.font_style}
          onChange={handleFontStyleChange}
          options={styleOptions}
          selected={
            fontFamily.hasMultiValue || fontStyle.hasMultiValue
              ? { label: '-', value: '' }
              : { label: fontStyle.value, value: fontStyle.value }
          }
        />
      );
    }

    const disabled = styleOptions.length <= 1;

    return (
      <Select
        className={styles['font-style']}
        disabled={disabled}
        onChange={(value) => handleFontStyleChange(value)}
        onKeyDown={(e) => e.stopPropagation()}
        options={styleOptions}
        popupMatchSelectWidth={false}
        title={langOptionPanel.font_style}
        value={fontFamily.hasMultiValue || fontStyle.hasMultiValue ? '-' : fontStyle.value}
      />
    );
  };

  const renderFontSizeBlock = (): React.JSX.Element => {
    const { fontSize } = configs;

    return isMobile ? (
      <ObjectPanelItem.Number
        decimal={0}
        hasMultiValue={fontSize.hasMultiValue}
        id="font_size"
        label={langOptionPanel.font_size}
        min={1}
        unit="px"
        updateValue={handleFontSizeChange}
        value={fontSize.value}
      />
    ) : (
      <div className={styles['font-size']} title={langOptionPanel.font_size}>
        <UnitInput
          className={{ 'option-input': true }}
          decimal={0}
          defaultValue={fontSize.value}
          displayMultiValue={fontSize.hasMultiValue}
          getValue={(val) => handleFontSizeChange(val)}
          id="font_size"
          min={1}
          unit="px"
        />
      </div>
    );
  };

  const renderLetterSpacingBlock = (): React.JSX.Element => {
    const { letterSpacing } = configs;

    return isMobile ? (
      <ObjectPanelItem.Number
        hasMultiValue={letterSpacing.hasMultiValue}
        id="letter_spacing"
        label={langOptionPanel.letter_spacing}
        unit="em"
        updateValue={handleLetterSpacingChange}
        value={letterSpacing.value}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={langOptionPanel.letter_spacing}>
          <OptionPanelIcons.LetterSpacing />
        </div>
        <UnitInput
          className={{ 'option-input': true }}
          defaultValue={letterSpacing.value}
          displayMultiValue={letterSpacing.hasMultiValue}
          getValue={(val) => handleLetterSpacingChange(val)}
          id="letter_spacing"
          step={0.05}
          unit=""
        />
      </div>
    );
  };

  const renderLineSpacingBlock = (): React.JSX.Element => {
    const { lineSpacing } = configs;

    return isMobile ? (
      <ObjectPanelItem.Number
        decimal={1}
        hasMultiValue={lineSpacing.hasMultiValue}
        id="line_spacing"
        label={langOptionPanel.line_spacing}
        min={0.8}
        unit=""
        updateValue={handleLineSpacingChange}
        value={lineSpacing.value}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={langOptionPanel.line_spacing}>
          <OptionPanelIcons.LineSpacing />
        </div>
        <UnitInput
          className={{ 'option-input': true }}
          decimal={1}
          defaultValue={lineSpacing.value}
          displayMultiValue={lineSpacing.hasMultiValue}
          getValue={(val) => handleLineSpacingChange(val)}
          id="line_spacing"
          min={0.8}
          step={0.1}
          unit=""
        />
      </div>
    );
  };

  const renderVerticalTextSwitch = (): React.JSX.Element => {
    const { isVertical } = configs;
    const checked = !isVertical.hasMultiValue && isVertical.value;

    return isMobile ? (
      <ObjectPanelItem.Item
        content={<Switch checked={checked} />}
        id="vertical-text"
        label={langOptionPanel.vertical_text}
        onClick={() => handleVerticalTextClick(checked)}
      />
    ) : (
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          className={classNames(styles['vertical-text'], { [styles.active]: checked })}
          icon={<OptionPanelIcons.VerticalText />}
          id="vertical-text"
          onClick={() => handleVerticalTextClick(checked)}
          title={langOptionPanel.vertical_text}
          type="text"
        />
      </ConfigProvider>
    );
  };

  const renderMultiLineTextOptions = (): React.JSX.Element => (
    <>
      {renderLineSpacingBlock()}
      {renderLetterSpacingBlock()}
      {renderVerticalTextSwitch()}
      {!showColorPanel && !isMobile && <InFillBlock elems={[elem]} />}
    </>
  );

  const renderTextPathOptions = (): React.JSX.Element => {
    const path = Array.from(elem.querySelectorAll('path'));
    const { startOffset, verticalAlign } = configs;

    return (
      <>
        {renderLetterSpacingBlock()}
        <StartOffsetBlock
          hasMultiValue={startOffset.hasMultiValue}
          onValueChange={handleStartOffsetChange}
          value={startOffset.value}
        />
        <VerticalAlignBlock
          hasMultiValue={verticalAlign.hasMultiValue}
          onValueChange={handleVerticalAlignChange}
          value={verticalAlign.value}
        />
        <InFillBlock elems={textElements} label={langOptionPanel.text_infill} />
        <InFillBlock elems={path} id="path_infill" label={langOptionPanel.path_infill} />
      </>
    );
  };

  return (
    <>
      {isMobile ? (
        <>
          {renderFontFamilyBlock()}
          {renderFontStyleBlock()}
          {renderFontSizeBlock()}
          {isTextPath ? renderTextPathOptions() : renderMultiLineTextOptions()}
        </>
      ) : (
        <ConfigProvider theme={selectTheme}>
          <div className={styles.panel}>
            {renderFontFamilyBlock()}
            <div className={styles.row}>
              {renderFontSizeBlock()}
              {renderFontStyleBlock()}
            </div>
            {isTextPath ? renderTextPathOptions() : <div className={styles.row}>{renderMultiLineTextOptions()}</div>}
            {!isTextPath && showVariableText && (
              <VariableTextBlock elems={textElements} id={configs.id.value} withDivider />
            )}
          </div>
        </ConfigProvider>
      )}
    </>
  );
};

export default TextOptions;
