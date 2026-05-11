import React, { useMemo } from 'react';

import { CanvasElements } from '@core/app/constants/canvasElements';
import { getData } from '@core/helpers/layer/layer-config-helper';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './InfillPanel.module.scss';
import InFillBlock from './OptionsBlocks/InFillBlock';

interface Props {
  elem: null | SVGElement;
}

function InfillPanel({ elem }: Props): null | React.JSX.Element {
  const langOptionPanel = useI18n().beambox.right_panel.object_panel.option_panel;
  const tagName = useMemo(() => elem?.tagName.toLowerCase(), [elem]);
  const isFullColor = elem ? getData(getObjectLayer(elem)?.elem, 'fullcolor') : false;

  if (!elem || !tagName || isFullColor) return null;

  if (!CanvasElements.fillableWithContainers.includes(tagName)) return null;

  if (tagName === 'use') return null;

  const renderBlocks = (): React.ReactNode => {
    if (tagName === 'g') {
      if (elem.getAttribute('data-textpath-g')) {
        const textElem = elem.querySelector('text');
        const path = Array.from(elem.querySelectorAll('path'));

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

          return (
            <>
              <InFillBlock elems={textElems} label={langOptionPanel.text_infill} />
              <InFillBlock elems={path} id="path_infill" label={langOptionPanel.path_infill} />
            </>
          );
        }
      }
    }

    return <InFillBlock elems={[elem]} />;
  };

  return <div className={styles.panel}>{renderBlocks()}</div>;
}

export default InfillPanel;
