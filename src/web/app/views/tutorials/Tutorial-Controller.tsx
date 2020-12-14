import { Tutorial, TutorialContextCaller } from './Tutorial';

const React = requireNode('react');

export const handleNextStep = () => {
    if (!TutorialContextCaller.context) {
        //console.log('Tutorial is not mounted now.');
    } else {
        TutorialContextCaller.context.handleNextStep();
    }
};

export const getNextStepRequirement = () => {
    if (!TutorialContextCaller.context) {
        //console.log('Tutorial is not mounted now.');
        return null;
    } else {
        return TutorialContextCaller.context.getNextStepRequirement();
    }
}
