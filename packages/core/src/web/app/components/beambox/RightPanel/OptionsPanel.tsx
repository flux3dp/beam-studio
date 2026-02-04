import React, { useMemo } from 'react';

import { match, P } from 'ts-pattern';

import { CanvasElements } from '@core/app/constants/canvasElements';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import { isVariableTextSupported } from '@core/helpers/variableText';

import ColorPanel from './ColorPanel';
import ObjectPanelItem from './ObjectPanelItem';
import ImageOptions from './OptionsBlocks/ImageOptions';
import InFillBlock from './OptionsBlocks/InFillBlock';
import MultiColorOptions from './OptionsBlocks/MultiColorOptions';
import PolygonOptions from './OptionsBlocks/PolygonOptions';
import RectOptions from './OptionsBlocks/RectOptions';
import TextOptions from './OptionsBlocks/TextOptions';
import VariableTextBlock from './OptionsBlocks/VariableTextBlock';
import styles from './OptionsPanel.module.scss';

interface Props {
  elem: null | SVGElement;
}

function OptionsPanel({ elem }: Props): React.JSX.Element {
  const isMobile = useIsMobile();
  const workarea = useWorkarea();
  const supportVariableBlock = useMemo(isVariableTextSupported, [workarea]);
  const showVariableBlock = useMemo(
    () => !isMobile && supportVariableBlock && elem?.getAttribute('data-props'),
    [elem, supportVariableBlock, isMobile],
  );
  const isFullColor = elem ? getData(getObjectLayer(elem)?.elem, 'fullcolor') : false;
  const elemTagName = useMemo(() => elem?.tagName.toLowerCase(), [elem]);
  const showColorPanel = useMemo(() => {
    if (!elem || !CanvasElements.fillableWithContainers.includes(elemTagName!)) {
      return false;
    }

    return isFullColor;
  }, [elem, elemTagName, isFullColor]);

  const contents = useMemo(() => {
    if (!elem) return [];

    const tagName = elem.tagName.toLowerCase();
    const colorOrInfill = (key = 'infill') =>
      showColorPanel ? <ColorPanel elem={elem} key="color" /> : <InFillBlock elems={[elem]} key={key} />;

    return match(tagName)
      .with('rect', () => [<RectOptions elem={elem} key="rect" />, colorOrInfill('fill')])
      .with('polygon', () => [<PolygonOptions elem={elem} key="polygon" />, colorOrInfill('fill')])
      .with('text', () => [
        <TextOptions elem={elem} key="text" showColorPanel={showColorPanel} textElements={[elem as SVGTextElement]} />,
        showColorPanel ? (
          <ColorPanel elem={elem} key="color" />
        ) : isMobile ? (
          <InFillBlock elems={[elem]} key="fill" />
        ) : null,
      ])
      .with(P.union('image', 'img'), () =>
        elem.getAttribute('data-fullcolor') === '1' ? [] : [<ImageOptions elem={elem} key="image" />],
      )
      .with('g', () => {
        if (elem.getAttribute('data-textpath-g')) {
          const textElem = elem.querySelector('text');

          return [<TextOptions elem={elem} isTextPath key="textpath" textElements={[textElem!]} />];
        }

        if (!elem.querySelector(':scope > :not(text):not(g[data-textpath-g="1"])')) {
          const textElems = Array.from(elem.querySelectorAll('text'));
          const includeTextPath = Boolean(elem.querySelector('g[data-textpath-g="1"]'));

          return [
            <TextOptions elem={elem} isTextPath={includeTextPath} key="textpath" textElements={textElems} />,
            !includeTextPath && isMobile ? <InFillBlock elems={[elem]} key="fill" /> : null,
          ];
        }

        return [
          showColorPanel ? (
            <MultiColorOptions elem={elem} key="multi-color" />
          ) : (
            <InFillBlock elems={[elem]} key="infill" />
          ),
        ];
      })
      .with('use', () => [
        showColorPanel ? <MultiColorOptions elem={elem} key="multi-color" /> : null,
        showVariableBlock ? (
          <VariableTextBlock elems={[elem]} id={elem.id} key="variable" withDivider={showColorPanel} />
        ) : null,
      ])
      .otherwise(() => [colorOrInfill()]);
  }, [elem, showColorPanel, showVariableBlock, isMobile]);

  return isMobile ? (
    <div className={styles.container}>
      <ObjectPanelItem.Divider />
      {contents?.reverse()}
    </div>
  ) : (
    <>
      {contents.filter(Boolean).length ? (
        <div className={styles.panel}>
          <div className={styles.title}>OPTIONS</div>
          {contents}
        </div>
      ) : null}
    </>
  );
}

export default OptionsPanel;
