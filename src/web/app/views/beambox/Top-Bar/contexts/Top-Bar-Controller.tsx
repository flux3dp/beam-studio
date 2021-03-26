import { IUser } from 'interfaces/IUser';
import { TopBar, TopBarContextHelper } from '../Top-Bar';
const React = requireNode('react');

const updateTopBar = () => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.updateTopBar();
    }
};

const setElement = (elem) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setElement(elem);
    }
};

const setFileName = (fileName) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setFileName(fileName);
    }
};

const setHasUnsavedChange = (hasUnsavedChange) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setHasUnsavedChange(hasUnsavedChange);
    }
};

const setTopBarPreviewMode = (isPreviewMode) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setTopBarPreviewMode(isPreviewMode);
    }
};

const getTopBarPreviewMode = () => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
        return false;
    } else {
        return TopBarContextHelper.context.getTopBarPreviewMode();
    }
};

const setShouldStartPreviewController = (shouldStartPreviewController) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setShouldStartPreviewController(shouldStartPreviewController);
    }
};

const setStartPreviewCallback = (callback?: Function|null) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setStartPreviewCallback(callback);
    }
};

const setCurrentUser = (user?: IUser) => {
    if (!TopBarContextHelper.context) {
        console.log('TopBar is not mounted now.');
    } else {
        TopBarContextHelper.context.setCurrentUser(user);
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
    setStartPreviewCallback,
    setCurrentUser,
};
