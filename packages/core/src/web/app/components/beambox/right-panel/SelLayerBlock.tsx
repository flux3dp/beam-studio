import type { ReactNode } from 'react';
import React, { memo, useContext, useEffect, useState } from 'react';

import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';
import Select from '@core/app/widgets/AntdSelect';
import { getObjectLayer, moveToOtherLayer } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './Block.module.scss';

const defaultOption = ' ';

interface Props {
  layerNames: string[];
}

function SelLayerBlock({ layerNames }: Props): ReactNode {
  const lang = useI18n().beambox.right_panel.layer_panel;
  const [promptMoveLayerOnce, setPromptMoveLayerOnce] = useState(false);
  const [displayValue, setDisplayValue] = useState(defaultOption);
  const { selectedElement } = useContext(SelectedElementContext);
  const { selectedLayers } = useContext(LayerPanelContext);

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    if (selectedElement.getAttribute('data-tempgroup') === 'true') {
      const originalLayers = new Set(
        ([...selectedElement.childNodes] as SVGElement[])
          .filter((elem) => elem?.getAttribute('data-imageborder') !== 'true')
          .map((elem) => elem.getAttribute('data-original-layer')),
      );

      if (originalLayers.size === 1) {
        const [firstValue] = originalLayers;

        setDisplayValue(firstValue ?? defaultOption);
      } else {
        setDisplayValue(defaultOption);
      }
    } else {
      const currentLayer = getObjectLayer(selectedElement as SVGElement);
      const currentLayerName = currentLayer?.title ?? defaultOption;

      setDisplayValue(currentLayerName);
    }
  }, [selectedElement, selectedLayers]);

  if (!selectedElement) {
    return null;
  }

  if (layerNames.length === 1) {
    return null;
  }

  const onChange = (value: string) => {
    moveToOtherLayer(
      value,
      () => {
        setDisplayValue(value);
        setPromptMoveLayerOnce(true);
      },
      !promptMoveLayerOnce,
    );
  };

  const options: Array<{ label: string; value: string }> = [];

  if (displayValue === defaultOption) {
    options.push({ label: lang.move_elems_to, value: defaultOption });
  }

  for (let i = layerNames.length - 1; i >= 0; i -= 1) {
    const layerName = layerNames[i];

    options.push({ label: layerName, value: layerName });
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>{lang.move_elems_to}</span>
      <Select
        className={styles.select}
        data-testid="move-layer-select"
        disabled={options.length < 2}
        onChange={onChange}
        options={options}
        value={displayValue}
      />
    </div>
  );
}

export default memo(SelLayerBlock);
