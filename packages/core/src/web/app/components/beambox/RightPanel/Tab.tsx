import React, { use } from 'react';

import classNames from 'classnames';

import * as TutorialController from '@core/app/components/tutorials/tutorialController';
import { PanelType } from '@core/app/constants/right-panel-types';
import TutorialConstants from '@core/app/constants/tutorial-constants';
import { CanvasContext } from '@core/app/contexts/CanvasContext';
import { SelectedElementContext } from '@core/app/contexts/SelectedElementContext';
import useI18n from '@core/helpers/useI18n';

interface Props {
  panelType: PanelType;
  switchPanel: () => void;
}

function Tab({ panelType, switchPanel }: Props): React.JSX.Element {
  const lang = useI18n();
  const langTopBar = lang.topbar;
  const langRightPanel = lang.beambox.right_panel;
  const { selectedElement } = use(SelectedElementContext);
  const { isPathEditing } = use(CanvasContext);
  const isObjectDisabled = !isPathEditing && !selectedElement;
  let objectTitle = langRightPanel.tabs.objects;

  if (panelType === PanelType.PathEdit) {
    objectTitle = langRightPanel.tabs.path_edit;
  } else if (selectedElement) {
    if (selectedElement.getAttribute('data-tempgroup') === 'true') {
      objectTitle = langTopBar.tag_names.multi_select;
    } else if (selectedElement.getAttribute('data-textpath-g')) {
      objectTitle = langTopBar.tag_names.text_path;
    } else if (selectedElement.getAttribute('data-pass-through')) {
      objectTitle = langTopBar.tag_names.pass_through_object;
    } else if (selectedElement.tagName.toLowerCase() !== 'use') {
      objectTitle = langTopBar.tag_names[selectedElement.tagName.toLowerCase()];
    } else if (selectedElement.getAttribute('data-svg') === 'true') {
      objectTitle = langTopBar.tag_names.svg;
    } else if (selectedElement.getAttribute('data-dxf') === 'true') {
      objectTitle = langTopBar.tag_names.dxf;
    } else {
      objectTitle = langTopBar.tag_names.use;
    }
  } else {
    objectTitle = langTopBar.tag_names.no_selection;
  }

  return (
    <div className="right-panel-tabs">
      <div
        className={classNames('tab', 'layers', { selected: panelType === PanelType.Layer })}
        onClick={
          panelType === PanelType.Layer
            ? undefined
            : () => {
                switchPanel();

                if (TutorialController.getNextStepRequirement() === TutorialConstants.TO_LAYER_PANEL) {
                  TutorialController.handleNextStep();
                }
              }
        }
        title={`${langRightPanel.tabs.layers} (L)`}
      >
        <img className="tab-icon" draggable={false} src="img/right-panel/icon-layers.svg" />
        <div className="tab-title">{langRightPanel.tabs.layers}</div>
      </div>
      <div
        className={classNames('tab', 'objects', {
          disabled: isObjectDisabled,
          selected: panelType === PanelType.Object || panelType === PanelType.PathEdit,
        })}
        onClick={
          isObjectDisabled || panelType === PanelType.Object || panelType === PanelType.PathEdit
            ? undefined
            : () => {
                switchPanel();

                if (TutorialController.getNextStepRequirement() === TutorialConstants.TO_OBJECT_PANEL) {
                  TutorialController.handleNextStep();
                }
              }
        }
        title={`${objectTitle} (O)`}
      >
        <img className="tab-icon object" draggable={false} src="img/right-panel/icon-adjust.svg" />
        <div className="tab-title">{objectTitle}</div>
      </div>
    </div>
  );
}

export default Tab;
