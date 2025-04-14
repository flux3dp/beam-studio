jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getDefaultConfig: () => ({
    configName: '',
    power: 15,
    repeat: 1,
    speed: 20,
    zStep: 0,
  }),
}));

import { useConfigPanelStore } from './configPanel';

describe('test configPanel store', () => {
  beforeEach(() => {
    useConfigPanelStore.getState().reset();
  });

  test.only('getDefaultState should work', () => {
    const state = useConfigPanelStore.getState().getState();

    expect(state).toEqual({
      configName: { value: '' },
      power: { value: 15 },
      repeat: { value: 1 },
      speed: { value: 20 },
      zStep: { value: 0 },
    });
  });

  test('if update action work', () => {
    useConfigPanelStore.getState().update({
      speed: { hasMultiValue: true, value: 2 },
    });

    const state = useConfigPanelStore.getState().getState();

    expect(state).toEqual({
      configName: { value: '' },
      power: { hasMultiValue: true, value: 20 },
      repeat: { value: 1 },
      speed: { value: 20 },
      zStep: { value: 0 },
    });
  });

  test('if change action work', () => {
    useConfigPanelStore.getState().change({ repeat: 2 });

    const state = useConfigPanelStore.getState().getState();

    expect(state).toEqual({
      configName: { value: '' },
      power: { value: 15 },
      repeat: { value: 2 },
      speed: { value: 20 },
      zStep: { value: 0 },
    });
  });

  test('if rename action work', () => {
    useConfigPanelStore.getState().rename('newName');

    const state = useConfigPanelStore.getState().getState();

    expect(state).toEqual({
      configName: { value: 'newName' },
      power: { value: 15 },
      repeat: { value: 1 },
      speed: { value: 20 },
      zStep: { value: 0 },
    });
  });
});
