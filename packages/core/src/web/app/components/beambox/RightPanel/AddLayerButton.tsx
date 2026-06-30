import React from 'react';

import Icon from '@ant-design/icons';

import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import { addNewLayer } from '@core/helpers/layer/layer-helper';

import styles from './AddLayerButton.module.scss';

function AddLayerButton(): React.JSX.Element {
  return (
    <button className={styles.btn} onClick={addNewLayer} type="button">
      <Icon component={LayerPanelIcons.Add} />
    </button>
  );
}

export default AddLayerButton;
