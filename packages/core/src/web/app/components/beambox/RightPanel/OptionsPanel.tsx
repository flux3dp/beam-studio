import React, { useEffect, useMemo, useState } from 'react';

import { match, P } from 'ts-pattern';

import { CanvasElements } from '@core/app/constants/canvasElements';
import { useIsMobile } from '@core/app/stores/screenStore';
import { useStlStore } from '@core/app/stores/stlStore';
import { POINT_CLOUD_ATTR } from '@core/app/svgedit/stl/constants';
import { is3dProjection, isPhotoPlaneProjection, isStlProjection } from '@core/app/svgedit/stl/getters';
import eventEmitterFactory from '@core/helpers/eventEmitterFactory';
import useWorkarea from '@core/helpers/hooks/useWorkarea';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { isVariableTextSupported } from '@core/helpers/variableText';

import ColorPanel from './ColorPanel';
import ObjectPanelItem from './ObjectPanelItem';
import ImageOptions from './OptionsBlocks/ImageOptions';
import InFillBlock from './OptionsBlocks/InFillBlock';
import MultiColorOptions from './OptionsBlocks/MultiColorOptions';
import PolygonOptions from './OptionsBlocks/PolygonOptions';
import RectOptions from './OptionsBlocks/RectOptions';
import TextOptions from './OptionsBlocks/TextOptions';
import ThreeDOptions from './OptionsBlocks/ThreeDOptions';
import useThreeDSourceOptions from './OptionsBlocks/useThreeDSourceOptions';
import VariableTextBlock from './OptionsBlocks/VariableTextBlock';
import styles from './OptionsPanel.module.scss';

const objectPanelEventEmitter = eventEmitterFactory.createEventEmitter('object-panel');

const getIsFullColor = (elem: null | SVGElement): boolean =>
  elem ? (getData(getObjectLayer(elem)?.elem, 'fullcolor') ?? false) : false;

interface Props {
  elem: null | SVGElement;
}

function OptionsPanel({ elem }: Props): React.JSX.Element {
  const isMobile = useIsMobile();
  const stlObjectKind = useStlStore((state) => (elem ? state.objects[elem.id]?.kind : undefined));
  const workarea = useWorkarea();
  const supportVariableBlock = useMemo(isVariableTextSupported, [workarea]);
  const showVariableBlock = useMemo(
    () => !isMobile && supportVariableBlock && elem?.getAttribute('data-props'),
    [elem, supportVariableBlock, isMobile],
  );
  const [isFullColor, setIsFullColor] = useState(() => getIsFullColor(elem));
  const threeDSourceOptions = useThreeDSourceOptions(
    elem && isStlProjection(elem) && !isPhotoPlaneProjection(elem) ? elem : null,
  );
  const optionElem = threeDSourceOptions.sourceElem ?? elem;

  useEffect(() => {
    const handleUpdateFullColor = () => setIsFullColor(getIsFullColor(elem));

    handleUpdateFullColor();
    objectPanelEventEmitter.on('UPDATE_FULL_COLOR', handleUpdateFullColor);

    return () => {
      objectPanelEventEmitter.off('UPDATE_FULL_COLOR', handleUpdateFullColor);
    };
  }, [elem]);

  const elemTagName = useMemo(() => optionElem?.tagName.toLowerCase(), [optionElem]);
  const showColorPanel = useMemo(() => {
    if (!elem || is3dProjection(elem) || !CanvasElements.fillableWithContainers.includes(elemTagName!)) {
      return false;
    }

    return isFullColor;
  }, [elem, elemTagName, isFullColor]);

  const contents = useMemo(() => {
    if (!elem) return [];

    // A generated point cloud is the final representation. The source bitmap remains in the SVG
    // for save/rebuild purposes, but none of its bitmap or 3D generation controls apply anymore.
    if (stlObjectKind === 'point-cloud' || elem.hasAttribute(POINT_CLOUD_ATTR.marker)) return [];

    // a projection rect is a `rect`, so without this it would fall into the RectOptions branch below
    // (corner radius) and get an infill toggle that acts on the rect's own fill
    if (isPhotoPlaneProjection(elem)) {
      return [<ImageOptions elem={elem} key="image" />, <ThreeDOptions elem={elem} hideEngravingMode key="3d" />];
    }

    if (isStlProjection(elem) && !threeDSourceOptions.sourceElem) {
      return [<InFillBlock elems={[elem]} key="3d-infill" />, <ThreeDOptions elem={elem} key="3d" />];
    }

    const sourceElem = threeDSourceOptions.sourceElem;
    const matchedElem = sourceElem ?? elem;
    const tagName = matchedElem.tagName.toLowerCase();
    const colorOrInfill = (key = 'infill') =>
      showColorPanel ? <ColorPanel elem={elem} key="color" /> : <InFillBlock elems={[elem]} key={key} />;

    const matchedOptions = match(tagName)
      .with('rect', () => [
        <RectOptions elem={elem} key="rect" roundedCorner={threeDSourceOptions.roundedCorner} />,
        colorOrInfill('fill'),
      ])
      .with('polygon', () => [
        <PolygonOptions elem={elem} key="polygon" sideControl={threeDSourceOptions.sideControl} />,
        colorOrInfill('fill'),
      ])
      .with('text', () => [
        <TextOptions
          elem={elem}
          key="text"
          onSourceChange={threeDSourceOptions.onTextChange}
          showColorPanel={showColorPanel}
          textElements={[matchedElem as SVGTextElement]}
        />,
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
        if (matchedElem.getAttribute('data-textpath-g')) {
          const textElem = matchedElem.querySelector('text');

          return [<TextOptions elem={elem} isTextPath key="textpath" textElements={[textElem!]} />];
        }

        if (!matchedElem.querySelector(':scope > :not(text):not(g[data-textpath-g="1"])')) {
          const textElems = Array.from(matchedElem.querySelectorAll('text'));
          const includeTextPath = Boolean(matchedElem.querySelector('g[data-textpath-g="1"]'));

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

    return is3dProjection(elem) ? [...matchedOptions, <ThreeDOptions elem={elem} key="3d" />] : matchedOptions;
  }, [elem, showColorPanel, showVariableBlock, isMobile, threeDSourceOptions, stlObjectKind]);

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
