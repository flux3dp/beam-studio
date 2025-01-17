import React, { useMemo } from 'react';

import ColorPanel from 'app/views/beambox/Right-Panels/ColorPanel';
import ImageOptions from 'app/views/beambox/Right-Panels/Options-Blocks/ImageOptions';
import InFillBlock from 'app/views/beambox/Right-Panels/Options-Blocks/InFillBlock';
import MultiColorOptions from 'app/views/beambox/Right-Panels/Options-Blocks/MultiColorOptions';
import ObjectPanelItem from 'app/views/beambox/Right-Panels/ObjectPanelItem';
import PolygonOptions from 'app/views/beambox/Right-Panels/Options-Blocks/PolygonOptions';
import RectOptions from 'app/views/beambox/Right-Panels/Options-Blocks/RectOptions';
import TextOptions from 'app/views/beambox/Right-Panels/Options-Blocks/TextOptions';
import { getObjectLayer } from 'helpers/layer/layer-helper';
import { useIsMobile } from 'helpers/system-helper';

import styles from './OptionsPanel.module.scss';

interface Props {
  elem: Element;
  rx: number;
  polygonSides?: number;
  updateObjectPanel: () => void;
  updateDimensionValues: (val: { [key: string]: any }) => void;
}

function OptionsPanel({
  elem,
  rx,
  polygonSides,
  updateObjectPanel,
  updateDimensionValues,
}: Props): JSX.Element {
  const isMobile = useIsMobile();
  let contents: JSX.Element[];
  const showColorPanel = useMemo(() => {
    if (!elem) return false;
    if (!['rect', 'ellipse', 'path', 'text', 'polygon', 'g', 'use'].includes(elem?.tagName.toLowerCase())) return false;
    return getObjectLayer(elem as SVGElement)?.elem?.getAttribute('data-fullcolor') === '1';
  }, [elem]);
  if (elem) {
    const tagName = elem.tagName.toLowerCase();
    if (tagName === 'rect') {
      contents = [
        <RectOptions
          key="rect"
          elem={elem}
          rx={rx}
          updateDimensionValues={updateDimensionValues}
        />,
        showColorPanel ? (
          <ColorPanel key="color" elem={elem} />
        ) : (
          <InFillBlock key="fill" elem={elem} />
        ),
      ];
    } else if (tagName === 'polygon') {
      contents = [
        <PolygonOptions key="polygon" elem={elem} polygonSides={polygonSides} />,
        showColorPanel ? (
          <ColorPanel key="color" elem={elem} />
        ) : (
          <InFillBlock key="fill" elem={elem} />
        ),
      ];
    } else if (tagName === 'text') {
      contents = [
        <TextOptions
          key="text"
          elem={elem}
          textElement={elem as SVGTextElement}
          updateObjectPanel={updateObjectPanel}
          updateDimensionValues={updateDimensionValues}
          showColorPanel={showColorPanel}
        />,
        // eslint-disable-next-line no-nested-ternary
        showColorPanel ? (
          <ColorPanel key="color" elem={elem} />
        ) : isMobile ? (
          <InFillBlock key="fill" elem={elem} />
        ) : null,
      ];
    } else if (tagName === 'image' || tagName === 'img') {
      if (elem.getAttribute('data-fullcolor') === '1') contents = [];
      else
        contents = [<ImageOptions key="image" elem={elem} updateObjectPanel={updateObjectPanel} />];
    } else if (tagName === 'g' && elem.getAttribute('data-textpath-g')) {
      const textElem = elem.querySelector('text');
      contents = [
        <TextOptions
          key="textpath"
          isTextPath
          elem={elem}
          textElement={textElem}
          updateObjectPanel={updateObjectPanel}
          updateDimensionValues={updateDimensionValues}
        />,
      ];
    } else if (tagName === 'g') {
      contents = [
        showColorPanel ? (
          <MultiColorOptions key="multi-color" elem={elem} />
        ) : (
          <InFillBlock key="infill" elem={elem} />
        ),
      ];
    } else if (tagName === 'use') {
      contents = [showColorPanel ? <MultiColorOptions key="multi-color" elem={elem} /> : null];
    } else {
      contents = [
        showColorPanel ? (
          <ColorPanel key="color" elem={elem} />
        ) : (
          <InFillBlock key="infill" elem={elem} />
        ),
      ];
    }
  }

  return isMobile ? (
    <div className={styles.container}>
      <ObjectPanelItem.Divider />
      {contents?.reverse()}
    </div>
  ) : (
    <>
      {(contents) && (
        <div className={styles.panel}>
          <div className={styles.title}>OPTIONS</div>
          {contents}
      </div>
      )}
    </>
  );
}

export default OptionsPanel;
