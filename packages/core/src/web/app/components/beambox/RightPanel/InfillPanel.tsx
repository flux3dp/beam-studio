import React, { useMemo } from 'react';

import { CanvasElements } from '@core/app/constants/canvasElements';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import ColorPanel from './ColorPanel';
import styles from './InfillPanel.module.scss';
import InFillBlock from './OptionsBlocks/InFillBlock';
import MultiColorOptions from './OptionsBlocks/MultiColorOptions';

interface Props {
  elem: null | SVGElement;
}

function InfillPanel({ elem }: Props): null | React.JSX.Element {
  const langOptionPanel = useI18n().beambox.right_panel.object_panel.option_panel;
  const tagName = useMemo(() => elem?.tagName.toLowerCase(), [elem]);
  const isFullColor = elem ? Boolean(getData(getObjectLayer(elem)?.elem, 'fullcolor')) : false;

  if (!elem || !tagName) return null;

  if (!CanvasElements.fillableWithContainers.includes(tagName)) return null;

  if (tagName === 'use') {
    return isFullColor ? (
      <div className={styles.panel}>
        <MultiColorOptions elem={elem} />
      </div>
    ) : null;
  }

  const renderTextPathColorSections = (textElem: null | SVGTextElement, pathElem: null | SVGPathElement) => (
    <>
      {textElem ? (
        <div className={styles.section}>
          <div className={styles['section-label']}>{langOptionPanel.text_infill}</div>
          <ColorPanel elem={textElem} fillOnly />
        </div>
      ) : null}
      {pathElem ? (
        <div className={styles.section}>
          <div className={styles['section-label']}>{langOptionPanel.path_infill}</div>
          <ColorPanel elem={pathElem} fillOnly />
        </div>
      ) : null}
    </>
  );

  const renderBlocks = (): React.ReactNode => {
    if (tagName === 'g') {
      if (elem.getAttribute('data-textpath-g')) {
        const textElem = elem.querySelector('text');
        const path = Array.from(elem.querySelectorAll('path'));

        if (isFullColor) return renderTextPathColorSections(textElem, path[0] ?? null);

        return (
          <>
            <InFillBlock elems={textElem ? [textElem] : []} label={langOptionPanel.text_infill} />
            <InFillBlock elems={path} id="path_infill" label={langOptionPanel.path_infill} />
          </>
        );
      }

      if (!elem.querySelector(':scope > :not(text):not(g[data-textpath-g="1"])')) {
        const includeTextPath = Boolean(elem.querySelector('g[data-textpath-g="1"]'));

        if (includeTextPath) {
          const textElems = Array.from(elem.querySelectorAll('text'));
          const path = Array.from(elem.querySelectorAll('path'));

          if (isFullColor) return renderTextPathColorSections(textElems[0] ?? null, path[0] ?? null);

          return (
            <>
              <InFillBlock elems={textElems} label={langOptionPanel.text_infill} />
              <InFillBlock elems={path} id="path_infill" label={langOptionPanel.path_infill} />
            </>
          );
        }

        return <InFillBlock elems={[elem]} />;
      }

      // group with mixed (non-text) children
      return isFullColor ? <MultiColorOptions elem={elem} /> : <InFillBlock elems={[elem]} />;
    }

    return isFullColor ? <ColorPanel elem={elem} /> : <InFillBlock elems={[elem]} />;
  };

  return <div className={styles.panel}>{renderBlocks()}</div>;
}

export default InfillPanel;
