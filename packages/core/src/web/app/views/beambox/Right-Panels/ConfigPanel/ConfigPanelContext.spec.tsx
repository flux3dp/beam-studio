import { Action, getDefaultState, reducer } from './ConfigPanelContext';

jest.mock('helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => ({
    speed: 20,
    power: 15,
    repeat: 1,
    zStep: 0,
    configName: '',
  }),
}));

describe('test ConfigPanelContext', () => {
  test('getDefaultState should work', () => {
    expect(getDefaultState()).toEqual({
      speed: { value: 20 },
      power: { value: 15 },
      repeat: { value: 1 },
      zStep: { value: 0 },
      configName: { value: '' },
    });
  });

  test('if update action work', () => {
    const state = getDefaultState();
    const newState = reducer(state, {
      type: 'update',
      payload: {
        speed: { value: 2, hasMultiValue: true },
        repeat: { value: 2 },
      },
    } as Action);
    expect(newState).toEqual({
      speed: { value: 2, hasMultiValue: true },
      power: { value: 15 },
      repeat: { value: 2 },
      zStep: { value: 0 },
      configName: { value: '' },
    });
  });

  test('if change action work', () => {
    const state = getDefaultState();
    const newState = reducer(state, {
      type: 'change',
      payload: {
        speed: 2,
        repeat: 2,
      },
    } as Action);
    expect(newState).toEqual({
      speed: { value: 2 },
      power: { value: 15 },
      repeat: { value: 2 },
      zStep: { value: 0 },
      configName: { value: '' },
    });
  });

  test('if rename action work', () => {
    const state = getDefaultState();
    const newState = reducer(state, {
      type: 'rename',
      payload: 'test',
    } as Action);
    expect(newState).toEqual({
      speed: { value: 20 },
      power: { value: 15 },
      repeat: { value: 1 },
      zStep: { value: 0 },
      configName: { value: 'test' },
    });
  });
});
