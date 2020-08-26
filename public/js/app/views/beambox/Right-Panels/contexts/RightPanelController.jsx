define([
    'app/actions/beambox/beambox-global-interaction',
    'jsx!views/beambox/Right-Panels/Right-Panel',
], function (
    BeamboxGlobalInteraction,
    RightPanel
) {
    const React = require('react');
    setSelectedElement = (elem) => {
        if (!elem) {
            BeamboxGlobalInteraction.onObjectBlur();
        } else {
            BeamboxGlobalInteraction.onObjectBlur();
            BeamboxGlobalInteraction.onObjectFocus([elem]);
        }
        if (!RightPanel.contextCaller) {
            console.log('RightPanel is not mounted now.');
        } else {
            RightPanel.contextCaller.setSelectedElement(elem);
        }
    };

    toPathEditMode = () => {
        if (!RightPanel.contextCaller) {
            console.log('RightPanel is not mounted now.');
        } else {
            RightPanel.contextCaller.setMode('path-edit');
        }
    }

    toElementMode = () => {
        if (!RightPanel.contextCaller) {
            console.log('RightPanel is not mounted now.');
        } else {
            RightPanel.contextCaller.setMode('element');
        }
    }

    return {
        setSelectedElement,
        toPathEditMode,
        toElementMode,
    }
});