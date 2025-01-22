const mockEmit = jest.fn();

jest.mock('@core/app/views/tutorials/TutorialContext', () => ({
  eventEmitter: {
    emit: mockEmit,
  },
}));

import { getNextStepRequirement, handleNextStep } from './tutorialController';

describe('test Tutorial-Controller', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('test handleNextStep', () => {
    handleNextStep();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'HANDLE_NEXT_STEP');
  });

  test('test getNextStepRequirement', () => {
    getNextStepRequirement();
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenNthCalledWith(1, 'GET_NEXT_STEP_REQUIREMENT', {
      nextStepRequirement: '',
    });
  });
});
