define([
    'jsx!views/beambox/Top-Bar/Top-Bar-Hints',
], function (
    TopBarHints
) {
    const React = require('react');

    setHint = (hintType) => {
        if (!TopBarHints.contextCaller) {
            console.log('TopBarHints is not mounted now.');
        } else {
            TopBarHints.contextCaller.setHint(hintType);
        }
    }

    removeHint = () => {
        if (!TopBarHints.contextCaller) {
            console.log('TopBarHints is not mounted now.');
        } else {
            TopBarHints.contextCaller.removeHint();
        }
    }

    return {
        setHint,
        removeHint,
    }
});