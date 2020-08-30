import { TopBar, TopBarContextCaller } from '../Top-Bar';

const React = requireNode('react');;

    const updateTopBar = () => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBarContextCaller.updateTopBar();
        }
    }

    const setElement = (elem) => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBarContextCaller.setElement(elem);
        }
    }
    const setFileName = (fileName) => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBarContextCaller.setFileName(fileName);
        }
    }
    const setHasUnsavedChange = (hasUnsavedChange) => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBarContextCaller.setHasUnsavedChange(hasUnsavedChange);
        }
    }
    const setTopBarPreviewMode = (isPreviewMode) => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBarContextCaller.setTopBarPreviewMode(isPreviewMode);
        }
    }
    const getTopBarPreviewMode = () => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
            return false;
        } else {
            return TopBarContextCaller.getTopBarPreviewMode();
        }
    }
    const setShouldStartPreviewController = (shouldStartPreviewController) => {
        if (!TopBarContextCaller) {
            console.log('TopBar is not mounted now.');
        } else {
            TopBarContextCaller.setShouldStartPreviewController(shouldStartPreviewController);
        }
    }

    export default {
        updateTopBar,
        setElement,
        setFileName,
        setHasUnsavedChange,
        setTopBarPreviewMode,
        getTopBarPreviewMode,
        setShouldStartPreviewController,
    }