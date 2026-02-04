import React, { useContext } from 'react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementTitle.module.scss';

function ElementTitle(): React.ReactNode {
  const { topbar: t } = useI18n();
  const { selectedElement } = useContext(SelectedElementContext);
  let content = '';

  if (selectedElement) {
    if (selectedElement.getAttribute('data-tempgroup') === 'true') {
      content = t.tag_names.multi_select;
    } else {
      const layer = getObjectLayer(selectedElement as SVGElement);
      const layerName = layer ? layer.title : '';

      if (selectedElement.getAttribute('data-textpath-g')) {
        content = `${layerName} > ${t.tag_names.text_path}`;
      } else if (selectedElement.getAttribute('data-pass-through')) {
        content = `${layerName} > ${t.tag_names.pass_through_object}`;
      } else if (selectedElement.tagName.toLowerCase() !== 'use') {
        content = `${layerName} > ${(t.tag_names as any)[selectedElement.tagName.toLowerCase()]}`;
      } else if (selectedElement.getAttribute('data-svg') === 'true') {
        content = `${layerName} > ${t.tag_names.svg}`;
      } else if (selectedElement.getAttribute('data-dxf') === 'true') {
        content = `${layerName} > ${t.tag_names.dxf}`;
      } else {
        content = `${layerName} > ${t.tag_names.use}`;
      }
    }
  }

  if (!content) return null;

  return <div className={styles['element-title']}>{content}</div>;
}

export default ElementTitle;
