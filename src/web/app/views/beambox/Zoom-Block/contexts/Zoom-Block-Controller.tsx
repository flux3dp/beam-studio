import { ZoomBlock, ZoomBlockContextHelper } from '../Zoom-Block';

const React = requireNode('react');
const updateZoomBlock = () => {
    if (!ZoomBlockContextHelper.context) {
        console.log('ZoomBlock is not mounted now.');
    } else {
        ZoomBlockContextHelper.context.updateZoomBlock();
    }
};

export default {
    updateZoomBlock: updateZoomBlock
}
