import { TopBarHints, TopBarHintsContextCaller } from '../Top-Bar-Hints';

    const React = requireNode('react');

    const setHint = (hintType) => {
        if (!TopBarHintsContextCaller) {
            console.log('TopBarHints is not mounted now.');
        } else {
            TopBarHintsContextCaller.setHint(hintType);
        }
    }

    const removeHint = () => {
        if (!TopBarHintsContextCaller) {
            console.log('TopBarHints is not mounted now.');
        } else {
            TopBarHintsContextCaller.removeHint();
        }
    }

    export default {
        setHint,
        removeHint,
    }