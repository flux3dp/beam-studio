define([
    'jsx!views/beambox/Zoom-Block/Zoom-Block',
], function (
    ZoomBlock
) {
    const React = require('react');
    updateZoomBlock = () => {
        if (!ZoomBlock.contextCaller) {
            console.log('ZoomBlock is not mounted now.');
        } else {
            ZoomBlock.contextCaller.updateZoomBlock();
        }
    };

    return {
        updateZoomBlock: updateZoomBlock
    }
});