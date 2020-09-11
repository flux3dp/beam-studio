import { Tutorial, TutorialContextCaller } from './Tutorial';

const React = requireNode('react');

export const handleNextStep = () => {
    if (!TutorialContextCaller) {
        //console.log('Tutorial is not mounted now.');
    } else {
        TutorialContextCaller.handleNextStep();
    }
};

export const getNextStepRequirement = () => {
    if (!TutorialContextCaller) {
        //console.log('Tutorial is not mounted now.');
        return null;
    } else {
        return TutorialContextCaller.getNextStepRequirement();
    }
}
