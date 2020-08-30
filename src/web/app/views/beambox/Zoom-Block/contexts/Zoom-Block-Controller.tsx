import { ZoomBlock, ZoomBlockContextCaller } from '../Zoom-Block'

    const React = requireNode('react');;
    const updateZoomBlock = () => {
        if (!ZoomBlockContextCaller) {
            console.log('ZoomBlock is not mounted now.');
        } else {
            ZoomBlockContextCaller.updateZoomBlock();
        }
    };

    export default {
        updateZoomBlock: updateZoomBlock
    }