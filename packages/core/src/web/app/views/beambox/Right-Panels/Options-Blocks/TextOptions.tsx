/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Button, ConfigProvider, Switch } from 'antd';

import eventEmitterFactory from 'helpers/eventEmitterFactory';
import FluxIcons from 'app/icons/flux/FluxIcons';
import fontHelper from 'helpers/fonts/fontHelper';
import FontFuncs from 'app/actions/beambox/font-funcs';
import history from 'app/svgedit/history/history';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import OptionPanelIcons from 'app/icons/option-panel/OptionPanelIcons';
import progressCaller from 'app/actions/progress-caller';
import selector from 'app/svgedit/selector';
import textEdit from 'app/svgedit/text/textedit';
import textPathEdit, { VerticalAlign } from 'app/actions/beambox/textPathEdit';
import i18n from 'helpers/i18n';
import InFillBlock from 'app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import Select from 'app/widgets/AntdSelect';
import StartOffsetBlock from 'app/views/beambox/Right-Panels/Options-Blocks/TextOptions/StartOffsetBlock';
import VerticalAlignBlock from 'app/views/beambox/Right-Panels/Options-Blocks/TextOptions/VerticalAlignBlock';
import UnitInput from 'app/widgets/Unit-Input-v2';
import { FontDescriptor } from 'interfaces/IFont';
import { getCurrentUser } from 'helpers/api/flux-id';
import { getSVGAsync } from 'helpers/svg-editor-helper';
import { iconButtonTheme, selectTheme } from 'app/constants/antd-config';
import { isMobile } from 'helpers/system-helper';

import styles from './TextOptions.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const eventEmitter = eventEmitterFactory.createEventEmitter('font');
const LANG = i18n.lang.beambox.right_panel.object_panel.option_panel;
const isLocalFont = (font: FontDescriptor) => 'path' in font;

// TODO: add tests
interface Props {
  elem: Element;
  textElement: SVGTextElement;
  isTextPath?: boolean;
  updateObjectPanel: () => void;
  updateDimensionValues?: (data: { fontStyle: string }) => void;
  showColorPanel?: boolean;
}

interface State {
  id: string;
  fontFamily: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fontStyle: any;
  fontSize: number;
  letterSpacing: number;
  lineSpacing: number;
  startOffset?: number;
  verticalAlign?: VerticalAlign;
  isVerti: boolean;
}

