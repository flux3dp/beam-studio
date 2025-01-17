import React from 'react';

import i18n from 'helpers/i18n';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import styles from './ElementTitle.module.scss';

let svgCanvas;
getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
});

const LANG = i18n.lang.topbar;

interface Props {
  selectedElem: Element | null;
}

function ElementTitle({ selectedElem }: Props): JSX.Element {
  let content = '';
  if (selectedElem) {
    if (selectedElem.getAttribute('data-tempgroup') === 'true') {
      content = LANG.tag_names.multi_select;
    } else {
      const layer = svgCanvas.getObjectLayer(selectedElem);
      const layerName = layer ? layer.title : '';

      if (selectedElem.getAttribute('data-textpath-g')) {
        content = `${layerName} > ${LANG.tag_names.text_path}`;
      } else if (selectedElem.getAttribute('data-pass-through')) {
        content = `${layerName} > ${LANG.tag_names.pass_through_object}`;
      } else if (selectedElem.tagName.toLowerCase() !== 'use') {
        content = `${layerName} > ${LANG.tag_names[selectedElem.tagName.toLowerCase()]}`;
      } else if (selectedElem.getAttribute('data-svg') === 'true') {
        content = `${layerName} > ${LANG.tag_names.svg}`;
      } else if (selectedElem.getAttribute('data-dxf') === 'true') {
        content = `${layerName} > ${LANG.tag_names.dxf}`;
      } else {
        content = `${layerName} > ${LANG.tag_names.use}`;
      }
    }
  }
  if (!content) {
    return null;
  }
  return <div className={styles['element-title']}>{content}</div>;
}

export default ElementTitle;
