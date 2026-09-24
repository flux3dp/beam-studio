import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

// Shared with TutorialContextProvider by name, so neither file imports the other
const eventEmitter = eventEmitterFactory.createEventEmitter('tutorial');

export const handleNextStep = (): void => {
  eventEmitter.emit('HANDLE_NEXT_STEP');
};

export const getNextStepRequirement = (): string => {
  const response = {
    nextStepRequirement: '',
  };

  eventEmitter.emit('GET_NEXT_STEP_REQUIREMENT', response);

  return response.nextStepRequirement ?? '';
};

export default {
  getNextStepRequirement,
  handleNextStep,
};
