import React from 'react';

import Icon from '@ant-design/icons';

import TutorialConstants from '@core/app/constants/tutorial-constants';
import LayerPanelIcons from '@core/app/icons/layer-panel/LayerPanelIcons';
import TutorialController from '@core/app/views/tutorials/tutorialController';
import { createLayer } from '@core/helpers/layer/layer-helper';
import { getSVGAsync } from '@core/helpers/svg-editor-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './AddLayerButton.module.scss';

let svgCanvas;
let svgEditor;

getSVGAsync((globalSVG) => {
  svgCanvas = globalSVG.Canvas;
  svgEditor = globalSVG.Editor;
});

interface Props {
  setSelectedLayers: (selectedLayers: string[]) => void;
}

function AddLayerButton({ setSelectedLayers }: Props): React.JSX.Element {
  const lang = useI18n().beambox.right_panel.layer_panel;

  const addNewLayer = (): void => {
    let i = 1;
    let uniqName = `${lang.layers.layer} ${i}`;

    while (svgCanvas.getCurrentDrawing().hasLayer(uniqName)) {
      i += 1;
      uniqName = `${lang.layers.layer} ${i}`;
    }

    createLayer(uniqName, { initConfig: true });

    if (TutorialController.getNextStepRequirement() === TutorialConstants.ADD_NEW_LAYER) {
      TutorialController.handleNextStep();
    }

    svgEditor.updateContextPanel();
    setSelectedLayers([uniqName]);
  };

  return (
    <button className={styles.btn} onClick={addNewLayer} type="button">
      <Icon component={LayerPanelIcons.Add} />
    </button>
  );
}

export default AddLayerButton;
