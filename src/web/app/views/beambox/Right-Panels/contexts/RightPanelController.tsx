import BeamboxGlobalInteraction from '../../../../actions/beambox/beambox-global-interaction'
import { RightPanelContextCaller } from '../Right-Panel'

const React = requireNode('react');;
    const setSelectedElement = (elem) => {
        if (!elem) {
            BeamboxGlobalInteraction.onObjectBlur();
        } else {
            BeamboxGlobalInteraction.onObjectBlur();
            BeamboxGlobalInteraction.onObjectFocus([elem]);
        }
        if (!RightPanelContextCaller) {
            console.log('RightPanel is not mounted now.');
        } else {
            RightPanelContextCaller.setSelectedElement(elem);
        }
    };

    const toPathEditMode = () => {
        if (!RightPanelContextCaller) {
            console.log('RightPanel is not mounted now.');
        } else {
            RightPanelContextCaller.setMode('path-edit');
        }
    }

    const toElementMode = () => {
        if (!RightPanelContextCaller) {
            console.log('RightPanel is not mounted now.');
        } else {
            RightPanelContextCaller.setMode('element');
        }
    }

    export default {
        setSelectedElement,
        toPathEditMode,
        toElementMode,
    }