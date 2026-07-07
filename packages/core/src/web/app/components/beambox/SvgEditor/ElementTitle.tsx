import React from 'react';

import { useSelectedElementStore } from '@core/app/stores/selectedElementStore';
import { getObjectLayer } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './ElementTitle.module.scss';

function ElementTitle(): React.ReactNode {
  const { topbar: t } = useI18n();
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const nodeType = useSelectedElementStore((state) => state.nodeType);
  let content = '';

  if (nodeType !== 'no_selection') {
    if (nodeType === 'multi_select') {
      content = t.tag_names.multi_select;
    } else {
      const layer = getObjectLayer(selectedElement as SVGElement);
      const layerName = layer ? layer.title : '';

      content = `${layerName} > ${t.tag_names[nodeType]}`;
    }
  }

  if (!content) return null;

  return <div className={styles['element-title']}>{content}</div>;
}

export default ElementTitle;
