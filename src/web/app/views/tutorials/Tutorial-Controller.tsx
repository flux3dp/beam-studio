define([
    'jsx!views/tutorials/Tutorial',
], function (
    Tutorial
) {
    const React = require('react');
    handleNextStep = () => {
        if (!Tutorial.contextCaller) {
            //console.log('Tutorial is not mounted now.');
        } else {
            Tutorial.contextCaller.handleNextStep();
        }
    };

    getNextStepRequirement = () => {
        if (!Tutorial.contextCaller) {
            //console.log('Tutorial is not mounted now.');
            return null;
        } else {
            return Tutorial.contextCaller.getNextStepRequirement();
        }
    }

    return {
        getNextStepRequirement,
        handleNextStep,
    }
});