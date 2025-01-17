import { eventEmitter } from 'app/views/tutorials/TutorialContext';

export const handleNextStep = (): void => {
  eventEmitter.emit('HANDLE_NEXT_STEP');
};

export const getNextStepRequirement = (): string => {
  const response = {
    nextStepRequirement: '',
  };
  eventEmitter.emit('GET_NEXT_STEP_REQUIREMENT', response);
  return response.nextStepRequirement;
};

export default {
  handleNextStep,
  getNextStepRequirement,
};
