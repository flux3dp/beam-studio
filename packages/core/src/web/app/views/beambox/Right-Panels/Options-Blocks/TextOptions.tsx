import React, { useEffect, useState } from 'react';

import { Button, ConfigProvider, Switch } from 'antd';
import classNames from 'classnames';

import FontFuncs from '@core/app/actions/beambox/font-funcs';
import textPathEdit, { VerticalAlign } from '@core/app/actions/beambox/textPathEdit';
import progressCaller from '@core/app/actions/progress-caller';
import { iconButtonTheme, selectTheme } from '@core/app/constants/antd-config';
import FluxIcons from '@core/app/icons/flux/FluxIcons';
import OptionPanelIcons from '@core/app/icons/option-panel/OptionPanelIcons';
import history from '@core/app/svgedit/history/history';
import selector from '@core/app/svgedit/selector';
import textEdit from '@core/app/svgedit/text/textedit';
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
import { isMobile } from '@core/helpers/system-helper';
import type { FontDescriptor } from '@core/interfaces/IFont';

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
  isTextPath?: boolean;
  showColorPanel?: boolean;
  textElement: SVGTextElement;
  updateDimensionValues?: (data: { fontStyle: string }) => void;
  updateObjectPanel: () => void;
}

interface State {
  fontFamily: string;
  fontSize: number;

  fontStyle: any;
  id: string;
  isVerti: boolean;
  letterSpacing: number;
  lineSpacing: number;
  startOffset?: number;
  verticalAlign?: VerticalAlign;
}

