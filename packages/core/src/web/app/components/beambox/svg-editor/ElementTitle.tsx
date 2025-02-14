import React, { useContext } from 'react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import i18n from '@core/helpers/i18n';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import type ISVGCanvas from '@core/interfaces/ISVGCanvas';

import styles from './ElementTitle.module.scss';

let svgCanvas: ISVGCanvas;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang.topbar;

function ElementTitle(): React.ReactNode {
  const { selectedElement } = useContext(SelectedElementContext);
  let content = '';

  if (selectedElement) {
    if (selectedElement.getAttribute('data-tempgroup') === 'true') {
      content = LANG.tag_names.multi_select;
    } else {
      const layer = svgCanvas.getObjectLayer(selectedElement);
      const layerName = layer ? layer.title : '';

      if (selectedElement.getAttribute('data-textpath-g')) {
        content = `${layerName} > ${LANG.tag_names.text_path}`;
      } else if (selectedElement.getAttribute('data-pass-through')) {
        content = `${layerName} > ${LANG.tag_names.pass_through_object}`;
      } else if (selectedElement.tagName.toLowerCase() !== 'use') {
        content = `${layerName} > ${LANG.tag_names[selectedElement.tagName.toLowerCase()]}`;
      } else if (selectedElement.getAttribute('data-svg') === 'true') {
        content = `${layerName} > ${LANG.tag_names.svg}`;
      } else if (selectedElement.getAttribute('data-dxf') === 'true') {
        content = `${layerName} > ${LANG.tag_names.dxf}`;
      } else {
        content = `${layerName} > ${LANG.tag_names.use}`;
      }
    }
  }

  if (!content) return null;

  return <div className={styles['element-title']}>{content}</div>;
}

export default ElementTitle;
