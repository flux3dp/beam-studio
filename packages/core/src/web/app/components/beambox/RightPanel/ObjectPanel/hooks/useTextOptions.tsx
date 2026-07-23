import React from 'react';

import Content from '@core/app/components/beambox/RightPanel/common/Content';
import FontBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/TextOptions/components/FontBlock';
import FontSizeBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/TextOptions/components/FontSizeBlock';
import VerticalSwitchBlock from '@core/app/components/beambox/RightPanel/OptionsBlocks/TextOptions/components/VerticalSwitchBlock';
import { useSelectedElementStore } from '@core/app/stores/element/selectedElementStore';

import FitTextAlignBlock from '../../OptionsBlocks/TextOptions/components/FitTextAlignBlock';
import LetterSpacingBlock from '../../OptionsBlocks/TextOptions/components/LetterSpacingBlock';
import LineSpacingBlock from '../../OptionsBlocks/TextOptions/components/LineSpacingBlock';
import StartOffsetBlock from '../../OptionsBlocks/TextOptions/components/StartOffsetBlock';
import TextContentBlock from '../../OptionsBlocks/TextOptions/components/TextContentBlock';
import TextTransformBlock from '../../OptionsBlocks/TextOptions/components/TextTransformBlock';
import VerticalAlignBlock from '../../OptionsBlocks/TextOptions/components/VerticalAlignBlock';
import { useFontHandlers } from '../../OptionsBlocks/TextOptions/hooks/useFontHandlers';
import { useTextConfigs } from '../../OptionsBlocks/TextOptions/hooks/useTextConfigs';
import VariableTextBlock from '../../OptionsBlocks/VariableOptions/VariableTextBlock';

interface Props {
  elem: SVGElement;
  textElements: SVGTextElement[];
}

export const useTextOptions = ({ elem, textElements }: Props) => {
  const visibleTextOptions = useSelectedElementStore((state) => state.objectPanelData!.textOptions);
  const { configs, handleSizeChange, onConfigChange } = useTextConfigs({
    elem,
    textElements,
  });
  const { fontFamily } = configs;

  const { handleStartOffsetChange, handleVerticalAlignChange, handleVerticalTextClick, waitForWebFont } =
    useFontHandlers({ elem, fontFamily, onConfigChange, textElements });

  const component: Record<string, React.ReactNode> = {
    fit_text_align: visibleTextOptions.has('fit_text_align') && <FitTextAlignBlock textElements={textElements} />,
    font_block: visibleTextOptions.has('font') && (
      <FontBlock
        fontFamily={fontFamily}
        fontStyle={configs.fontStyle}
        onConfigChange={onConfigChange}
        textElements={textElements}
        waitForWebFont={waitForWebFont}
      />
    ),
    font_size: visibleTextOptions.has('font_size') && (
      <FontSizeBlock onSizeChange={handleSizeChange} textElements={textElements} />
    ),
    letter_spacing: visibleTextOptions.has('letter_spacing') && (
      <LetterSpacingBlock onSizeChange={handleSizeChange} textElements={textElements} />
    ),
    line_spacing: visibleTextOptions.has('line_spacing') && (
      <LineSpacingBlock onSizeChange={handleSizeChange} textElements={textElements} />
    ),
    text_content_block: visibleTextOptions.has('text_content') && <TextContentBlock textElement={textElements[0]} />,
    text_transform: visibleTextOptions.has('text_transform') && (
      <TextTransformBlock onSizeChange={handleSizeChange} textElements={textElements} />
    ),
    textpath_align: visibleTextOptions.has('vertical_align') && (
      <VerticalAlignBlock
        hasMultiValue={configs.verticalAlign.hasMultiValue}
        onValueChange={handleVerticalAlignChange}
        value={configs.verticalAlign.value}
      />
    ),
    textpath_offset: visibleTextOptions.has('start_offset') && (
      <StartOffsetBlock
        hasMultiValue={configs.startOffset.hasMultiValue}
        onValueChange={handleStartOffsetChange}
        value={configs.startOffset.value}
      />
    ),
    variable_text: visibleTextOptions.has('variable_text') && (
      <VariableTextBlock elems={textElements} id={configs.id.value} withDivider />
    ),
    vertical_switch: visibleTextOptions.has('vertical_switch') && (
      <VerticalSwitchBlock isVertical={configs.isVertical} onToggle={handleVerticalTextClick} />
    ),
  };

  component.font = (
    <Content>
      {component.font_block}
      {component.font_size}
    </Content>
  );
  component.text_content = (
    <Content>
      {component.text_content_block}
      {component.text_transform}
      {component.vertical_switch}
      {component.variable_text}
    </Content>
  );

  return component;
};
