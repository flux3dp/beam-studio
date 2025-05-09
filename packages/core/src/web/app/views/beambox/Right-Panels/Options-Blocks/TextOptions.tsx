import React, { useContext, useEffect, useRef, useState } from 'react';

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
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import InFillBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import StartOffsetBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/StartOffsetBlock';
import VerticalAlignBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions/VerticalAlignBlock';
import Select from '@core/app/widgets/AntdSelect';
import UnitInput from '@core/app/widgets/Unit-Input-v2';
import { getCurrentUser } from '@core/helpers/api/flux-id';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import fontHelper from '@core/helpers/fonts/fontHelper';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import storage from '@core/implementations/storage';
import type { GeneralFont } from '@core/interfaces/IFont';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';
import type { TextConfig, TextOption } from '@core/interfaces/ObjectPanel';

import styles from './TextOptions.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('font');
const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;
const isLocalFont = (font: GeneralFont) => 'path' in font;
const maxHistory = 5;

// TODO: add tests
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
  isVerti: { hasMultiValue: false, value: false },
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
  const isMobile = useIsMobile();
  const { updateObjectPanel } = useContext(ObjectPanelContext);
  const [availableFontFamilies, setAvailableFontFamilies] = useState<string[]>([]);
  const [historyFontFamilies, setHistoryFontFamilies] = useState<FontOption[]>([]);
  const [configs, setConfigs] = useState(defaultTextConfigs);
  const { fontFamily } = configs;
  const [styleOptions, setStyleOptions] = useState<FontOption[]>([]);
  const selectorRef = useRef(selector.getSelectorManager().requestSelector(elem));

  useEffect(() => {
    selectorRef.current = selector.getSelectorManager().requestSelector(elem);
  }, [elem]);

  const onConfigChange = <T extends keyof TextOption>(key: T, value: TextOption[T]) => {
    setConfigs((prev) => ({ ...prev, [key]: { hasMultiValue: false, value } }));
    selectorRef.current.resize();
    updateObjectPanel();
  };

  const addToHistory = (font: GeneralFont) => {
    if (!font.family) return;

    const history: string[] = (storage.get('font-history') || []).filter((name: string) => name !== font.family);

    if (!history.includes(font.family)) {
      history.unshift(font.family);

      if (history.length > maxHistory) {
        history.pop();
      }

      storage.set('font-history', history);
    }

    const historyOption = getFontFamilyOption(font.family, true);
    const newHistoryFontFamilies = historyFontFamilies.filter((option) => option.family !== font.family);

    newHistoryFontFamilies.unshift(historyOption);

    if (newHistoryFontFamilies.length > maxHistory) {
      newHistoryFontFamilies.pop();
    }

    setHistoryFontFamilies(newHistoryFontFamilies);
  };

  const getFontFamilies = async () => {
    const families = FontFuncs.requestAvailableFontFamilies();

    setAvailableFontFamilies(families);

    const history: string[] = storage.get('font-history') || [];
    const historyOptions: FontOption[] = [];

    history.forEach((family) => {
      if (families.includes(family)) {
        historyOptions.push(getFontFamilyOption(family, true));
      }
    });
    setHistoryFontFamilies(historyOptions);
  };

  useEffect(() => {
    eventEmitter.on('GET_MONOTYPE_FONTS', getFontFamilies);

    return () => {
      eventEmitter.removeListener('GET_MONOTYPE_FONTS');
    };
  }, []);

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

        // use these font if postscriptName cannot find in user PC
        const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'];
        const sanitizedFamily = [font.family, ...fontFamilyFallback].find((f) => availableFontFamilies.includes(f))!;

        if (sanitizedFamily !== font.family) {
          const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedFamily)[0];

          console.warn(`unsupported font ${font.family}, fallback to ${sanitizedFamily}`);
          textEdit.setFontFamily(sanitizedFamily, true, [textElement]);
          textEdit.setFontPostscriptName(newFont.postscriptName, true, [textElement]);
        }

        // Update configs
        if (!newConfigs.fontFamily?.hasMultiValue) {
          if (!newConfigs.fontFamily) {
            newConfigs.fontFamily = { hasMultiValue: false, value: sanitizedFamily };
            newConfigs.fontStyle = { hasMultiValue: false, value: font.style };
          } else if (newConfigs.fontFamily.value !== sanitizedFamily) {
            newConfigs.fontFamily.hasMultiValue = true;
          } else if (!newConfigs.fontStyle!.hasMultiValue && newConfigs.fontStyle!.value !== font.style) {
            newConfigs.fontStyle!.hasMultiValue = true;
          }
        }

        if (!newConfigs.fontSize?.hasMultiValue) {
          const fontSize = textEdit.getFontSize(textElement);

          if (!newConfigs.fontSize) {
            newConfigs.fontSize = { hasMultiValue: false, value: fontSize };
          } else if (newConfigs.fontSize.value !== fontSize) {
            newConfigs.fontSize.hasMultiValue = true;
          }
        }

        if (!newConfigs.letterSpacing?.hasMultiValue) {
          const letterSpacing = textEdit.getLetterSpacing(textElement);

          if (!newConfigs.letterSpacing) {
            newConfigs.letterSpacing = { hasMultiValue: false, value: letterSpacing };
          } else if (newConfigs.letterSpacing.value !== letterSpacing) {
            newConfigs.letterSpacing.hasMultiValue = true;
          }
        }

        if (!newConfigs.lineSpacing?.hasMultiValue) {
          const lineSpacing = textEdit.getLineSpacing(textElement);

          if (!newConfigs.lineSpacing) {
            newConfigs.lineSpacing = { hasMultiValue: false, value: lineSpacing };
          } else if (newConfigs.lineSpacing.value !== lineSpacing) {
            newConfigs.lineSpacing.hasMultiValue = true;
          }
        }

        if (!newConfigs.isVerti?.hasMultiValue) {
          const isVerti = textEdit.getIsVertical(textElement);

          if (!newConfigs.isVerti) {
            newConfigs.isVerti = { hasMultiValue: false, value: isVerti };
          } else if (newConfigs.isVerti.value !== isVerti) {
            newConfigs.isVerti.hasMultiValue = true;
          }
        }

        if (textElement.getAttribute('data-textpath')) {
          const textPath = textElement.querySelector('textPath');

          if (textPath) {
            if (!newConfigs.startOffset?.hasMultiValue) {
              const startOffset = textPathEdit.getStartOffset(textPath);

              if (!newConfigs.startOffset) {
                newConfigs.startOffset = { hasMultiValue: false, value: startOffset };
              } else if (newConfigs.startOffset.value !== startOffset) {
                newConfigs.startOffset.hasMultiValue = true;
              }
            }

            if (!newConfigs.verticalAlign?.hasMultiValue) {
              const verticalAlign = textPathEdit.getVerticalAlign(textPath);

              if (!newConfigs.verticalAlign) {
                newConfigs.verticalAlign = { hasMultiValue: false, value: verticalAlign };
              } else if (newConfigs.verticalAlign.value !== verticalAlign) {
                newConfigs.verticalAlign.hasMultiValue = true;
              }
            }
          }
        }
      }

      setConfigs({ ...defaultTextConfigs, ...newConfigs });
      selectorRef.current.resize();
    };

    if (availableFontFamilies.length > 0) {
      getStateFromElem();
    } else {
      getFontFamilies();
    }
  }, [elem, textElements, availableFontFamilies, configs.id.value]);

  useEffect(() => {
    const getStyleOptions = (family: string) => {
      const fontStyles = FontFuncs.requestFontsOfTheFontFamily(family).map((f) => f.style);
      const options = fontStyles.map((option: string) => ({ label: option, value: option }));

      setStyleOptions(options);
    };

    if (fontFamily.hasMultiValue) setStyleOptions([]);
    else getStyleOptions(fontFamily.value);
  }, [fontFamily]);

  const waitForWebFont = async (fontLoadedPromise?: Promise<void>) => {
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
  };

  const handleFontFamilyChange = async (newFamily: string, option: FontOption) => {
    const family = option.family ?? newFamily;
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

  const renderFontFamilyBlock = (): React.JSX.Element => {
    const options: FontOption[] = availableFontFamilies.map((option) => getFontFamilyOption(option));

    if (isMobile) {
      return (
        <ObjectPanelItem.Select
          id="font_family"
          label={LANG.font_family}
          onChange={handleFontFamilyChange}
          options={
            historyFontFamilies.length > 0
              ? [{ label: LANG.recently_used, type: 'group' }, ...historyFontFamilies, { type: 'divider' }, ...options]
              : options
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
            { label: LANG.recently_used, options: historyFontFamilies, title: 'history' },
            { label: null, options, title: 'normal' },
          ]
        }
        placement="bottomRight"
        popupClassName={styles['font-family-dropdown']}
        popupMatchSelectWidth={false}
        showSearch
        title={LANG.font_family}
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
          label={LANG.font_style}
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
        title={LANG.font_style}
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
        label={LANG.font_size}
        min={1}
        unit="px"
        updateValue={handleFontSizeChange}
        value={fontSize.value}
      />
    ) : (
      <div className={styles['font-size']} title={LANG.font_size}>
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
        label={LANG.letter_spacing}
        unit="em"
        updateValue={handleLetterSpacingChange}
        value={letterSpacing.value}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={LANG.letter_spacing}>
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
        label={LANG.line_spacing}
        min={0.8}
        unit=""
        updateValue={handleLineSpacingChange}
        value={lineSpacing.value}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={LANG.line_spacing}>
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
    const { isVerti } = configs;
    const checked = !isVerti.hasMultiValue && isVerti.value;

    const handleVerticalTextClick = (): void => {
      textEdit.setIsVertical(!checked, textElements);
      onConfigChange('isVerti', !checked);
    };

    return isMobile ? (
      <ObjectPanelItem.Item
        content={<Switch checked={checked} />}
        id="vertical-text"
        label={LANG.vertical_text}
        onClick={handleVerticalTextClick}
      />
    ) : (
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          className={classNames(styles['vertical-text'], { [styles.active]: checked })}
          icon={<OptionPanelIcons.VerticalText />}
          id="vertical-text"
          onClick={handleVerticalTextClick}
          title={LANG.vertical_text}
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
        <InFillBlock elems={textElements} label={LANG.text_infill} />
        <InFillBlock elems={path} id="path_infill" label={LANG.path_infill} />
      </>
    );
  };

  return isMobile ? (
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
      </div>
    </ConfigProvider>
  );
};

export default TextOptions;
