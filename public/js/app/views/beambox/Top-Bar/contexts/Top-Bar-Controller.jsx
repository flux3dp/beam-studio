define([
    'jsx!views/beambox/Top-Bar/Top-Bar',
], function (
    TopBar
) {
    const React = require('react');

    updateTopBar = () => {
        if (!TopBar.contextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBar.contextCaller.updateTopBar();
        }
    }

    setElement = (elem) => {
        if (!TopBar.contextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBar.contextCaller.setElement(elem);
        }
    }
    setFileName = (fileName) => {
        if (!TopBar.contextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBar.contextCaller.setFileName(fileName);
        }
    }
    setHasUnsavedChange = (hasUnsavedChange) => {
        if (!TopBar.contextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBar.contextCaller.setHasUnsavedChange(hasUnsavedChange);
        }
    }

    return {
        updateTopBar,
        setElement,
        setFileName,
        setHasUnsavedChange,
    }
});