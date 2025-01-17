import classNames from 'classnames';
import React, { memo, useContext, useEffect, useState } from 'react';

import useI18n from 'helpers/useI18n';
import { getObjectLayer, moveToOtherLayer } from 'helpers/layer/layer-helper';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';

import styles from './SelLayerBlock.module.scss';

const defaultOption = ' ';

interface Props {
  layerNames: string[];
}

function SelLayerBlock({ layerNames }: Props): JSX.Element {
  const lang = useI18n().beambox.right_panel.layer_panel;
  const [promptMoveLayerOnce, setPromptMoveLayerOnce] = useState(false);
  const [displayValue, setDisplayValue] = useState(defaultOption);
  const { selectedElement } = useContext(SelectedElementContext);
  const { selectedLayers } = useContext(LayerPanelContext);
  useEffect(() => {
    if (!selectedElement) return;
    if (selectedElement.getAttribute('data-tempgroup') === 'true') {
      const originalLayers = new Set(
        ([...selectedElement.childNodes] as SVGElement[])
          .filter((elem) => elem?.getAttribute('data-imageborder') !== 'true')
          .map((elem) => elem.getAttribute('data-original-layer'))
      );
      if (originalLayers.size === 1) {
        const [firstValue] = originalLayers;
        setDisplayValue(firstValue ?? defaultOption);
      } else setDisplayValue(defaultOption);
    } else {
      const currentLayer = getObjectLayer(selectedElement as SVGElement);
      const currentLayerName = currentLayer?.title ?? defaultOption;
      setDisplayValue(currentLayerName);
    }
  }, [selectedElement, selectedLayers]);
  if (!selectedElement) return null;
  if (layerNames.length === 1) return null;

  const onChange = (e: React.ChangeEvent) => {
    const select = e.target as HTMLSelectElement;
    const destLayer = select.options[select.selectedIndex].value;
    moveToOtherLayer(
      destLayer,
      () => {
        setDisplayValue(destLayer);
        setPromptMoveLayerOnce(true);
      },
      !promptMoveLayerOnce
    );
  };

  const options = [];
  if (displayValue === defaultOption) {
    options.push(
      <option value={defaultOption} key={-1}>
        {lang.move_elems_to}
      </option>
    );
  }
  for (let i = layerNames.length - 1; i >= 0; i -= 1) {
    const layerName = layerNames[i];
    options.push(
      <option value={layerName} key={i}>
        {layerName}
      </option>
    );
  }
  return (
    <div className={classNames('controls', styles.container)}>
      <span className={styles.label}>{lang.move_elems_to}</span>
      <select
        className={styles.select}
        value={displayValue}
        title="Move selected elements to a different layer"
        onChange={onChange}
        disabled={options.length < 2}
      >
        {options}
      </select>
    </div>
  );
}

export default memo(SelLayerBlock);
