import React, { useContext, useEffect, useMemo } from 'react';

import { ConfigProvider } from 'antd';
import { useShallow } from 'zustand/react/shallow';

import { selectTheme } from '@core/app/constants/antd-config';
import { ObjectPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext';
import InFillBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import VariableTextBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/VariableTextBlock';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';
import { isVariableTextSupported } from '@core/helpers/variableText';

import FontFamilySelector from './components/FontControls/FontFamilySelector';
import FontSizeControl from './components/FontControls/FontSizeControl';
import FontStyleSelector from './components/FontControls/FontStyleSelector';
import LetterSpacingControl from './components/TextFormatting/LetterSpacingControl';
import LineSpacingControl from './components/TextFormatting/LineSpacingControl';
import VerticalTextToggle from './components/TextFormatting/VerticalTextToggle';
import StartOffsetBlock from './components/TextPathOptions/StartOffsetBlock';
import VerticalAlignBlock from './components/TextPathOptions/VerticalAlignBlock';
import { useFontOperations } from './hooks/useFontOperations';
import { useTextConfiguration } from './hooks/useTextConfiguration';
import { useTextPathOperations } from './hooks/useTextPathOperations';
import styles from './index.module.scss';
import { useTextOptionsStore } from './stores/useTextOptionsStore';

interface Props {
  elem: Element;
  isTextPath?: boolean;
  showColorPanel?: boolean;
  textElements: SVGTextElement[];
}

const TextOptions: React.FC<Props> = ({ elem, isTextPath, showColorPanel, textElements }) => {
  const lang = useI18n().beambox.right_panel.object_panel.option_panel;
  const isMobile = useIsMobile();
  const { updateObjectPanel } = useContext(ObjectPanelContext);
  const workarea = useWorkarea();
  const showVariableText = useMemo(isVariableTextSupported, [workarea]);

  const { configs, setOperations } = useTextOptionsStore(
    useShallow((state) => ({ configs: state.configs, setOperations: state.setOperations })),
  );

  // Initialize configuration hook
  const { addToHistory, onConfigChange } = useTextConfiguration({ elem, textElements, updateObjectPanel });

  // Get font operations
  const fontOperations = useFontOperations({ addToFontHistory: addToHistory, elem, onConfigChange, textElements });

  // Get text path operations
  const textPathOperations = useTextPathOperations({ elem, onConfigChange });

  // Set operations in the store so child components can access them
  useEffect(() => {
    setOperations({
      handleFontFamilyChange: fontOperations.handleFontFamilyChange,
      handleFontSizeChange: fontOperations.handleFontSizeChange,
      handleFontStyleChangeWithFamily: fontOperations.handleFontStyleChange,
      handleLetterSpacingChange: fontOperations.handleLetterSpacingChange,
      handleLineSpacingChange: fontOperations.handleLineSpacingChange,
      handleStartOffsetChange: textPathOperations.handleStartOffsetChange,
      handleVerticalAlignChange: textPathOperations.handleVerticalAlignChange,
      handleVerticalTextChange: fontOperations.handleVerticalTextChange,
    });
  }, [fontOperations, textPathOperations, setOperations]);

  const renderMultiLineTextOptions = (): React.JSX.Element => (
    <>
      <LineSpacingControl />
      <LetterSpacingControl />
      <VerticalTextToggle />
      {!showColorPanel && !isMobile && <InFillBlock elems={[elem]} />}
    </>
  );

  const renderTextPathOptions = (): React.JSX.Element => {
    const path = Array.from(elem.querySelectorAll('path'));

    return (
      <>
        <LetterSpacingControl />
        <StartOffsetBlock />
        <VerticalAlignBlock />
        <InFillBlock elems={textElements} label={lang.text_infill} />
        <InFillBlock elems={path} id="path_infill" label={lang.path_infill} />
      </>
    );
  };

  return isMobile ? (
    <>
      <FontFamilySelector />
      <FontStyleSelector />
      <FontSizeControl />
      {isTextPath ? renderTextPathOptions() : renderMultiLineTextOptions()}
    </>
  ) : (
    <ConfigProvider theme={selectTheme}>
      <div className={styles.panel}>
        <FontFamilySelector />
        <div className={styles.row}>
          <FontSizeControl />
          <FontStyleSelector />
        </div>
        {isTextPath ? renderTextPathOptions() : <div className={styles.row}>{renderMultiLineTextOptions()}</div>}
        {!isTextPath && showVariableText && (
          <VariableTextBlock elems={textElements} id={configs.id.value} withDivider />
        )}
      </div>
    </ConfigProvider>
  );
};

export default TextOptions;
