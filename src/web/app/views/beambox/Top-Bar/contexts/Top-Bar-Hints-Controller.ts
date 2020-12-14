import { TopBarHints, ContextHelper } from '../Top-Bar-Hints';

    const setHint = (hintType) => {
        if (!ContextHelper.context) {
            console.log('TopBarHints is not mounted now.');
        } else {
            ContextHelper.context.setHint(hintType);
        }
    }

    const removeHint = () => {
        if (!ContextHelper.context) {
            console.log('TopBarHints is not mounted now.');
        } else {
            ContextHelper.context.removeHint();
        }
    }

    export default {
        setHint,
        removeHint,
    }