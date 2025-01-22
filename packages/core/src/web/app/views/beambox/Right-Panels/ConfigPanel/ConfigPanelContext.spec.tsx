import type { Action } from './ConfigPanelContext';
import { getDefaultState, reducer } from './ConfigPanelContext';

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => ({
    configName: '',
    power: 15,
    repeat: 1,
    speed: 20,
    zStep: 0,
  }),
}));

describe('test ConfigPanelContext', () => {
  test('getDefaultState should work', () => {
    expect(getDefaultState()).toEqual({
      configName: { value: '' },
      power: { value: 15 },
      repeat: { value: 1 },
      speed: { value: 20 },
      zStep: { value: 0 },
    });
  });

  test('if update action work', () => {
    const state = getDefaultState();
    const newState = reducer(state, {
      payload: {
        repeat: { value: 2 },
        speed: { hasMultiValue: true, value: 2 },
      },
      type: 'update',
    } as Action);

    expect(newState).toEqual({
      configName: { value: '' },
      power: { value: 15 },
      repeat: { value: 2 },
      speed: { hasMultiValue: true, value: 2 },
      zStep: { value: 0 },
    });
  });

  test('if change action work', () => {
    const state = getDefaultState();
    const newState = reducer(state, {
      payload: {
        repeat: 2,
        speed: 2,
      },
      type: 'change',
    } as Action);

    expect(newState).toEqual({
      configName: { value: '' },
      power: { value: 15 },
      repeat: { value: 2 },
      speed: { value: 2 },
      zStep: { value: 0 },
    });
  });

  test('if rename action work', () => {
    const state = getDefaultState();
    const newState = reducer(state, {
      payload: 'test',
      type: 'rename',
    } as Action);

    expect(newState).toEqual({
      configName: { value: 'test' },
      power: { value: 15 },
      repeat: { value: 1 },
      speed: { value: 20 },
      zStep: { value: 0 },
    });
  });
});
