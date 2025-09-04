import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import classNames from 'classnames';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import textPathEdit from '@core/app/actions/beambox/textPathEdit';
import progressCaller from '@core/app/actions/progress-caller';
import { iconButtonTheme, selectTheme } from '@core/app/constants/antd-config';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import { setStorage, useStorageStore } from '@core/app/stores/storageStore';
import history from '@core/app/svgedit/history/history';
import type { Selector } from '@core/app/svgedit/selector';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import InFillBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import GoogleFontsPanel from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/GoogleFontsPanel';
import StartOffsetBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/StartOffsetBlock';
import VerticalAlignBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/components/VerticalAlignBlock';
import VariableTextBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/VariableTextBlock';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import fontHelper from '@core/helpers/fonts/fontHelper';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import { updateConfigs } from '@core/helpers/update-configs';
import useI18n from '@core/helpers/useI18n';
import { isVariableTextSupported } from '@core/helpers/variableText';
import type { GeneralFont } from '@core/interfaces/IFont';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TextConfig, TextOption } from '@core/interfaces/ObjectPanel';

import styles from './index.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('font');
const isLocalFont = (font: GeneralFont) => 'path' in font;
const maxHistory = 5;

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
    <div style={{ fontFamily: `'${family}'`, maxHeight: 24 }}>{displayName}</div>
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
  const [styleOptions, setStyleOptions] = useState<FontOption[]>([]);
  const [showGoogleFontsPanel, setShowGoogleFontsPanel] = useState(false);
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

  const addToHistory = useCallback(
    (font: GeneralFont) => {
      if (!font.family) return;

      const newHistory = fontHistory.filter((name: string) => name !== font.family);

      newHistory.unshift(font.family);

      if (newHistory.length > maxHistory) newHistory.pop();

      setStorage('font-history', newHistory);
    },
    [fontHistory],
  );

  const historyFontFamilies = useMemo(
    () =>
      fontHistory
        .map((family) => {
          // Always show fonts in history, even if they're not system fonts (like Google Fonts)
          // This allows dynamically loaded Google Fonts to appear in the recently used section
          return getFontFamilyOption(family, true);
        })
        .filter(Boolean),
    [fontHistory],
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

      for (const textElement of textElements) {
        // Sanitize font family
        const postscriptName = textEdit.getFontPostscriptName(textElement);
        let font: GeneralFont;

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

        console.log(font);

        // Check if this font should use fallback
        // Skip fallback for Google Fonts that are in recently used history and loaded in the document
        const isGoogleFontInHistory = fontHistory.includes(font.family) && !availableFontFamilies.includes(font.family);
        const isGoogleFontLoaded = isGoogleFontInHistory && document.fonts.check(`1em "${font.family}"`);

        if (!isGoogleFontLoaded && !availableFontFamilies.includes(font.family)) {
          // use these font if postscriptName cannot find in user PC
          const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'];
          const sanitizedFamily = [font.family, ...fontFamilyFallback].find((f) => availableFontFamilies.includes(f))!;

          if (sanitizedFamily !== font.family) {
            const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedFamily)[0];

            console.warn(`unsupported font ${font.family}, fallback to ${sanitizedFamily}`);
            textEdit.setFontFamily(sanitizedFamily, true, [textElement]);
            textEdit.setFontPostscriptName(newFont.postscriptName, true, [textElement]);

            // Update the font variable to reflect the fallback
            font = newFont;
          }
        }

        // Update configs
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
  }, [elem, textElements, availableFontFamilies, configs.id.value, getFontFamilies, fontHistory]);

  useEffect(() => {
    const getStyleOptions = (family: string) => {
      const fontStyles = FontFuncs.requestFontsOfTheFontFamily(family).map((f) => f.style);
      const options = fontStyles.map((option: string) => ({ label: option, value: option }));

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

      selector.getSelectorManager().resizeSelectors([elem]);
      progressCaller.popById('load-font');
    },
    [elem],
  );

  const handleFontFamilyChange = async (newFamily: string, option: FontOption) => {
    // Check if this is the "More Google Fonts" option
    if (newFamily === 'more-google-fonts') {
      setShowGoogleFontsPanel(true);

      return;
    }

    const family = option.family ?? newFamily;

    // Check if this is a Google Font from history (not in system fonts)
    const isSystemFont = FontFuncs.requestAvailableFontFamilies().includes(family);

    if (!isSystemFont) {
      // Handle Google Font from history - delegate to handleGoogleFontSelect
      await handleGoogleFontSelect(family);

      return;
    }

    const newFont = FontFuncs.requestFontsOfTheFontFamily(family)[0];

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
      textEdit.setFontFamily(family, true, textElements),
    ].forEach((cmd) => {
      if (cmd) batchCmd.addSubCommand(cmd);
    });
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);

    if (!isLocalFont(newFont)) {
      await waitForWebFont(fontLoadedPromise);
    }

    const newStyle = newFont.style;

    onConfigChange('fontFamily', family);
    onConfigChange('fontStyle', newStyle);
  };

  const handleGoogleFontSelect = useCallback(
    async (googleFontFamily: string) => {
      // Create a synthetic font object for Google Fonts
      const googleFont: GeneralFont = {
        family: googleFontFamily,
        italic: false,
        postscriptName: googleFontFamily.replace(/\s+/g, '') + '-Regular',
        style: 'Regular',
        weight: 400,
      };

      console.log(`Selected Google Font:`, googleFont);

      // Add to history first
      addToHistory(googleFont);

      // Apply the font directly without monotype style check since it's Google Fonts
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

      // Wait for the web font to load
      await waitForWebFont();

      onConfigChange('fontFamily', googleFontFamily);
      onConfigChange('fontStyle', 'Regular');
    },
    [addToHistory, textElements, waitForWebFont, onConfigChange],
  );

  const renderFontFamilyBlock = (): React.JSX.Element => {
    const options: FontOption[] = availableFontFamilies.map((option) => getFontFamilyOption(option));

    // Add "More Google Fonts" option at the end
    const moreGoogleFontsOption: FontOption = {
      label: 'More Google Fonts...',
      value: 'more-google-fonts',
    };

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
            <div
              style={{
                border: '0.5px solid #000000',
                borderRadius: '4px',
              }}
            >
              <div
                onClick={() => handleFontFamilyChange('more-google-fonts', moreGoogleFontsOption)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                style={{
                  color: '#000000',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '5px 8px',
                  transition: 'background-color 0.2s',
                }}
              >
                More Google Fonts...
              </div>
            </div>
          </>
        )}
        filterOption={(input: string, option?: DefaultOptionType) => {
          // Hide history options
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
        options={
          // Note: title is used as css selector
          [
            { label: lang.recently_used, options: historyFontFamilies, title: 'history' },
            { label: null, options, title: 'normal' },
          ]
        }
        placement="bottomRight"
        popupClassName={styles['font-family-dropdown']}
        popupMatchSelectWidth={false}
        showSearch
        title={lang.font_family}
        value={fontFamily.hasMultiValue ? '-' : fontFamily.value}
      />
    );
  };

  const handleFontStyleChange = async (val: string) => {
    const font = FontFuncs.requestFontByFamilyAndStyle({
      family: fontFamily.value,
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

  const handleFontSizeChange = (val: number): void => {
    textEdit.setFontSize(val, textElements);
    onConfigChange('fontSize', val);
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

  const handleLetterSpacingChange = (val: number): void => {
    textEdit.setLetterSpacing(val, textElements);
    onConfigChange('letterSpacing', val);
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

  const handleLineSpacingChange = (val: number): void => {
    textEdit.setLineSpacing(val, textElements);
    onConfigChange('lineSpacing', val);
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

    const handleVerticalTextClick = (): void => {
      textEdit.setIsVertical(!checked, textElements);
      onConfigChange('isVertical', !checked);
    };

    return isMobile ? (
      <ObjectPanelItem.Item
        content={<Switch checked={checked} />}
        id="vertical-text"
        label={lang.vertical_text}
        onClick={handleVerticalTextClick}
      />
    ) : (
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          className={classNames(styles['vertical-text'], { [styles.active]: checked })}
          icon={<OptionPanelIcons.VerticalText />}
          id="vertical-text"
          onClick={handleVerticalTextClick}
          title={lang.vertical_text}
          type="text"
        />
      </ConfigProvider>
    );
  };

  const handleStartOffsetChange = (val: number): void => {
    textPathEdit.setStartOffset(val, elem as SVGGElement);
    onConfigChange('startOffset', val);
  };

  const handleVerticalAlignChange = (val: VerticalAlign): void => {
    textPathEdit.setVerticalAlign(val, elem as SVGGElement);
    onConfigChange('verticalAlign', val);
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

      <GoogleFontsPanel
        onClose={() => setShowGoogleFontsPanel(false)}
        onFontSelect={handleGoogleFontSelect}
        visible={showGoogleFontsPanel}
      />
    </>
  );
};

export default TextOptions;
