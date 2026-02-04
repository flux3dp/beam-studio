import React from 'react';

import Icon from '@ant-design/icons';

import TutorialController from '@core/app/components/tutorials/tutorialController';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import useLayerStore from '@core/app/stores/layer/layerStore';
import layerManager from '@core/app/svgedit/layer/layerManager';
import { createLayer } from '@core/helpers/layer/layer-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './AddLayerButton.module.scss';

function AddLayerButton(): React.JSX.Element {
  const lang = useI18n().beambox.right_panel.layer_panel;

  const addNewLayer = (): void => {
    let i = 1;
    let uniqName = `${lang.layers.layer} ${i}`;

    while (layerManager.hasLayer(uniqName)) {
      i += 1;
      uniqName = `${lang.layers.layer} ${i}`;
    }

    createLayer(uniqName, { initConfig: true });

    if (TutorialController.getNextStepRequirement() === TutorialConstants.ADD_NEW_LAYER) {
      TutorialController.handleNextStep();
    }

    useLayerStore.getState().setSelectedLayers([uniqName]);
  };

  return (
    <button className={styles.btn} onClick={addNewLayer} type="button">
      <Icon component={LayerPanelIcons.Add} />
    </button>
  );
}

export default AddLayerButton;
