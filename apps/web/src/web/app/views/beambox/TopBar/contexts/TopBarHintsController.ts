import eventEmitterFactory from 'helpers/eventEmitterFactory';

const topBarHintsEventEmitter = eventEmitterFactory.createEventEmitter('top-bar-hints');

const setHint = (hintType: string): void => {
  topBarHintsEventEmitter.emit('SET_HINT', hintType);
};

const removeHint = (): void => {
  topBarHintsEventEmitter.emit('REMOVE_HINT');
};

export default {
  setHint,
  removeHint,
};