const TextOptions = ({
  elem,
  isTextPath,
  showColorPanel,
  textElement,
  updateDimensionValues,
  updateObjectPanel,
}: Props) => {
  const [availableFontFamilies, setAvailableFontFamilies] = useState<string[]>([]);
  const [state, setState] = useState<State>({
    fontFamily: '',
    fontSize: 200,
    fontStyle: '',
    id: '',
    isVerti: false,
    letterSpacing: 0,
    lineSpacing: 1,
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

      if (elemId === state.id) {
        return;
      }

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

        font = FontFuncs.requestFontByFamilyAndStyle({ family, italic, weight });
      }

      console.log(font);

      const sanitizedDefaultFontFamily = (() => {
        // use these font if postscriptName cannot find in user PC
        const fontFamilyFallback = ['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans'];
        const sanitizedFontFamily = [font.family, ...fontFamilyFallback].find((f) => availableFontFamilies.includes(f));

        return sanitizedFontFamily;
      })();

      if (sanitizedDefaultFontFamily !== font.family) {
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
          startOffset = Number.parseInt(textPath.getAttribute('startOffset'), 10);

          const alignmentBaseline = textPath.getAttribute('alignment-baseline');

          if (alignmentBaseline === 'middle') {
            verticalAlign = VerticalAlign.MIDDLE;
          } else if (alignmentBaseline === 'top') {
            verticalAlign = VerticalAlign.TOP;
          } else {
            verticalAlign = VerticalAlign.BOTTOM;
          }
        }
      }

      setState({
        fontFamily: sanitizedDefaultFontFamily,
        fontSize: Number(textElement.getAttribute('font-size')),
        fontStyle: font.style,
        id: elemId,
        isVerti: textElement.getAttribute('data-verti') === 'true',
        letterSpacing: textEdit.getLetterSpacing(textElement),
        lineSpacing: Number.parseFloat(textElement.getAttribute('data-line-spacing') || '1'),
        startOffset,
        verticalAlign,
      });
    };

    if (availableFontFamilies.length > 0) {
      getStateFromElem();
    } else {
      getFontFamilies();
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [textElement, availableFontFamilies]);

  useEffect(() => {
    const getStyleOptions = (family: string) => {
      const fontStyles = FontFuncs.requestFontsOfTheFontFamily(family).map((f) => f.style);
      const options = fontStyles.map((option: string) => ({ label: option, value: option }));

      setStyleOptions(options);
    };

    getStyleOptions(fontFamily);
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

  const handleFontFamilyChange = async (newFamily) => {
    let family = newFamily;

    if (typeof newFamily === 'object') {
      family = newFamily.value;
    }

    const newFont = FontFuncs.requestFontsOfTheFontFamily(family)[0];
    const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(newFont, getCurrentUser());

    if (!success) {
      return;
    }

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

  const renderFontFamilyBlock = (): React.JSX.Element => {
    const renderOption = (option) => {
      const src = fontHelper.getWebFontPreviewUrl(option.value);

      if (src) {
        return (
          <div className={styles['family-option']}>
            <div className={styles['img-container']}>
              <img alt={option.label} draggable="false" src={src} />
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
        label: typeof fontName === 'string' ? fontName : option,
        value: option,
      });

      return { label, value: option };
    });

    if (isMobile()) {
      return (
        <ObjectPanelItem.Select
          id="font_family"
          label={LANG.font_family}
          onChange={handleFontFamilyChange}
          options={options}
          selected={{ label: fontFamily, value: fontFamily }}
        />
      );
    }

    const isOnlyOneOption = options.length === 1;

    return (
      <Select
        className={styles['font-family']}
        disabled={isOnlyOneOption}
        dropdownMatchSelectWidth={false}
        filterOption={(input: string, option?: { label: React.JSX.Element; value: string }) => {
          if (option?.value) {
            const searchKey = input.toLowerCase();

            if (option.value.toLowerCase().includes(searchKey)) {
              return true;
            }

            const fontName = FontFuncs.fontNameMap.get(option.value) || '';

            if (fontName.toLowerCase().includes(searchKey)) {
              return true;
            }
          }

          return false;
        }}
        onChange={(value) => handleFontFamilyChange(value)}
        onKeyDown={(e) => e.stopPropagation()}
        options={options}
        placement="bottomRight"
        popupClassName={styles['font-family-dropdown']}
        showSearch
        title={LANG.font_family}
        value={{ value: fontFamily }}
      />
    );
  };

  const handleFontStyleChange = async (val: string) => {
    const font = FontFuncs.requestFontByFamilyAndStyle({
      family: fontFamily,
      style: val,
    });
    const { fontLoadedPromise, success } = await fontHelper.applyMonotypeStyle(font, getCurrentUser());

    if (!success) {
      return;
    }

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

  const renderFontStyleBlock = (): React.JSX.Element => {
    const { fontStyle } = state;

    if (isMobile()) {
      return (
        <ObjectPanelItem.Select
          id="font_style"
          label={LANG.font_style}
          onChange={handleFontStyleChange}
          options={styleOptions}
          selected={{ label: fontStyle, value: fontStyle }}
        />
      );
    }

    const isOnlyOneOption = styleOptions.length === 1;

    return (
      <Select
        className={styles['font-style']}
        disabled={isOnlyOneOption}
        dropdownMatchSelectWidth={false}
        onChange={(value) => handleFontStyleChange(value)}
        onKeyDown={(e) => e.stopPropagation()}
        options={styleOptions}
        title={LANG.font_style}
        value={fontStyle}
      />
    );
  };

  const handleFontSizeChange = (val: number): void => {
    textEdit.setFontSize(val, [textElement]);
    setState({ ...state, fontSize: val });
  };

  const renderFontSizeBlock = (): React.JSX.Element => {
    const { fontSize } = state;

    return isMobile() ? (
      <ObjectPanelItem.Number
        decimal={0}
        id="font_size"
        label={LANG.font_size}
        min={1}
        unit="px"
        updateValue={handleFontSizeChange}
        value={fontSize}
      />
    ) : (
      <div className={styles['font-size']} title={LANG.font_size}>
        <UnitInput
          className={{ 'option-input': true }}
          decimal={0}
          defaultValue={fontSize}
          getValue={(val) => handleFontSizeChange(val)}
          id="font_size"
          min={1}
          unit="px"
        />
      </div>
    );
  };

  const handleLetterSpacingChange = (val: number): void => {
    textEdit.setLetterSpacing(val, textElement);
    setState({ ...state, letterSpacing: val });
  };

  const renderLetterSpacingBlock = (): React.JSX.Element => {
    const { letterSpacing } = state;

    return isMobile() ? (
      <ObjectPanelItem.Number
        id="letter_spacing"
        label={LANG.letter_spacing}
        unit="em"
        updateValue={handleLetterSpacingChange}
        value={letterSpacing}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={LANG.letter_spacing}>
          <OptionPanelIcons.LetterSpacing />
        </div>
        <UnitInput
          className={{ 'option-input': true }}
          defaultValue={letterSpacing}
          getValue={(val) => handleLetterSpacingChange(val)}
          id="letter_spacing"
          step={0.05}
          unit=""
        />
      </div>
    );
  };

  const handleLineSpacingChange = (val: number): void => {
    textEdit.setLineSpacing(val);
    setState({ ...state, lineSpacing: val });
  };

  const renderLineSpacingBlock = (): React.JSX.Element => {
    const { lineSpacing } = state;

    return isMobile() ? (
      <ObjectPanelItem.Number
        decimal={1}
        id="line_spacing"
        label={LANG.line_spacing}
        min={0.8}
        unit=""
        updateValue={handleLineSpacingChange}
        value={lineSpacing}
      />
    ) : (
      <div className={styles.spacing}>
        <div className={styles.label} title={LANG.line_spacing}>
          <OptionPanelIcons.LineSpacing />
        </div>
        <UnitInput
          className={{ 'option-input': true }}
          decimal={1}
          defaultValue={lineSpacing}
          getValue={(val) => handleLineSpacingChange(val)}
          id="line_spacing"
          min={0.8}
          step={0.1}
          unit=""
        />
      </div>
    );
  };

  const handleVerticalTextClick = (): void => {
    const { isVerti } = state;

    textEdit.setIsVertical(!isVerti);
    setState({ ...state, isVerti: !isVerti });
  };

  const renderVerticalTextSwitch = (): React.JSX.Element => {
    const { isVerti } = state;

    return isMobile() ? (
      <ObjectPanelItem.Item
        content={<Switch checked={isVerti} />}
        id="vertical-text"
        label={LANG.vertical_text}
        onClick={handleVerticalTextClick}
      />
    ) : (
      <ConfigProvider theme={iconButtonTheme}>
        <Button
          className={classNames(styles['vertical-text'], { [styles.active]: isVerti })}
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
    textPathEdit.setStartOffset(val, textElement);
    setState({ ...state, startOffset: val });
  };

  const handleVerticalAlignChange = (val: VerticalAlign): void => {
    textPathEdit.setVerticalAlign(textElement, val);
    setState({ ...state, verticalAlign: val });
  };

  const renderMultiLineTextOptions = (): React.JSX.Element => (
    <>
      {renderLineSpacingBlock()}
      {renderLetterSpacingBlock()}
      {renderVerticalTextSwitch()}
      {!showColorPanel && !isMobile() && <InFillBlock elem={elem} />}
    </>
  );

  const renderTextPathOptions = (): React.JSX.Element => {
    const path = elem.querySelector('path');
    const { startOffset, verticalAlign } = state;

    return (
      <>
        {renderLetterSpacingBlock()}
        <StartOffsetBlock onValueChange={handleStartOffsetChange} value={startOffset} />
        <VerticalAlignBlock onValueChange={handleVerticalAlignChange} value={verticalAlign} />
        <InFillBlock elem={textElement} label={LANG.text_infill} />
        <InFillBlock elem={path} id="path_infill" label={LANG.path_infill} />
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
        {isTextPath ? renderTextPathOptions() : <div className={styles.row}>{renderMultiLineTextOptions()}</div>}
      </div>
    </ConfigProvider>
  );
};

export default TextOptions;