const TextOptions = ({
  elem,
  textElement,
  isTextPath,
  updateObjectPanel,
  updateDimensionValues,
  showColorPanel,
}: Props) => {
  const [availableFontFamilies, setAvailableFontFamilies] = useState<string[]>([]);
  const [state, setState] = useState<State>({
    id: '',
    fontFamily: '',
    fontStyle: '',
    fontSize: 200,
    letterSpacing: 0,
    lineSpacing: 1,
    isVerti: false,
    startOffset: 0,
    verticalAlign: VerticalAlign.MIDDLE,
  });
  const { fontFamily } = state;
  const [styleOptions, setStyleOptions] = useState([]);

  const getFontFamilies = async () => {
    const families = FontFuncs.requestAvailableFontFamilies();
    setAvailableFontFamilies(families);
  };

  useEffect(() => {
    eventEmitter.on('GET_MONOTYPE_FONTS', getFontFamilies);
    return () => {
      eventEmitter.removeListener('GET_MONOTYPE_FONTS');
    };
  }, []);

  useEffect(() => {
    const getStateFromElem = async () => {
      const elemId = textElement.getAttribute('id');
      if (elemId === state.id) return;
      const postscriptName = textEdit.getFontPostscriptName(textElement);
      let font;
      if (postscriptName) {
        font = FontFuncs.getFontOfPostscriptName(postscriptName);
        if (!textElement.getAttribute('font-style')) {
          textElement.setAttribute('font-style', font.italic ? 'italic' : 'normal');
        }
        if (!textElement.getAttribute('font-weight')) {
          textElement.setAttribute('font-weight', font.weight ? font.weight : 'normal');
        }
      } else {
        const family = textEdit.getFontFamilyData(textElement);
        const weight = textEdit.getFontWeight(textElement);
        const italic = textEdit.getItalic(textElement);
        font = FontFuncs.requestFontByFamilyAndStyle({ family, weight, italic });
      }
      // eslint-disable-next-line no-console
      console.log(font);
      const sanitizedDefaultFontFamily = (() => {
        // use these font if postscriptName cannot find in user PC
        const fontFamilyFallback = [
          'PingFang TC',
          'Arial',
          'Times New Roman',
          'Ubuntu',
          'Noto Sans',
        ];
        const sanitizedFontFamily = [font.family, ...fontFamilyFallback].find((f) =>
          availableFontFamilies.includes(f)
        );
        return sanitizedFontFamily;
      })();

      if (sanitizedDefaultFontFamily !== font.family) {
        // eslint-disable-next-line no-console
        console.log(`unsupported font ${font.family}, fallback to ${sanitizedDefaultFontFamily}`);
        textEdit.setFontFamily(sanitizedDefaultFontFamily, true);
        const newFont = FontFuncs.requestFontsOfTheFontFamily(sanitizedDefaultFontFamily)[0];
        textEdit.setFontPostscriptName(newFont.postscriptName, true);
      }
      updateDimensionValues({ fontStyle: font.style });

      let startOffset: number;
      let verticalAlign: VerticalAlign;
      if (textElement.getAttribute('data-textpath')) {
        const textPath = textElement.querySelector('textPath');
        if (textPath) {
          // Use parseInt parse X% to number X
          startOffset = parseInt(textPath.getAttribute('startOffset'), 10);
          const alignmentBaseline = textPath.getAttribute('alignment-baseline');
          if (alignmentBaseline === 'middle') verticalAlign = VerticalAlign.MIDDLE;
          else if (alignmentBaseline === 'top') verticalAlign = VerticalAlign.TOP;
          else verticalAlign = VerticalAlign.BOTTOM;
        }
      }

      setState({
        id: elemId,
        fontFamily: sanitizedDefaultFontFamily,
        fontStyle: font.style,
        fontSize: Number(textElement.getAttribute('font-size')),
        letterSpacing: textEdit.getLetterSpacing(textElement),
        lineSpacing: parseFloat(textElement.getAttribute('data-line-spacing') || '1'),
        isVerti: textElement.getAttribute('data-verti') === 'true',
        startOffset,
        verticalAlign,
      });
    };
    if (availableFontFamilies.length > 0) getStateFromElem();
    else getFontFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textElement, availableFontFamilies]);

  useEffect(() => {
    const getStyleOptions = (family: string) => {
      const fontStyles = FontFuncs.requestFontsOfTheFontFamily(family).map((f) => f.style);
      const options = fontStyles.map((option: string) => ({ value: option, label: option }));
      setStyleOptions(options);
    };
    getStyleOptions(fontFamily);
  }, [fontFamily]);

  const waitForWebFont = async (fontLoadedPromise?: Promise<void>) => {
    await progressCaller.openNonstopProgress({
      id: 'load-font',
      caption: i18n.lang.beambox.right_panel.object_panel.actions_panel.fetching_web_font,
    });
    await document.fonts.ready;
    if (fontLoadedPromise) {
      await fontLoadedPromise;
    }
    selector.getSelectorManager().resizeSelectors([elem]);
    progressCaller.popById('load-font');
  };

  const handleFontFamilyChange = async (newFamily) => {
    let family = newFamily;
    if (typeof newFamily === 'object') {
      family = newFamily.value;
    }
    const newFont = FontFuncs.requestFontsOfTheFontFamily(family)[0];
    const { success, fontLoadedPromise } = await fontHelper.applyMonotypeStyle(
      newFont,
      getCurrentUser()
    );
    if (!success) return;
    const batchCmd = new history.BatchCommand('Change Font family');
    let cmd = textEdit.setFontPostscriptName(newFont.postscriptName, true, [textElement]);
    batchCmd.addSubCommand(cmd);
    cmd = textEdit.setItalic(newFont.italic, true, textElement);
    batchCmd.addSubCommand(cmd);
    cmd = textEdit.setFontWeight(newFont.weight, true, textElement);
    batchCmd.addSubCommand(cmd);
    if (fontHelper.usePostscriptAsFamily(newFont)) {
      cmd = textEdit.setFontFamily(newFont.postscriptName, true, [textElement]);
      batchCmd.addSubCommand(cmd);
      cmd = textEdit.setFontFamilyData(family, true, [textElement]);
      batchCmd.addSubCommand(cmd);
    } else {
      cmd = textEdit.setFontFamily(family, true, [textElement]);
      batchCmd.addSubCommand(cmd);
    }
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);

    if (!isLocalFont(newFont)) {
      await waitForWebFont(fontLoadedPromise);
    }

    const newStyle = newFont.style;
    updateDimensionValues({ fontStyle: newStyle });
    setState({
      ...state,
      fontFamily: family,
      fontStyle: newStyle,
    });
    updateObjectPanel();
  };

  const renderFontFamilyBlock = (): JSX.Element => {
    const renderOption = (option) => {
      const src = fontHelper.getWebFontPreviewUrl(option.value);
      if (src) {
        return (
          <div className={styles['family-option']}>
            <div className={styles['img-container']}>
              <img src={src} alt={option.label} draggable="false" />
            </div>
            {src.includes('monotype') && <FluxIcons.FluxPlus />}
          </div>
        );
      }
      return <div style={{ fontFamily: `'${option.value}'`, maxHeight: 24 }}>{option.label}</div>;
    };
    const options = availableFontFamilies.map((option) => {
      const fontName = FontFuncs.fontNameMap.get(option);
      const label = renderOption({
        value: option,
        label: typeof fontName === 'string' ? fontName : option,
      });
      return { value: option, label };
    });
    if (isMobile()) {
      return (
        <ObjectPanelItem.Select
          id="font_family"
          selected={{ value: fontFamily, label: fontFamily }}
          options={options}
          onChange={handleFontFamilyChange}
          label={LANG.font_family}
        />
      );
    }
    const isOnlyOneOption = options.length === 1;
    return (
      <Select
        className={styles['font-family']}
        popupClassName={styles['font-family-dropdown']}
        title={LANG.font_family}
        value={{ value: fontFamily }}
        options={options}
        onChange={(value) => handleFontFamilyChange(value)}
        onKeyDown={(e) => e.stopPropagation()}
        dropdownMatchSelectWidth={false}
        disabled={isOnlyOneOption}
        filterOption={(input: string, option?: { label: JSX.Element; value: string }) => {
          if (option?.value) {
            const searchKey = input.toLowerCase();
            if (option.value.toLowerCase().includes(searchKey)) return true;
            const fontName = FontFuncs.fontNameMap.get(option.value) || '';
            if (fontName.toLowerCase().includes(searchKey)) return true;
          }
          return false;
        }}
        placement="bottomRight"
        showSearch
      />
    );
  };

  const handleFontStyleChange = async (val: string) => {
    const font = FontFuncs.requestFontByFamilyAndStyle({
      family: fontFamily,
      style: val,
    });
    const { success, fontLoadedPromise } = await fontHelper.applyMonotypeStyle(
      font,
      getCurrentUser()
    );
    if (!success) return;
    const batchCmd = new history.BatchCommand('Change Font Style');
    let cmd = textEdit.setFontPostscriptName(font.postscriptName, true, [textElement]);
    batchCmd.addSubCommand(cmd);
    if (fontHelper.usePostscriptAsFamily(font)) {
      cmd = textEdit.setFontFamily(font.postscriptName, true, [textElement]);
      batchCmd.addSubCommand(cmd);
    }
    cmd = textEdit.setItalic(font.italic, true, textElement);
    batchCmd.addSubCommand(cmd);
    cmd = textEdit.setFontWeight(font.weight, true, textElement);
    batchCmd.addSubCommand(cmd);
    svgCanvas.undoMgr.addCommandToHistory(batchCmd);

    if (!isLocalFont(font)) {
      await waitForWebFont(fontLoadedPromise);
    }

    updateDimensionValues({ fontStyle: val });
    setState({ ...state, fontStyle: val });
    updateObjectPanel();
  };

  const renderFontStyleBlock = (): JSX.Element => {
    const { fontStyle } = state;

    if (isMobile()) {
      return (
        <ObjectPanelItem.Select
          id="font_style"
          selected={{ value: fontStyle, label: fontStyle }}
          options={styleOptions}
          onChange={handleFontStyleChange}
          label={LANG.font_style}
        />
      );
    }
    const isOnlyOneOption = styleOptions.length === 1;
    return (
      <Select
        className={styles['font-style']}
        title={LANG.font_style}
        value={fontStyle}
        options={styleOptions}
        onChange={(value) => handleFontStyleChange(value)}
        onKeyDown={(e) => e.stopPropagation()}
        dropdownMatchSelectWidth={false}
        disabled={isOnlyOneOption}
      />
    );
  };

  const handleFontSizeChange = (val: number): void => {
    textEdit.setFontSize(val, [textElement]);
    setState({ ...state, fontSize: val });
  };

  const renderFontSizeBlock = (): JSX.Element => {
    const { fontSize } = state;
    return isMobile() ? (
      <ObjectPanelItem.Number
        id="font_size"
        label={LANG.font_size}
        value={fontSize}
        min={1}
        updateValue={handleFontSizeChange}
        unit="px"
        decimal={0}
      />
    ) : (
      <div className={styles['font-size']} title={LANG.font_size}>
        <UnitInput
          id="font_size"
          min={1}
          unit="px"
          decimal={0}
          className={{ 'option-input': true }}
          defaultValue={fontSize}
          getValue={(val) => handleFontSizeChange(val)}
        />
      </div>
    );
  };

  const handleLetterSpacingChange = (val: number): void => {
    textEdit.setLetterSpacing(val, textElement);
    setState({ ...state, letterSpacing: val });
  };

  const renderLetterSpacingBlock = (): JSX.Element => {
    const { letterSpacing } = state;
    return isMobile() ? (
      <ObjectPanelItem.Number
        id="letter_spacing"
        label={LANG.letter_spacing}
        value={letterSpacing}
        updateValue={handleLetterSpacingChange}
        unit="em"
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={LANG.letter_spacing}>
          <OptionPanelIcons.LetterSpacing />
        </div>
        <UnitInput
          id="letter_spacing"
          unit=""
          step={0.05}
          className={{ 'option-input': true }}
          defaultValue={letterSpacing}
          getValue={(val) => handleLetterSpacingChange(val)}
        />
      </div>
    );
  };

  const handleLineSpacingChange = (val: number): void => {
    textEdit.setLineSpacing(val);
    setState({ ...state, lineSpacing: val });
  };

  const renderLineSpacingBlock = (): JSX.Element => {
    const { lineSpacing } = state;
    return isMobile() ? (
      <ObjectPanelItem.Number
        id="line_spacing"
        label={LANG.line_spacing}
        value={lineSpacing}
        min={0.8}
        updateValue={handleLineSpacingChange}
        unit=""
        decimal={1}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={LANG.line_spacing}>
          <OptionPanelIcons.LineSpacing />
        </div>
        <UnitInput
          id="line_spacing"
          unit=""
          min={0.8}
          step={0.1}
          decimal={1}
          className={{ 'option-input': true }}
          defaultValue={lineSpacing}
          getValue={(val) => handleLineSpacingChange(val)}
        />
      </div>
    );
  };

  const handleVerticalTextClick = (): void => {
    const { isVerti } = state;
    textEdit.setIsVertical(!isVerti);
    setState({ ...state, isVerti: !isVerti });
  };

  const renderVerticalTextSwitch = (): JSX.Element => {
    const { isVerti } = state;
    return isMobile() ? (
      <ObjectPanelItem.Item
        id="vertical-text"
        content={<Switch checked={isVerti} />}
        label={LANG.vertical_text}
        onClick={handleVerticalTextClick}
      />
    ) : (
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          id="vertical-text"
          type="text"
          className={classNames(styles['vertical-text'], { [styles.active]: isVerti })}
          title={LANG.vertical_text}
          icon={<OptionPanelIcons.VerticalText />}
          onClick={handleVerticalTextClick}
        />
      </ConfigProvider>
    );
  };

  const handleStartOffsetChange = (val: number): void => {
    textPathEdit.setStartOffset(val, textElement);
    setState({ ...state, startOffset: val });
  };

  const handleVerticalAlignChange = (val: VerticalAlign): void => {
    textPathEdit.setVerticalAlign(textElement, val);
    setState({ ...state, verticalAlign: val });
  };

  const renderMultiLineTextOptions = (): JSX.Element => (
    <>
      {renderLineSpacingBlock()}
      {renderLetterSpacingBlock()}
      {renderVerticalTextSwitch()}
      {!showColorPanel && !isMobile() && <InFillBlock elem={elem} />}
    </>
  );

  const renderTextPathOptions = (): JSX.Element => {
    const path = elem.querySelector('path');
    const { startOffset, verticalAlign } = state;
    return (
      <>
        {renderLetterSpacingBlock()}
        <StartOffsetBlock value={startOffset} onValueChange={handleStartOffsetChange} />
        <VerticalAlignBlock value={verticalAlign} onValueChange={handleVerticalAlignChange} />
        <InFillBlock elem={textElement} label={LANG.text_infill} />
        <InFillBlock elem={path} label={LANG.path_infill} id="path_infill" />
      </>
    );
  };

  return isMobile() ? (
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
        {isTextPath ? (
          renderTextPathOptions()
        ) : (
          <div className={styles.row}>{renderMultiLineTextOptions()}</div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default TextOptions;
