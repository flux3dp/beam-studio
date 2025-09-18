import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import classNames from 'classnames';

import FontFuncs, { registerGoogleFont } from '@core/app/actions/beambox/font-funcs';
import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import dialogCaller from '@core/app/actions/dialog-caller';
import { iconButtonTheme, selectTheme } from '@core/app/constants/antd-config';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { useGoogleFontStore } from '@core/app/stores/googleFontStore';
import { useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import type { Selector } from '@core/app/svgedit/selector';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import InFillBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import StartOffsetBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/StartOffsetBlock';
import VerticalAlignBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/VerticalAlignBlock';
import { useFontHandlers } from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/hooks/useFontHandlers';
import VariableTextBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/VariableTextBlock';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import fontHelper from '@core/helpers/fonts/fontHelper';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import { updateConfigs } from '@core/helpers/update-configs';
import useI18n from '@core/helpers/useI18n';
import { isVariableTextSupported } from '@core/helpers/variableText';
import type { GeneralFont, GoogleFont } from '@core/interfaces/IFont';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TextConfig, TextOption } from '@core/interfaces/ObjectPanel';

import styles from './index.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('font');
const isLocalFont = (font: GeneralFont) => 'path' in font;

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
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
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
  const { addToHistory, loadGoogleFontBinary, sessionLoadedFonts } = useGoogleFontStore();

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
        const cleanFontLower = cleanFontFamily.toLowerCase();
        const localFontMatch = availableFontFamilies.find((f) => f.toLowerCase() === cleanFontLower);
        // A font is considered a Google Font if it's either:
        // 1. In history but NOT in local system fonts (case-insensitive), OR
        // 2. In the loaded Google fonts from store (context-loaded fonts), OR
        // 3. In the session loaded fonts from the hook
        const isGoogleFontFromHistory = fontHistory.some((h) => h.toLowerCase() === cleanFontLower) && !localFontMatch;
        const isGoogleFontFromContext = sessionLoadedFonts.has(cleanFontFamily) && !localFontMatch;
        const isGoogleFontFromSession = sessionLoadedFonts.has(cleanFontFamily) && !localFontMatch;
        let font: GeneralFont;

        if (isGoogleFontFromHistory || isGoogleFontFromContext || isGoogleFontFromSession) {
          // Create synthetic Google Font object to bypass PostScript lookup
          // This is only for web fonts that are not available locally
          font = {
            family: cleanFontFamily,
            italic: textEdit.getItalic(textElement),
            postscriptName: cleanFontFamily.replace(/\s+/g, '') + '-Regular',
            style: 'Regular',
            weight: textEdit.getFontWeight(textElement) || 400,
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
        // Skip fallback for Google Fonts that are loaded via any source and available in the document
        // Also skip fallback if the font is available locally (case-insensitive)
        const fontFamilyLower = font.family.toLowerCase();
        const isLocalFont = availableFontFamilies.some((f) => f.toLowerCase() === fontFamilyLower);
        const isGoogleFontInHistory = fontHistory.some((h) => h.toLowerCase() === fontFamilyLower) && !isLocalFont;
        const isGoogleFontLoadedViaContext = sessionLoadedFonts.has(font.family) && !isLocalFont;
        const isGoogleFontLoadedViaSession = sessionLoadedFonts.has(font.family) && !isLocalFont;
        // A Google Font is considered "loaded" if it's from any source AND the browser confirms it's available
        const isGoogleFontLoaded =
          (isGoogleFontInHistory || isGoogleFontLoadedViaContext || isGoogleFontLoadedViaSession) &&
          document.fonts.check(`1em "${font.family}"`);

        if (!isGoogleFontLoaded && !isLocalFont) {
          // use these font if postscriptName cannot find in user PC
          const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'];
          const sanitizedFamily =
            [font.family, ...fontFamilyFallback].find((f) =>
              availableFontFamilies.some((local) => local.toLowerCase() === f.toLowerCase()),
            ) ||
            availableFontFamilies.find((local) =>
              [font.family, ...fontFamilyFallback].some((f) => f.toLowerCase() === local.toLowerCase()),
            )!;

          if (sanitizedFamily !== font.family) {
            const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedFamily)[0];

            console.warn(`unsupported font ${font.family}, fallback to ${sanitizedFamily}`);
            textEdit.setFontFamily(sanitizedFamily, true, [textElement]);
            textEdit.setFontPostscriptName(newFont.postscriptName, true, [textElement]);

            font = newFont;
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

    const systemFonts = FontFuncs.requestAvailableFontFamilies();
    const familyLower = family.toLowerCase();
    const localFontMatch = systemFonts.find((f) => f.toLowerCase() === familyLower);

    if (!localFontMatch) {
      await handleGoogleFontSelect(family);

      return;
    }

    const newFont = FontFuncs.requestFontsOfTheFontFamily(localFontMatch)[0];

    addToHistory(newFont);

    const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(newFont, getCurrentUser());

    if (!success) {
      return;
    }

    const batchCmd = new history.BatchCommand('Change Font family');

    [
      textEdit.setFontPostscriptName(newFont.postscriptName, true, textElements),
      textEdit.setItalic(newFont.italic, true, textElements),
      textEdit.setFontWeight(newFont.weight, true, textElements),
      textEdit.setFontFamily(localFontMatch, true, textElements),
    ].forEach((cmd) => {
      if (cmd) batchCmd.addSubCommand(cmd);
    });
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);

    if (!isLocalFont(newFont)) {
      await waitForWebFont(fontLoadedPromise);
    }

    const newStyle = newFont.style;

    onConfigChange('fontFamily', localFontMatch);
    onConfigChange('fontStyle', newStyle);
  };

  const handleGoogleFontSelect = useCallback(
    async (googleFontFamily: string) => {
      const localFonts = FontFuncs.requestAvailableFontFamilies();
      const googleFontLower = googleFontFamily.toLowerCase();
      const localFontMatch = localFonts.find((f) => f.toLowerCase() === googleFontLower);

      if (localFontMatch) {
        const localFont = FontFuncs.requestFontsOfTheFontFamily(localFontMatch)[0];

        addToHistory(localFont);

        const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(localFont, getCurrentUser());

        if (!success) {
          return;
        }

        const batchCmd = new history.BatchCommand('Change Font family');

        [
          textEdit.setFontPostscriptName(localFont.postscriptName, true, textElements),
          textEdit.setItalic(localFont.italic, true, textElements),
          textEdit.setFontWeight(localFont.weight, true, textElements),
          textEdit.setFontFamily(localFontMatch, true, textElements),
        ].forEach((cmd) => {
          if (cmd) batchCmd.addSubCommand(cmd);
        });
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);

        if (!isLocalFont(localFont)) {
          await waitForWebFont(fontLoadedPromise);
        }

        onConfigChange('fontFamily', localFontMatch);
        onConfigChange('fontStyle', localFont.style);
      } else {
        const googleFont: GoogleFont = {
          binaryLoader: loadGoogleFontBinary,
          family: googleFontFamily,
          italic: false,
          postscriptName: googleFontFamily.replace(/\s+/g, '') + '-Regular',
          source: 'google',
          style: 'Regular',
          weight: 400,
        };

        addToHistory(googleFont);
        registerGoogleFont(googleFont);

        const batchCmd = new history.BatchCommand('Change Font family');

        [
          textEdit.setFontPostscriptName(googleFont.postscriptName, true, textElements),
          textEdit.setItalic(googleFont.italic, true, textElements),
          textEdit.setFontWeight(googleFont.weight, true, textElements),
          textEdit.setFontFamily(googleFontFamily, true, textElements),
        ].forEach((cmd) => {
          if (cmd) batchCmd.addSubCommand(cmd);
        });
        svgCanvas.undoMgr.addCommandToHistory(batchCmd);

        await waitForWebFont();

        onConfigChange('fontFamily', googleFontFamily);
        onConfigChange('fontStyle', 'Regular');
      }
    },
    [addToHistory, textElements, waitForWebFont, onConfigChange, loadGoogleFontBinary],
  );

  const renderFontFamilyBlock = (): React.JSX.Element => {
    const options: FontOption[] = availableFontFamilies.map((option) => getFontFamilyOption(option));

    if (isMobile) {
      return (
        <ObjectPanelItem.Select
          id="font_family"
          label={lang.font_family}
          onChange={handleFontFamilyChange}
          options={
            historyFontFamilies.length > 0
              ? [{ label: lang.recently_used, type: 'group' }, ...historyFontFamilies, { type: 'divider' }, ...options]
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
                More Google Fonts...
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
          { label: lang.recently_used, options: historyFontFamilies, title: 'history' },
          { label: null, options, title: 'normal' },
        ]}
        placement="bottomRight"
        popupClassName={styles['font-family-dropdown']}
        popupMatchSelectWidth={false}
        showSearch
        title={lang.font_family}
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
          label={lang.font_style}
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
        title={lang.font_style}
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
        label={lang.font_size}
        min={1}
        unit="px"
        updateValue={handleFontSizeChange}
        value={fontSize.value}
      />
    ) : (
      <div className={styles['font-size']} title={lang.font_size}>
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
        label={lang.letter_spacing}
        unit="em"
        updateValue={handleLetterSpacingChange}
        value={letterSpacing.value}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={lang.letter_spacing}>
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
        label={lang.line_spacing}
        min={0.8}
        unit=""
        updateValue={handleLineSpacingChange}
        value={lineSpacing.value}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={lang.line_spacing}>
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
        label={lang.vertical_text}
        onClick={() => handleVerticalTextClick(checked)}
      />
    ) : (
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          className={classNames(styles['vertical-text'], { [styles.active]: checked })}
          icon={<OptionPanelIcons.VerticalText />}
          id="vertical-text"
          onClick={() => handleVerticalTextClick(checked)}
          title={lang.vertical_text}
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
        <InFillBlock elems={textElements} label={lang.text_infill} />
        <InFillBlock elems={path} id="path_infill" label={lang.path_infill} />
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
