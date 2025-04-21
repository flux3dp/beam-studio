import React, { useMemo } from 'react';

import ColorPanel from '@core/app/views/beambox/Right-Panels/ColorPanel';
import ObjectPanelItem from '@core/app/views/beambox/Right-Panels/ObjectPanelItem';
import ImageOptions from '@core/app/views/beambox/Right-Panels/Options-Blocks/ImageOptions';
import InFillBlock from '@core/app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import MultiColorOptions from '@core/app/views/beambox/Right-Panels/Options-Blocks/MultiColorOptions';
import PolygonOptions from '@core/app/views/beambox/Right-Panels/Options-Blocks/PolygonOptions';
import RectOptions from '@core/app/views/beambox/Right-Panels/Options-Blocks/RectOptions';
import TextOptions from '@core/app/views/beambox/Right-Panels/Options-Blocks/TextOptions';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import { useIsMobile } from '@core/helpers/system-helper';

import styles from './OptionsPanel.module.scss';

interface Props {
  elem: Element;
  polygonSides?: number;
  rx: number;
  updateDimensionValues: (val: { [key: string]: any }) => void;
  updateObjectPanel: () => void;
}

function OptionsPanel({ elem, polygonSides, rx, updateDimensionValues, updateObjectPanel }: Props): React.JSX.Element {
  const isMobile = useIsMobile();
  let contents: Array<null | React.JSX.Element> = [];
  const isFullColor = getData(getObjectLayer(elem as SVGElement)?.elem, 'fullcolor');
  const elemTagName = useMemo(() => elem?.tagName.toLowerCase(), [elem]);
  const showColorPanel = useMemo(() => {
    if (!elem || !['ellipse', 'g', 'path', 'polygon', 'rect', 'text', 'use'].includes(elemTagName)) {
      return false;
    }

    return isFullColor;
  }, [elem, elemTagName, isFullColor]);

  if (elem) {
    const tagName = elem.tagName.toLowerCase();

    if (tagName === 'rect') {
      contents = [
        <RectOptions elem={elem} key="rect" rx={rx} updateDimensionValues={updateDimensionValues} />,
        showColorPanel ? <ColorPanel elem={elem} key="color" /> : <InFillBlock elem={elem} key="fill" />,
      ];
    } else if (tagName === 'polygon') {
      contents = [
        <PolygonOptions elem={elem} key="polygon" polygonSides={polygonSides!} />,
        showColorPanel ? <ColorPanel elem={elem} key="color" /> : <InFillBlock elem={elem} key="fill" />,
      ];
    } else if (tagName === 'text') {
      contents = [
        <TextOptions
          elem={elem}
          key="text"
          showColorPanel={showColorPanel}
          textElement={elem as SVGTextElement}
          updateDimensionValues={updateDimensionValues}
          updateObjectPanel={updateObjectPanel}
        />,
        showColorPanel ? (
          <ColorPanel elem={elem} key="color" />
        ) : isMobile ? (
          <InFillBlock elem={elem} key="fill" />
        ) : null,
      ];
    } else if (tagName === 'image' || tagName === 'img') {
      if (elem.getAttribute('data-fullcolor') === '1') {
        contents = [];
      } else {
        contents = [<ImageOptions elem={elem} key="image" updateObjectPanel={updateObjectPanel} />];
      }
    } else if (tagName === 'g' && elem.getAttribute('data-textpath-g')) {
      const textElem = elem.querySelector('text');

      contents = [
        <TextOptions
          elem={elem}
          isTextPath
          key="textpath"
          textElement={textElem!}
          updateDimensionValues={updateDimensionValues}
          updateObjectPanel={updateObjectPanel}
        />,
      ];
    } else if (tagName === 'g') {
      contents = [
        showColorPanel ? <MultiColorOptions elem={elem} key="multi-color" /> : <InFillBlock elem={elem} key="infill" />,
      ];
    } else if (tagName === 'use') {
      contents = [showColorPanel ? <MultiColorOptions elem={elem} key="multi-color" /> : null];
    } else {
      contents = [showColorPanel ? <ColorPanel elem={elem} key="color" /> : <InFillBlock elem={elem} key="infill" />];
    }
  }

  return isMobile ? (
    <div className={styles.container}>
      <ObjectPanelItem.Divider />
      {contents?.reverse()}
    </div>
  ) : (
    <>
      {contents.filter(Boolean).length && (
        <div className={styles.panel}>
          <div className={styles.title}>OPTIONS</div>
          {contents}
        </div>
      )}
    </>
  );
}

export default OptionsPanel;
