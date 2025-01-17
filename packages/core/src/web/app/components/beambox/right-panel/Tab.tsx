import React, { useContext } from 'react';
import classNames from 'classnames';

import * as TutorialController from 'app/views/tutorials/tutorialController';
import TutorialConstants from 'app/constants/tutorial-constants';
import useI18n from 'helpers/useI18n';
import { CanvasContext } from 'app/contexts/CanvasContext';
import { PanelType } from 'app/constants/right-panel-types';
import { SelectedElementContext } from 'app/contexts/SelectedElementContext';

interface Props {
  panelType: PanelType;
  switchPanel: () => void;
}

function Tab({ panelType, switchPanel }: Props): JSX.Element {
  const lang = useI18n();
  const langTopBar = lang.topbar;
  const langRightPanel = lang.beambox.right_panel;
  const { selectedElement } = useContext(SelectedElementContext);
  const { isPathEditing } = useContext(CanvasContext);
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
            ? null
            : () => {
                switchPanel();
                if (
                  TutorialController.getNextStepRequirement() === TutorialConstants.TO_LAYER_PANEL
                ) {
                  TutorialController.handleNextStep();
                }
              }
        }
        title={`${langRightPanel.tabs.layers} (L)`}
      >
        <img className="tab-icon" src="img/right-panel/icon-layers.svg" draggable={false} />
        <div className="tab-title">{langRightPanel.tabs.layers}</div>
      </div>
      <div
        className={classNames('tab', 'objects', {
          disabled: isObjectDisabled,
          selected: panelType === PanelType.Object || panelType === PanelType.PathEdit,
        })}
        onClick={
          isObjectDisabled || panelType === PanelType.Object || panelType === PanelType.PathEdit
            ? null
            : () => {
              switchPanel();
              if (
                TutorialController.getNextStepRequirement() === TutorialConstants.TO_OBJECT_PANEL
              ) {
                TutorialController.handleNextStep();
              }
            }
        }
        title={`${objectTitle} (O)`}
      >
        <img className="tab-icon object" src="img/right-panel/icon-adjust.svg" draggable={false} />
        <div className="tab-title">{objectTitle}</div>
      </div>
    </div>
  );
}

export default Tab;
