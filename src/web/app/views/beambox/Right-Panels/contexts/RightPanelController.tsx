import BeamboxGlobalInteraction from '../../../../actions/beambox/beambox-global-interaction';
import { RightPanelContextHelper } from '../Right-Panel';

const React = requireNode('react');
const setSelectedElement = (elem) => {
    if (!elem) {
        BeamboxGlobalInteraction.onObjectBlur();
    } else {
        BeamboxGlobalInteraction.onObjectBlur();
        BeamboxGlobalInteraction.onObjectFocus([elem]);
    }
    if (!RightPanelContextHelper.context) {
        console.log('RightPanel is not mounted now.');
    } else {
        RightPanelContextHelper.context.setSelectedElement(elem);
    }
};

const toPathEditMode = () => {
    if (!RightPanelContextHelper.context) {
        console.log('RightPanel is not mounted now.');
    } else {
        RightPanelContextHelper.context.setMode('path-edit');
    }
}

const toElementMode = () => {
    if (!RightPanelContextHelper.context) {
        console.log('RightPanel is not mounted now.');
    } else {
        RightPanelContextHelper.context.setMode('element');
    }
}

export default {
    setSelectedElement,
    toPathEditMode,
    toElementMode,
}
